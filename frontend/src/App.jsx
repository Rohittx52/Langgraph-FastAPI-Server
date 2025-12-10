import React, { useEffect, useState, useRef } from "react";

/**
 * FastGraph Dashboard - App.jsx
 * Replace your existing src/App.jsx with this file.
 * Assumes src/index.css contains the provided stylesheet and is imported in main.jsx.
 */

function StatusBadge({ status }) {
  const s = (status || "unknown").toLowerCase();
  const cls = {
    pending: "badge pending",
    running: "badge running",
    completed: "badge completed",
    failed: "badge failed",
  }[s] ?? "badge unknown";
  return <span className={cls}>{(status || "UNKNOWN").toUpperCase()}</span>;
}

export default function App() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [payloadText, setPayloadText] = useState('{ "input": "hello" }');
  const [selectedRun, setSelectedRun] = useState(null);
  const wsRef = useRef(null);
  const eventsRef = useRef({}); // runId -> events array
  const [wsStatus, setWsStatus] = useState("disconnected");

  useEffect(() => {
    fetchRuns();
    const id = setInterval(fetchRuns, 5000);
    return () => {
      clearInterval(id);
      if (wsRef.current) try { wsRef.current.close(); } catch(_) {}
    };
  }, []);

  async function fetchRuns() {
    setLoading(true);
    try {
      const res = await fetch("/api/runs/");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Ensure consistent shape and stable sort
      const normalized = Array.isArray(data) ? data : [];
      normalized.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      setRuns(normalized);
    } catch (err) {
      console.error("fetchRuns:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRun(e) {
    e.preventDefault();
    setCreating(true);
    try {
      let payload = {};
      try { payload = JSON.parse(payloadText); } catch (parseErr) { payload = { raw: payloadText }; }
      const body = { name: name || `run-${Date.now()}`, payload };
      const res = await fetch("/api/runs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Create failed: ${res.status}`);
      }
      const data = await res.json();
      // refresh runs & open created run
      await fetchRuns();
      if (data.run_id) {
        openRun(data.run_id);
      } else if (data.id) {
        openRun(data.id);
      }
    } catch (err) {
      console.error("createRun:", err);
      alert("Failed to create run: " + (err.message || err));
    } finally {
      setCreating(false);
    }
  }

  function openRun(runId) {
    setSelectedRun(runId);
    eventsRef.current[runId] = eventsRef.current[runId] || [];
    attachWS(runId);
  }

  function attachWS(runId) {
    // close previous socket (if different)
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
      setWsStatus("disconnected");
    }

    const wsUrl = getWsUrl(`/api/ws/${runId}`);
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setWsStatus("connected");
        console.info("WS open", runId);
      });

      ws.addEventListener("message", (ev) => {
        try {
          const json = JSON.parse(ev.data);
          eventsRef.current[runId] = eventsRef.current[runId] || [];
          eventsRef.current[runId].push(json);
          // keep runs list fresh if a status change/event indicates update
          if (json.type === "completed" || json.type === "cancelled" || json.type === "failed" || json.type === "started" || json.type === "node_update") {
            fetchRuns();
          }
          // Force minimal re-render
          setRuns(r => [...r]);
        } catch (e) {
          console.log("ws message parse error:", e, ev.data);
        }
      });

      ws.addEventListener("close", () => {
        setWsStatus("disconnected");
        console.info("WS closed", runId);
      });

      ws.addEventListener("error", (e) => {
        setWsStatus("error");
        console.error("WS error", e);
      });
    } catch (e) {
      console.error("attachWS error", e);
      setWsStatus("error");
    }
  }

  function getWsUrl(path) {
    const p = window.location;
    const protocol = p.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${p.host}${path}`;
  }

  function humanTime(ts) {
    if (!ts) return "-";
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
  }

  // events for selected run
  const selectedEvents = (selectedRun && eventsRef.current[selectedRun]) ? eventsRef.current[selectedRun] : [];

  return (
    <div className="app-container">
      <div className="header">
        <div>
          <h1>FastGraph — Runs Dashboard</h1>
          <div className="sub">API: <code>/api</code></div>
        </div>
        <div className="small">Socket: <strong style={{marginLeft:8}}>{wsStatus}</strong></div>
      </div>

      <div className="app-grid">
        {/* LEFT: controls */}
        <div className="card controls">
          <h2 style={{margin:0, marginBottom:10}}>Create Run</h2>

          <form onSubmit={handleCreateRun} className="col">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Run name (optional)"
              className="input"
            />
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="input"
            />
            <div style={{display:"flex", gap:10}}>
              <button type="submit" className="btn" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => { setPayloadText('{ "input": "hello" }'); setName(""); }}
              >
                Reset
              </button>
            </div>
          </form>

          <div className="helper" style={{marginTop:12}}>Click a run in the list to open live details and events.</div>

          <hr style={{margin:"12px 0", border:"none", borderTop:"1px solid rgba(255,255,255,0.03)"}} />

          <div>
            <h3 style={{margin:"6px 0 10px 0"}}>Recent Runs</h3>
            <div className="run-list">
              {loading && <div className="small">Loading runs…</div>}
              {(!loading && runs.length === 0) && <div className="small">No runs yet.</div>}
              {runs.map((r) => (
                <div
                  key={r.id}
                  className="run-item"
                  style={{ borderColor: selectedRun === r.id ? "rgba(59,130,246,0.12)" : undefined, cursor: "pointer" }}
                  onClick={() => openRun(r.id)}
                >
                  <div style={{flex:1}}>
                    <div className="run-title">{r.name || r.id}</div>
                    <div className="run-meta">
                      <span style={{marginRight:8}}>{humanTime(r.created_at)}</span>
                      <span style={{marginRight:8}}>•</span>
                      <span className="small">meta: {JSON.stringify(r.run_meta || r.meta || {})}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: details */}
        <div className="card">
          <h2 style={{marginTop:0}}>Run Details & Events</h2>

          {!selectedRun ? (
            <div className="small">Select a run from the left to view events and details.</div>
          ) : (
            <div className="col">
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12}}>
                <div>
                  <div style={{fontWeight:700}}>{runs.find(r => r.id === selectedRun)?.name || selectedRun}</div>
                  <div className="small">ID: <code>{selectedRun}</code></div>
                </div>
                <div style={{textAlign:"right"}}>
                  <StatusBadge status={runs.find(r => r.id === selectedRun)?.status} />
                </div>
              </div>

              <div style={{marginTop:12, display:"grid", gridTemplateColumns:"1fr 360px", gap:12}}>
                <div className="console card" style={{padding:10}}>
                  <div className="small" style={{marginBottom:8}}>Events ({selectedEvents.length})</div>
                  {selectedEvents.length === 0 ? (
                    <div className="small">Waiting for events…</div>
                  ) : (
                    selectedEvents.map((ev, i) => (
                      <div key={i} className="line" style={{marginBottom:8}}>
                        <div style={{fontSize:12, color:"var(--muted)", marginBottom:6}}>[{ev.type || "event"}] {ev.node ? ` ${ev.node}` : ""} • {ev.ts ? new Date(ev.ts).toLocaleTimeString() : ""}</div>
                        <pre style={{whiteSpace:"pre-wrap", margin:0, fontSize:13, color:"var(--text)"}}>{JSON.stringify(ev, null, 2)}</pre>
                      </div>
                    ))
                  )}
                </div>

                <div className="card" style={{padding:12}}>
                  <div style={{fontWeight:700, marginBottom:8}}>Meta & Result</div>
                  <div className="small"><strong>Meta:</strong> {JSON.stringify(runs.find(r => r.id === selectedRun)?.run_meta || runs.find(r => r.id === selectedRun)?.meta || {})}</div>
                  <div className="small" style={{marginTop:8}}><strong>Result:</strong> {runs.find(r => r.id === selectedRun)?.result ? JSON.stringify(runs.find(r => r.id === selectedRun).result) : "-"}</div>
                  {runs.find(r => r.id === selectedRun)?.result?.artifact && (
                    <div style={{marginTop:12}}>
                      <a className="btn" href={`/api/artifacts/${runs.find(r => r.id === selectedRun).result.artifact}`}>Download Artifact</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="app-footer">FastGraph Dashboard • connects to <code>/api</code></div>
        </div>
      </div>
    </div>
  );
}
