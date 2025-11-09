##  LangGraph-FastAPI Server

A modular, production-ready FastAPI backend that replicates LangGraph server utilities — built for asynchronous, stateful workflow execution with real-time updates.

##  Overview

This project re-implements LangGraph’s server utilities completely in FastAPI.
It provides a robust and extensible foundation for running, tracking, and streaming workflow executions with async task management, persistence, and modular design.

## Core features include:

✅ Async workflow execution via custom task queue

✅ Run management (create, update, list runs)

✅ Checkpointing, artifact storage, and state tracking

✅ Real-time WebSocket event streaming

✅ Clean service-based architecture

✅ Async SQLAlchemy + SQLite (aiosqlite) persistence

## Architecture
langgraph-server/
├── app/
│   ├── main.py                 # FastAPI entrypoint
│   ├── database.py             # Async SQLAlchemy + DB setup
│   ├── api/
│   │   ├── main.py             # Combines all API routers
│   │   ├── runs.py             # Run creation, listing, retrieval
│   │   ├── stream.py           # WebSocket event streaming
│   ├── models/
│   │   └── run.py              # ORM model for Run table
│   ├── schemas/
│   │   └── run.py              # Pydantic schemas for API models
│   ├── services/
│   │   ├── run_manager.py      # CRUD operations for runs
│   │   ├── workflow_service.py # Main workflow orchestration logic
│   │   ├── artifact_store.py   # Save artifacts (outputs)
│   │   ├── checkpoint_store.py # Save checkpoints
│   │   ├── state_services.py   # Manage persistent states
│   ├── utils/
│   │   ├── task_queue.py       # Async task manager
│   │   ├── stream_manager.py   # WebSocket connection manager
│   │   └── config.py           # Config helper
│   ├── middleware/
│   │   ├── logging.py          # Request logging
│   │   └── rate_limit.py       # Optional rate limiter
│
├── data/
│   ├── fastgraph.db            # SQLite database
│   ├── artifacts/              # Final results from runs
│   ├── checkpoints/            # Intermediate checkpoints
│   └── states/                 # Persistent workflow states
│
├── .env                        # Environment variables
├── requirements.txt            # Dependencies
└── README.md                   # Documentation

## Features and Utilities
- Utility	Description
- Run Manager	Creates, tracks, and updates workflow runs
- State Store	Persists intermediate execution state
- Checkpoint Store	Saves step snapshots for recovery
- Stream Manager	Manages WebSocket event streams
- Artifact Store	Stores outputs (JSON, files, etc.)
- Router / API Layer	Exposes REST and WebSocket endpoints
- Task Queue	Handles async background execution

### API Endpoints
- Method	Endpoint	Description
- POST	/api/runs/	Create a new workflow run
- GET	/api/runs/	List all runs
- GET	/api/runs/{id}	Get run details (if implemented)
- GET	/api/monitoring/health	Health check
- WS	/api/ws/{run_id}	WebSocket stream for real-time run updates

## Database
- Backend: SQLite (aiosqlite driver)

- ORM: SQLAlchemy 2.x async

- Models defined in app/models/run.py

- Automatically initialized at startup.

- You can migrate to PostgreSQL or MySQL by editing:
- DATABASE_URL = "sqlite+aiosqlite:///./data/fastgraph.db"
- to
- DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/dbname"

## Installation & Setup
1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate     # (Linux/Mac)
venv\Scripts\activate        # (Windows)

2. Install dependencies
pip install -r requirements.txt

3. Initialize the database
python -m app.init_db

4. Run the FastAPI server
uvicorn app.main:app --reload --port 8000

5. Access the API docs

Swagger UI → http://127.0.0.1:8000/docs

ReDoc → http://127.0.0.1:8000/redoc

## Example Workflow

1️⃣ POST /api/runs/

{
  "name": "test-run-1",
  "payload": { "input": "Hello World" }
}


2️⃣ The server:

Creates a DB record (status="running")

Starts _execute_workflow() in background

Broadcasts started → node_update → completed

Updates the run status to "completed"

3️⃣ GET /api/runs/

[
  {
    "id": "uuid",
    "name": "test-run-1",
    "status": "completed",
    "result": {"artifact": "uuid_result.json"}
  }
]

## Tech Stack

Python 3.12+

FastAPI (ASGI Framework)

SQLAlchemy (async) for ORM

aiosqlite as async DB driver

asyncio for concurrency

WebSockets for real-time updates

Pydantic for validation and serialization

## Future Improvements

 Add user authentication and API keys

 Persistent job queue (Celery / RQ)

 Workflow visualization dashboard

 Real database migrations (Alembic)

 Configurable backend drivers (SQLite → Postgres, local → S3)

## Author
Rohit Ranjan Kumar
