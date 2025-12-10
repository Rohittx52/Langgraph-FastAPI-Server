LangGraph-FastAPI Server

A fully modular, production-ready FastAPI backend that replicates LangGraph server utilities — providing asynchronous workflow execution, real-time event streaming, persistent storage, and clean service-oriented architecture.

This project is built for advanced workflow orchestration and can serve as a backend foundation for AI agents, LangGraph-like systems, automation frameworks, and distributed pipelines.

High-Level Architecture Diagram
flowchart TD

    %% User Layer
    A[User Creates Run\nvia Frontend Dashboard] --> B[Frontend Sends POST /api/runs]

    %% API Gateway
    B --> C[FastAPI Router\n/api/runs]

    %% Run Creation
    C --> D[Run Manager\n• Create Run ID\n• Save to DB\n• Set status=pending]

    D --> E[Task Queue\nAsync Worker]
    E --> F[Workflow Engine\n_Execute Workflow_]

    %% Workflow Execution Phases
    F --> G[Node Execution\n(parse / compute / logic)]
    G --> H[Checkpoint Store\nSave step state]

    F --> I[Artifact Store\nStore final outputs]

    %% Database / State writes
    H --> J[(SQLite\nfastgraph.db)]
    I --> J

    %% Live WebSocket Feeds
    F --> K[Stream Manager\nBroadcast Events]
    K --> L[Frontend WebSocket Listener\n/ws/{run_id}]

    %% Frontend UI updates
    L --> M[Dashboard Updates:\n• Status\n• Events\n• Result\n• Artifacts]

    %% Completion
    F --> N[Set Run Status = completed]
    N --> M

Workflow Execution Diagram
USER → Create Run (API)
        |
        ▼
FastGraph Backend
        |
        |-- 1. RunManager.create() → save run to DB
        |
        |-- 2. TaskQueue.add_task() → schedule async workflow
        |
        |-- 3. WS: broadcast "started"
        |
        |-- 4. Workflow steps execute:
        |        parse → analyze → save states/checkpoints
        |
        |-- 5. ArtifactService.save() → result.json
        |
        |-- 6. RunManager.update(status="completed")
        |
        |-- 7. WS: broadcast "completed"
        |
        ▼
FRONTEND: Shows real-time logs, steps, result, artifacts

Overview

This project recreates the LangGraph server behavior using FastAPI, but with a cleaner architecture and fully async execution pipeline.

Core Capabilities
Feature	Description
Async workflow execution	Powered by a custom in-memory task queue
Run management	Create, update, list, and track workflow runs
Persistent artifacts	Store workflow outputs as JSON/files
Checkpointing	Save intermediate workflow steps
State management	Maintain workflow state throughout execution
WebSocket streaming	Real-time event updates to the dashboard
Async SQLAlchemy ORM	SQLite + aiosqlite backend
Modular architecture	Clean separation of API, services, utils, models
Project Structure
langgraph-server/
├── app/
│   ├── main.py                    # FastAPI initialization
│   ├── database.py                # Async DB setup
│   ├── api/
│   │   ├── main.py                # Router aggregator
│   │   ├── runs.py                # Run creation/listing
│   │   ├── stream.py              # WebSocket connections
│   ├── models/
│   │   └── run.py                 # SQLAlchemy ORM model
│   ├── schemas/
│   │   └── run.py                 # Pydantic validation models
│   ├── services/
│   │   ├── run_manager.py         # CRUD ops for runs
│   │   ├── workflow_service.py    # Main workflow logic
│   │   ├── artifact_store.py      # Save result artifacts
│   │   ├── checkpoint_store.py    # Save execution checkpoints
│   │   ├── state_services.py      # Maintain run state
│   ├── utils/
│   │   ├── task_queue.py          # Async task queue
│   │   ├── stream_manager.py      # Manage WebSocket clients
│   │   └── config.py              # Configuration helper
│   ├── middleware/
│   │   ├── logging.py             # Request logging
│   │   └── rate_limit.py          # Optional rate limiting
│
├── data/
│   ├── fastgraph.db               # SQLite database
│   ├── artifacts/                 # Final output files
│   ├── checkpoints/               # Execution snapshots
│   └── states/                    # State store
│
├── frontend/                      # React dashboard (Vite + Tailwind)
│
├── .env
├── requirements.txt
└── README.md

API Endpoints
Method	Endpoint	Description
POST	/api/runs/	Create a new workflow run
GET	/api/runs/	List all runs
GET	/api/runs/{id}	Retrieve a specific run
GET	/api/monitoring/health	Health check
WS	/api/ws/{run_id}	Real-time event updates
Installation & Setup
1. Create a virtual environment
python -m venv venv
venv\Scripts\activate     # Windows

2. Install dependencies
pip install -r requirements.txt

3. Initialize the SQLite database
python -m app.init_db

4. Start FastAPI server
uvicorn app.main:app --reload --port 8000

5. Open API docs

Swagger:
http://127.0.0.1:8000/docs

ReDoc:
http://127.0.0.1:8000/redoc

Example Workflow (End-to-End)
1️⃣ Create a Run

POST request:

{
  "name": "test-run-1",
  "payload": { "input": "Hello World" }
}

2️⃣ What Backend Does

saves new run to DB

schedules workflow

streams events (started, node_update, completed)

writes artifact to /data/artifacts/

updates run status → completed

3️⃣ Get Run List
[
  {
    "id": "uuid",
    "name": "test-run-1",
    "status": "completed",
    "result": { "artifact": "uuid_result.json" }
  }
]

Tech Stack
Backend

Python 3.12+

FastAPI (ASGI)

SQLAlchemy (async ORM)

aiosqlite

asyncio

Pydantic v2

WebSockets

Frontend

React (Vite)

TailwindCSS

WebSocket live-stream console

Future Enhancements

User authentication (JWT / API keys)

Distributed task queue (Redis + RQ/Celery)

Postgres support + Alembic migrations

Workflow visual DAG editor

S3-compatible artifact storage

Auto-scaling workers

Author

Rohit Ranjan Kumar