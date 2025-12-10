# FastGraph Server

A production‑ready asynchronous workflow execution engine inspired by LangGraph, built using FastAPI with real‑time WebSocket streaming, persistent storage, modular services, and a modern React dashboard.

---

## 1. Purpose

FastGraph provides a complete backend system for managing and executing stateful workflows. It supports background execution, live event streaming, artifacts, checkpoints, and run lifecycle tracking.

This system is ideal for ML pipelines, automation engines, workflow orchestration, and LangGraph‑style stepwise execution.

---

## 2. System Architecture (High‑Level)

The platform is structured into clean, independent layers:

```
Frontend (React Dashboard)
     │              \
     │ REST API       WebSocket Stream
     ▼                 ▼
API Layer (FastAPI Routers)
     ▼
Service Layer (Run Manager, Workflow Engine, State Stores)
     ▼
Persistence Layer (SQLite DB + Filesystem Storage)
```

---

## 3. Full Workflow Diagram

Below is a structured diagram showing how a run flows through the system.

```
User → POST /api/runs → Run Created in DB → TaskQueue schedules workflow
     → _execute_workflow(run_id, payload)
         → Save state
         → Save checkpoint
         → Broadcast WS events
         → Create artifact
         → Update run status
     → Frontend receives live updates over WebSocket
```

A more detailed flow:

```
┌──────────────┐         POST /api/runs        ┌──────────────────┐
│   Frontend    │ ───────────────────────────▶ │    Runs API       │
└──────────────┘                               └──────────────────┘
                                                      │
                                                      ▼
                                        ┌────────────────────────┐
                                        │      Run Manager       │
                                        │ (create DB entry)      │
                                        └────────────────────────┘
                                                      │
                                                      ▼
                                        ┌────────────────────────┐
                                        │     SQLite Database    │
                                        └────────────────────────┘
                                                      │
                                                      ▼
                                        ┌────────────────────────┐
                                        │      Task Queue        │
                                        │ (async background job) │
                                        └────────────────────────┘
                                                      │
                                                      ▼
                                ┌────────────────────────────────────┐
                                │       _execute_workflow()          │
                                │  - save state                      │
                                │  - save checkpoints                │
                                │  - create artifact                 │
                                │  - status transitions              │
                                └────────────────────────────────────┘
                                                      │
                        ┌──────────────────────────────┴──────────────────────────────┐
                        ▼                                                             ▼
             ┌────────────────────────┐                                  ┌──────────────────────────┐
             │ WebSocket Stream Mgr   │                                  │ Final updated DB entry   │
             │ broadcast live events  │                                  │ status = completed       │
             └────────────────────────┘                                  └──────────────────────────┘
                        │
                        ▼
             ┌────────────────────────┐
             │ Frontend Console View │
             │ real‑time logs/events │
             └────────────────────────┘
```

---

## 4. Repository Structure

```
langgraph-server/
│
├── app/
│   ├── main.py                 # FastAPI app entrypoint
│   ├── database.py             # Async SQLAlchemy setup
│   │
│   ├── api/
│   │   ├── main.py             # Central API router
│   │   └── endpoints/
│   │       ├── runs.py         # Run creation, listing, details
│   │       ├── artifacts.py    # Artifact download
│   │       ├── websocket.py    # Live WebSocket events
│   │       ├── workflows.py    # Workflow registry (optional)
│   │       └── monitoring.py   # Health monitoring
│   │
│   ├── models/
│   │   └── run.py              # ORM model for Run table
│   │
│   ├── schemas/
│   │   └── run.py              # Pydantic request/response models
│   │
│   ├── services/
│   │   ├── run_manager.py      # CRUD for runs
│   │   ├── workflow_service.py # Core workflow logic
│   │   ├── state_services.py   # State persistence
│   │   ├── checkpoint_store.py # Checkpoint management
│   │   ├── artifact_store.py   # Artifact storage handler
│   │
│   ├── utils/
│   │   ├── task_queue.py       # Async background execution queue
│   │   ├── stream_manager.py   # WebSocket broadcasting manager
│   │   └── config.py           # Config helper
│   │
│   ├── middleware/
│       ├── logging.py          # Request logging
│       └── rate_limit.py       # Rate limiting
│
├── data/
│   ├── fastgraph.db            # SQLite database
│   ├── artifacts/              # Output artifacts
│   ├── states/                 # State snapshots
│   └── checkpoints/            # Checkpoint snapshots
│
├── frontend/                   # React + Tailwind dashboard
├── requirements.txt
├── .env
└── README.md
```

---

## 5. Backend Components (Detailed)

### 5.1 API Layer

Exposes REST endpoints:

* `POST /api/runs/` – create a workflow run
* `GET  /api/runs/` – list all runs
* `GET  /api/runs/{id}` – get run details
* `GET  /api/artifacts/{id}` – download artifacts
* `WS   /api/ws/{run_id}` – live event streaming
* `GET  /api/monitoring/health` – health status

### 5.2 Run Manager

Handles:

* run creation
* updating status
* writing final result
* retrieving runs

### 5.3 Workflow Engine

Responsible for the execution pipeline:

* load payload
* broadcast start
* save state
* save checkpoint
* run async operations
* generate artifacts
* broadcast completion

### 5.4 Task Queue

A lightweight asynchronous queue that ensures workflows run in the background without blocking the main app.

### 5.5 Stream Manager

Handles:

* WebSocket connections
* subscribing to run channels
* pushing live execution logs/events

### 5.6 Storage Systems

* **SQLite DB** → Run metadata
* **Filesystem** → artifacts, states, checkpoints

---

## 6. API Reference

### Create Run

```
POST /api/runs/
{
  "name": "test-run",
  "payload": { "input": "hello world" }
}
```

Response:

```
{ "run_id": "uuid" }
```

### List Runs

```
GET /api/runs/
```

### WebSocket Events

Messages include:

```
{ "event": "started" }
{ "event": "node_update", "node": "parse" }
{ "event": "completed" }
```

---

## 7. Frontend Dashboard

Located in `/frontend/`, includes:

* Run creation form
* Live run history
* Real‑time console output
* Artifact download interface

Run with:

```
npm install
npm run dev
```

---

## 8. Running the Backend Locally

### Step 1 – Create environment

```
python -m venv venv
venv\Scripts\activate
```

### Step 2 – Install dependencies

```
pip install -r requirements.txt
```

### Step 3 – Start server

```
uvicorn app.main:app --reload --port 8000
```

### Access documentation

* Swagger → [http://localhost:8000/docs](http://localhost:8000/docs)
* ReDoc   → [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 9. Test Script

A small smoke test:

```
python test_run.py
```

Example output:

```
create: 200 {"run_id": "..."}
found run: { "status": "running" }
```

---

## 11. Author
Rohit Ranjan Kumar

---
