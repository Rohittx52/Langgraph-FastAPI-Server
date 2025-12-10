FastGraph Server — Async Workflow Engine (LangGraph-style)

A modular, production-ready FastAPI + Async backend that replicates core LangGraph server features.
Supports async task execution, run tracking, artifact storage, checkpointing, state management, and real-time WebSocket streaming — paired with a clean React + Tailwind dashboard frontend.

🚀 Key Features
Backend

Async workflow execution via custom task queue

Run Manager (create, update, list, fetch run by ID)

State Store for saving intermediate workflow states

Checkpoint Store for step-level snapshots

Artifact Store for final outputs

Real-time WebSocket event streaming

Async SQLAlchemy (SQLite) persistence

Clean service-based architecture

Frontend

Fully functional dashboard built using React + Tailwind

Live WebSocket feed for run updates

Artifact download + run details

Modern UI with dark theme

📁 Project Structure
langgraph-server/
│
├── app/
│   ├── main.py                 # FastAPI app entrypoint
│   ├── database.py             # SQLAlchemy + SQLite async setup
│   ├── api/
│   │   ├── main.py             # Root API router (aggregates endpoints)
│   │   ├── endpoints/
│   │   │   ├── runs.py         # Run creation, list, fetch-by-id
│   │   │   ├── artifacts.py    # Artifact retrieval
│   │   │   ├── websocket.py    # WS for live updates
│   │   │   ├── workflows.py    # (optional future workflows)
│   │   │   └── monitoring.py   # Health check
│   │
│   ├── models/
│   │   └── run.py              # ORM model for Run table
│   ├── schemas/
│   │   └── run.py              # Pydantic schemas
│   ├── services/
│   │   ├── run_manager.py      # CRUD operations for runs
│   │   ├── workflow_service.py # _execute_workflow logic
│   │   ├── artifact_store.py   # Store final artifacts
│   │   ├── checkpoint_store.py # Save checkpoints
│   │   └── state_services.py   # Save run states
│   ├── utils/
│   │   ├── task_queue.py       # Async background task manager
│   │   ├── stream_manager.py   # WebSocket broadcaster
│   │   └── config.py           # App configuration loader
│   ├── middleware/
│   │   ├── logging.py
│   │   └── rate_limit.py
│
├── data/
│   ├── fastgraph.db            # SQLite DB (auto-created)
│   ├── artifacts/              # Final result files
│   ├── checkpoints/            # Intermediate checkpoints
│   └── states/                 # Persisted state snapshots
│
├── frontend/                   # React + Tailwind dashboard
│
├── requirements.txt
├── .env
└── README.md

📊 Workflow Diagram (How Everything Works)

This diagram shows the full lifecycle: user request → DB entry → task execution → WebSocket streaming → artifact output.

flowchart TD

%% Input
A[User / Frontend Dashboard] -->|POST /api/runs| B[Runs API]

%% Run Creation
B --> C[Run Manager\nCreate Run Entry]
C -->|Insert into DB| D[(SQLite DB)]

%% Schedule Workflow
C -->|Add async task| E[Task Queue]

%% Background Execution
E --> F[_execute_workflow(run_id, payload)]

%% Workflow Steps
F --> G[State Store\nsave state]
F --> H[Checkpoint Store\nsave checkpoint]
F --> I[Artifact Store\ncreate artifact]

%% Updates to DB
F -->|Update status| D

%% Real-time Streaming
F -->|Broadcast events| J[WebSocket Stream Manager]
J --> K[Connected Frontend Clients]

%% Frontend UI
K --> L[Live Events View]
D --> M[Runs List / Run Details]
I --> N[Download Artifact]


🔁 Run Lifecycle Explained
1. User creates a run

Frontend or client sends:

POST /api/runs/
{
  "name": "Test Run",
  "payload": { "input": "hello" }
}

2. Backend creates DB entry

Generates UUID

Inserts row into SQLite (status="running")

Stores metadata

Returns the run_id

3. Background workflow starts

The run is pushed to the async task queue, which executes:

_execute_workflow(run_id, payload)


This function performs:

broadcast "started"

simulate steps

save state + checkpoint

generate artifact

update DB status → "completed"

broadcast "completed"

4. Real-time updates through WebSocket

Frontend listens at:

ws://localhost:8000/api/ws/{run_id}


Receives events like:

{ "event": "started" }
{ "event": "node_update", "node": "parse" }
{ "event": "completed" }

5. User downloads final artifact

Artifact stored in:

data/artifacts/{runid_hash_result.json}


API:

GET /api/artifacts/{artifact_id}

⚙️ Installation & Setup
1. Create virtual environment
python -m venv venv
source venv/bin/activate     # Linux/Mac
venv\Scripts\activate        # Windows

2. Install dependencies
pip install -r requirements.txt

3. Initialize database
python -m app.init_db

4. Start FastAPI server
uvicorn app.main:app --reload --port 8000


Backend available at:

Swagger UI → http://127.0.0.1:8000/docs

ReDoc → http://127.0.0.1:8000/redoc

🎨 Frontend Setup (React + Tailwind Dashboard)
cd frontend
npm install
npm run dev


Default:

http://localhost:5173


The dashboard supports:

Create runs

View live events

WebSocket connection status

Download artifacts

Inspect metadata + results

📡 API Documentation
Create Run
POST /api/runs/


Body:

{
  "name": "run-123",
  "payload": { "input": "hello" }
}

List Runs
GET /api/runs/

Get Run by ID
GET /api/runs/{run_id}

Stream Events
WS /api/ws/{run_id}

Download Artifact
GET /api/artifacts/{artifact_id}

🧪 Testing
Using Python script
python test_run.py


Example Output:

create: 200 {"run_id": "..."}
0 200 {"id": "...", "status": "running"}
found run: {...}

Using PowerShell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/runs/" `
  -Method POST -ContentType "application/json" `
  -Body '{"name":"smoke","payload":{"input":"hello"}}'

🛠️ Tech Stack

FastAPI (ASGI)

Async SQLAlchemy + aiosqlite

asyncio task queue

WebSockets

React + Tailwind frontend

SQLite persistence layer

📌 Future Enhancements

Authentication (API keys / JWT)

Persistent distributed queue (Redis / Celery)

Visual workflow editor

Cloud artifact storage (S3, GCS)

Alembic migrations

👤 Author

Rohit Ranjan Kumar