# 🚀 LangGraph-FastAPI Server

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**A fully modular, production-ready FastAPI backend that replicates LangGraph server utilities**

*Providing asynchronous workflow execution, real-time event streaming, persistent storage, and clean service-oriented architecture*

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-endpoints) • [Roadmap](#-roadmap)

</div>

---

## 📋 Overview

This project recreates the **LangGraph server** behavior using FastAPI, delivering a cleaner architecture with a fully async execution pipeline. Built for advanced workflow orchestration, it serves as a backend foundation for:

- 🤖 **AI Agent Systems**
- 🔄 **LangGraph-like Workflows**
- ⚙️ **Automation Frameworks**
- 🌐 **Distributed Pipelines**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Async Workflow Execution** | Powered by custom in-memory task queue |
| 📊 **Run Management** | Create, update, list, and track workflow runs |
| 💾 **Persistent Artifacts** | Store workflow outputs as JSON/files |
| 📍 **Checkpointing** | Save intermediate workflow steps |
| 🗂️ **State Management** | Maintain workflow state throughout execution |
| 🌐 **WebSocket Streaming** | Real-time event updates to dashboard |
| 🗄️ **Async SQLAlchemy ORM** | SQLite + aiosqlite backend |
| 🏗️ **Modular Architecture** | Clean separation: API → Services → Utils → Models |

---

## 🏛️ Architecture

### System Architecture Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ffedce', 'edgeLabelBackground':'#ffffff', 'tertiaryColor': '#f4f4f4'}}}%%
graph TD
    %% Define Nodes
    Client["Client<br>Swagger / Frontend / curl"]
    
    subgraph API_Service ["API Service (FastAPI)"]
        Router["FastAPI Router<br>POST /api/runs/"]
        Pydantic("Pydantic Validation")
        Manager["Run Manager"]
        WS["WebSocket Endpoint<br>/api/ws/{run_id}"]
    end
    
    DB[("Database")]
    Queue>"Task Queue<br>(async worker)"]
    Artifacts[["Artifact Store<br>S3 / Blob Storage"]]

    %% Main Request Flow
    Client -- 1. POST request --> Router
    Router --> Pydantic
    Pydantic -- Validated --> Manager
    Manager -- 2. Insert run record<br>(status=running) --> DB
    Manager -- 3. Enqueue Job --> Queue

    %% Async Execution Flow
    Queue -- 4. Execute Workflow<br>& Emit Events --> WS
    WS -.- 5. Stream Updates<br>(started → node_update → completed) .-> Client

    %% Completion Flow
    Queue -- 6. Save result JSON --> Artifacts
    Artifacts -.->|Link to artifact| Queue
    Queue -- 7. Final Update<br>(status=completed, result link) --> DB

    %% Styling
    classDef storage fill:#e1edff,stroke:#4a7ebb,stroke-width:2px;
    classDef async fill:#e8d4ff,stroke:#8a4abb,stroke-width:2px;
    class DB,Artifacts storage;
    class Queue,WS async;
```

### Workflow Execution Flow

```
USER → Create Run (API)
        │
        ▼
FastGraph Backend
        │
        ├─ 1. RunManager.create() → save run to DB
        │
        ├─ 2. TaskQueue.add_task() → schedule async workflow
        │
        ├─ 3. WS: broadcast "started"
        │
        ├─ 4. Workflow steps execute:
        │        parse → analyze → save states/checkpoints
        │
        ├─ 5. ArtifactService.save() → result.json
        │
        ├─ 6. RunManager.update(status="completed")
        │
        └─ 7. WS: broadcast "completed"
        │
        ▼
FRONTEND: Shows real-time logs, steps, result, artifacts
```

---

## 📁 Project Structure

```
langgraph-server/
├── app/
│   ├── main.py                    # FastAPI initialization
│   ├── database.py                # Async DB setup
│   │
│   ├── api/
│   │   ├── main.py                # Router aggregator
│   │   ├── endpoints/
│   │   │   ├── runs.py            # Run creation/listing
│   │   │   └── ...
│   │   └── stream.py              # WebSocket connections
│   │
│   ├── models/
│   │   └── run.py                 # SQLAlchemy ORM model
│   │
│   ├── schemas/
│   │   └── run.py                 # Pydantic validation models
│   │
│   ├── services/
│   │   ├── run_manager.py         # CRUD ops for runs
│   │   ├── workflow_service.py    # Main workflow logic
│   │   ├── artifact_store.py      # Save result artifacts
│   │   ├── checkpoint_store.py    # Save execution checkpoints
│   │   └── state_services.py      # Maintain run state
│   │
│   ├── utils/
│   │   ├── task_queue.py          # Async task queue
│   │   ├── stream_manager.py      # Manage WebSocket clients
│   │   └── logger.py              # Logging utilities
│   │
│   └── middleware/
│       ├── logging.py             # Request logging
│       └── rate_limit.py          # Optional rate limiting
│
├── data/
│   ├── fastgraph.db               # SQLite database
│   ├── artifacts/                 # Final output files
│   ├── checkpoints/               # Execution snapshots
│   └── states/                    # State store
│
├── frontend/                      # React dashboard (Vite + Tailwind)
├── .env
├── requirements.txt
└── test_run.py
```

---

## 🚀 Installation

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** (for frontend)
- **Git**

### Backend Setup

```powershell
# Clone the repository
git clone https://github.com/OrydleAI/Langgraph-FastAPI-Server.git
cd Langgraph-FastAPI-Server/langgraph-server

# Create virtual environment
python -m venv venv
venv\Scripts\activate     # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -m app.init_db

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

See [Frontend README](frontend/README.md) for detailed instructions.

```powershell
cd frontend
npm install
npm run dev
```

---

## 📖 Usage

### Access the Application

| Service | URL |
|---------|-----|
| 🌐 **Frontend Dashboard** | http://localhost:5173 |
| 📚 **API Swagger Docs** | http://127.0.0.1:8000/docs |
| 📖 **API ReDoc** | http://127.0.0.1:8000/redoc |
| ❤️ **Health Check** | http://127.0.0.1:8000/api/monitoring/health |

### Example Workflow (End-to-End)

#### 1️⃣ Create a Run

**POST** `http://127.0.0.1:8000/api/runs/`

```json
{
  "name": "test-run-1",
  "payload": { "input": "Hello World" }
}
```

**Response:**

```json
{
  "run_id": "uuid-here"
}
```

#### 2️⃣ Backend Processing

The backend automatically:

1. ✅ Saves new run to database
2. ⚡ Schedules workflow execution
3. 📡 Streams events: `started` → `node_update` → `completed`
4. 💾 Writes artifact to `/data/artifacts/`
5. ✨ Updates run status to `completed`

#### 3️⃣ Retrieve Runs

**GET** `http://127.0.0.1:8000/api/runs/`

```json
[
  {
    "id": "uuid-here",
    "name": "test-run-1",
    "status": "completed",
    "created_at": "2025-12-10T12:00:00Z",
    "meta": {},
    "result": { "artifact": "uuid_result.json" }
  }
]
```

### Test Script

```powershell
# Install requests library
pip install requests

# Run test
python test_run.py
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/runs/` | Create a new workflow run |
| **GET** | `/api/runs/` | List all runs |
| **GET** | `/api/runs/{id}` | Retrieve a specific run |
| **GET** | `/api/monitoring/health` | Health check endpoint |
| **WS** | `/api/ws/{run_id}` | Real-time event updates via WebSocket |
| **GET** | `/api/artifacts/{artifact_id}` | Download artifact files |

### WebSocket Event Format

```json
{
  "event": "started|node_update|completed|failed|cancelled",
  "run_id": "uuid",
  "node": "parse",
  "artifact": "artifact_id"
}
```

---

## 🛠️ Tech Stack

### Backend

- **Python 3.12+**
- **FastAPI** (ASGI web framework)
- **SQLAlchemy** (Async ORM)
- **aiosqlite** (Async SQLite driver)
- **Pydantic v2** (Data validation)
- **WebSockets** (Real-time streaming)
- **asyncio** (Async task execution)

### Frontend

- **React 19**
- **Vite** (Build tool)
- **TailwindCSS** (Styling)
- **WebSocket API** (Live updates)

---

## 🗺️ Roadmap

- [ ] 🔐 User authentication (JWT / API keys)
- [ ] 🔄 Distributed task queue (Redis + RQ/Celery)
- [ ] 🐘 PostgreSQL support + Alembic migrations
- [ ] 🎨 Workflow visual DAG editor
- [ ] ☁️ S3-compatible artifact storage
- [ ] 📈 Auto-scaling workers
- [ ] 🐳 Docker & Docker Compose setup
- [ ] ☸️ Kubernetes deployment configs
- [ ] 📊 Monitoring & observability (Prometheus/Grafana)
- [ ] 🧪 Comprehensive test suite

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Rohit Ranjan Kumar**

- GitHub: [@OrydleAI](https://github.com/OrydleAI)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by [OrydleAI](https://github.com/OrydleAI)

</div>
