import React, { useEffect, useState, useRef } from "react";
import "./App.css";

export default function App() {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  // Chat memory
  const messagesRef = useRef({});          // thread_id -> [{role, content}]
  const assistantBufferRef = useRef({});   // thread_id -> string

  /* ----------------------------- EFFECTS ----------------------------- */

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 5000);
    return () => {
      clearInterval(interval);
      // Cleanup WebSocket on unmount
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedRunId, messagesRef.current[selectedRunId]?.length]);

  /* ----------------------------- API ----------------------------- */

  async function fetchRuns() {
    try {
      const res = await fetch("/api/runs/");
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        );
        setRuns(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    // If no thread selected, create a new one
    let threadId = selectedRunId;
    if (!threadId) {
      threadId = `thread-${Date.now()}`;
      setSelectedRunId(threadId);
      messagesRef.current[threadId] = [];
      connectWs(threadId);
    }

    // Add user message to UI immediately
    messagesRef.current[threadId].push({
      role: "user",
      content: userMessage,
    });
    assistantBufferRef.current[threadId] = "";
    setRuns((r) => [...r]); // force re-render

    try {
      // Send message to chat API
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

  /* ----------------------------- WS ----------------------------- */

  function selectRun(id) {
    setSelectedRunId(id);
    setMobileMenuOpen(false);

    if (!messagesRef.current[id]) {
      messagesRef.current[id] = [];
      assistantBufferRef.current[id] = "";
    }

    connectWs(id);
    
    // Load chat history from backend
    loadChatHistory(id);
  }

  async function loadChatHistory(threadId) {
    try {
      const res = await fetch(`/api/chat/${threadId}/history`);
      if (res.ok) {
        const history = await res.json();
        messagesRef.current[threadId] = history;
        setRuns((r) => [...r]); // force re-render
      }
    } catch (e) {
      console.error("Error loading history:", e);
    }
  }

  function connectWs(threadId) {
    if (wsRef.current) wsRef.current.close();

    const protocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws/${threadId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => setWsStatus("disconnected");

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);

      // Init buffers
      if (!messagesRef.current[threadId]) {
        messagesRef.current[threadId] = [];
      }
      if (!assistantBufferRef.current[threadId]) {
        assistantBufferRef.current[threadId] = "";
      }

      // STREAMING TOKEN
      if (msg.event === "token") {
        assistantBufferRef.current[threadId] += msg.content;

        const msgs = messagesRef.current[threadId];
        const last = msgs[msgs.length - 1];

        if (last?.role === "assistant" && last.streaming) {
          last.content = assistantBufferRef.current[threadId];
        } else {
          msgs.push({
            role: "assistant",
            content: assistantBufferRef.current[threadId],
            streaming: true,
          });
        }
      }

      // COMPLETION
      if (msg.event === "completed") {
        const msgs = messagesRef.current[threadId];
        const last = msgs[msgs.length - 1];
        if (last) last.streaming = false;
        assistantBufferRef.current[threadId] = ""; // Reset buffer
      }

      // ERROR
      if (msg.event === "error") {
        messagesRef.current[threadId].push({
          role: "system",
          content: msg.error,
        });
      }

      setRuns((r) => [...r]); // force re-render
    };
  }

  /* ----------------------------- RENDER ----------------------------- */

  const selectedRun = runs.find((r) => r.id === selectedRunId);
  const messages = selectedRunId
    ? messagesRef.current[selectedRunId] || []
    : [];

  return (
    <div className="chat-layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1>FastGraph AI</h1>
        </div>

        <div className="history-list">
          {runs.map((run) => (
            <div
              key={run.id}
              onClick={() => selectRun(run.id)}
              className={`history-item ${
                selectedRunId === run.id ? "active" : ""
              }`}
            >
              <div className="history-title">
                {run.name || "Untitled Chat"}
              </div>
              <div className="history-meta">
                <span>{new Date(run.created_at).toLocaleDateString()}</span>
                <span
                  className={`dot ${
                    run.status === "running" ? "animate" : ""
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* CHAT */}
      <main className="main-chat">
        <div className="chat-header">
          <h2>
            {selectedRun ? selectedRun.name : "New Conversation"}
          </h2>
          <span className={`ws-status ${wsStatus === 'connected' ? 'connected' : ''}`}>
            {selectedRun ? wsStatus : 'no thread'}
          </span>
        </div>

        <div className="messages-scroll">
          {!selectedRun ? (
            <div className="empty-state">Start chatting 🚀</div>
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
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* INPUT */}
        <form onSubmit={handleSend} className="chat-form">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
          />
          <button className="send-btn" disabled={loading}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
