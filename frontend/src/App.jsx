import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import logo from "./logo.png";

export default function App() {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  
  // Renaming State
  const [editingRunId, setEditingRunId] = useState(null);
  const [editName, setEditName] = useState("");

  const wsRef = useRef(null);
  const eventsRef = useRef({});
  const bottomRef = useRef(null);
  const editInputRef = useRef(null);
  const messagesRef = useRef({});
  const assistantBufferRef = useRef({});
  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [selectedRunId, messagesRef.current[selectedRunId]?.length]);

  useEffect(() => {
    if (editingRunId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingRunId]);

  async function fetchRuns() {
    try {
      const res = await fetch("/api/runs/");
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        setRuns(data);
      }
    } catch (e) { console.error(e); }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);

    let threadId = selectedRunId;
    
    if (!threadId) {
      try {
        const res = await fetch("/api/runs/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
            payload: {}
          })
        });
        if (res.ok) {
          const data = await res.json();
          threadId = data.run_id || data.id;
          setSelectedRunId(threadId);
          await fetchRuns();
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
        return;
      }
    }

    const userMessage = input;
    setInput("");

    if (!messagesRef.current[threadId]) {
      messagesRef.current[threadId] = [];
    }
    messagesRef.current[threadId].push({
      role: "user",
      content: userMessage,
    });
    assistantBufferRef.current[threadId] = "";
    setRuns((r) => [...r]);

    try {
      await fetch(`/api/chat/${threadId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
    } catch (e) {
      console.error(e);
      messagesRef.current[threadId].push({
        role: "system",
        content: "Error sending message: " + e.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function selectRun(id) {
    if (editingRunId) return;
    setSelectedRunId(id);
    
    // Load chat history from database if not already loaded
    if (!messagesRef.current[id]) {
      try {
        const res = await fetch(`/api/chat/${id}/history`);
        if (res.ok) {
          const history = await res.json();
          messagesRef.current[id] = history.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          setRuns(prev => [...prev]); // Trigger re-render
        } else {
          messagesRef.current[id] = [];
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
        messagesRef.current[id] = [];
      }
    }
    
    // Load artifacts for this run
    loadArtifacts(id);
    
    connectWs(id);
  }

  async function loadArtifacts(runId) {
    try {
      const res = await fetch(`/api/artifacts/run/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setArtifacts(data.artifacts || []);
      } else {
        setArtifacts([]);
      }
    } catch (e) {
      console.error("Failed to load artifacts:", e);
      setArtifacts([]);
    }
  }

  function downloadArtifact(artifactId, filename) {
    const link = document.createElement('a');
    link.href = `/api/artifacts/${artifactId}`;
    link.download = filename;
    link.click();
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async function deleteRun(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      const res = await fetch(`/api/runs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRuns(prev => prev.filter(r => r.id !== id));
        // Clean up messages from memory
        delete messagesRef.current[id];
        delete assistantBufferRef.current[id];
        if (selectedRunId === id) setSelectedRunId(null);
      }
    } catch (err) { console.error(err); }
  }

  function startRename(e, run) {
    e.stopPropagation();
    setEditingRunId(run.id);
    setEditName(run.name || "");
  }

  async function submitRename(e) {
    e.preventDefault();
    if (!editName.trim()) {
      setEditingRunId(null);
      return;
    }
    setRuns(prev => prev.map(r => r.id === editingRunId ? { ...r, name: editName } : r));
    try {
      await fetch(`/api/runs/${editingRunId}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName })
      });
    } catch (err) {
      console.error("Rename failed", err);
      fetchRuns(); 
    } finally {
      setEditingRunId(null);
    }
  }

  function connectWs(id) {
    if (wsRef.current) { try { wsRef.current.close(); } catch(e) {} }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws/${id}`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setWsStatus("connected");
      ws.onclose = () => setWsStatus("disconnected");
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          
          if (msg.event === "token") {
            if (!assistantBufferRef.current[id]) {
              assistantBufferRef.current[id] = "";
              if (!messagesRef.current[id]) {
                messagesRef.current[id] = [];
              }
              messagesRef.current[id].push({
                role: "assistant",
                content: "",
                streaming: true
              });
            }
            assistantBufferRef.current[id] += msg.content;
            const messages = messagesRef.current[id];
            if (messages.length > 0) {
              messages[messages.length - 1].content = assistantBufferRef.current[id];
            }
            setRuns(prev => [...prev]);
          }
          
          if (msg.event === "completed") {
            const messages = messagesRef.current[id];
            if (messages && messages.length > 0) {
              messages[messages.length - 1].streaming = false;
            }
            assistantBufferRef.current[id] = "";
            setRuns(prev => [...prev]);
          }
        } catch (e) {
          console.error("WebSocket message error:", e);
        }
      };
    } catch (e) { console.error(e); }
  }

  const selectedRun = runs.find(r => r.id === selectedRunId);
  const messages = selectedRunId
    ? messagesRef.current[selectedRunId] || []
    : [];

  return (
    <div className="chat-layout">
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="logo-text">FastGraph AI</span>
          <button 
            className="new-chat-btn" 
            onClick={() => { setSelectedRunId(null); setInput(""); }}
            title="New Conversation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div className="history-list">
          {runs.map(run => (
            <div 
              key={run.id} 
              onClick={() => selectRun(run.id)} 
              className={`history-item ${selectedRunId === run.id ? 'active' : ''}`}
            >
              {editingRunId === run.id ? (
                <form onSubmit={submitRename} onClick={e => e.stopPropagation()} style={{width:'100%'}}>
                  <input 
                    ref={editInputRef}
                    className="rename-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={submitRename}
                    autoFocus
                  />
                </form>
              ) : (
                <>
                  <div className="history-content">
                    <span className="history-title" title={run.name}>
                      {run.name || "Untitled Chat"}
                    </span>
                    <span className="history-date">
                      {new Date(run.created_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="sidebar-actions">
                    <button className="action-btn" onClick={(e) => startRename(e, run)} title="Rename">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className="action-btn delete" onClick={(e) => deleteRun(e, run.id)} title="Delete">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="main-chat">
          <div className="chat-header">
            <div className="chat-title">
              <h2>{selectedRun ? (selectedRun.name || "Active Session") : "New Conversation"}</h2>
            </div>
            {selectedRun && (
              <div className={`status-pill ${wsStatus === 'connected' ? '' : 'disconnected'}`}>
                <span className="dot"></span> {selectedRun.status}
              </div>
            )}
          </div>

          <div className="messages-scroll">
            {!selectedRun ? (
              <div className="empty-state">
                <img src={logo} alt="FastGraph AI Logo" className="empty-logo-img" />
                <div className="empty-text">System Initialized. Ready for input.</div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`message-row ${m.role}`}>
                    <div className={`bubble ${m.role}`}>
                      {m.content}
                      {m.streaming && (
                        <span className="cursor">▍</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {selectedRun && artifacts.length > 0 && (
                  <div className="message-row assistant">
                    <div className="artifacts-container">
                      <div className="artifacts-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                          <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                        <span>Generated Files</span>
                        <span className="artifacts-count">{artifacts.length}</span>
                      </div>
                      <div className="artifacts-grid">
                        {artifacts.map((artifact) => (
                          <div 
                            key={artifact.artifact_id} 
                            className="artifact-card"
                            onClick={() => downloadArtifact(artifact.artifact_id, artifact.filename)}
                          >
                            <div className="artifact-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                              </svg>
                            </div>
                            <div className="artifact-details">
                              <span className="artifact-name">{artifact.filename}</span>
                              <span className="artifact-size">{formatFileSize(artifact.size)}</span>
                            </div>
                            <div className="artifact-download-icon">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={bottomRef} />
              </>
            )}
          </div>

          <div className="input-container">
            <form onSubmit={handleSend} className="chat-form">
              <input 
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="send-btn">
                {loading ? (
                  <div style={{width:10, height:10, background:'#fff', borderRadius:'50%', animation:'pulse 0.5s infinite'}}></div>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                )}
              </button>
            </form>
          </div>
      </main>
    </div>
  );
}