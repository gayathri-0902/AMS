# C R Rao Campus Management System (CMS)

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-Proprietary-red)
![React](https://img.shields.io/badge/Frontend-React_18-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-green)
![Python](https://img.shields.io/badge/AI_Engine-Python_Flask-yellow)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-success)

A comprehensive, MERN-stack based Campus Management System enriched with an AI-powered Assignment Generation Engine and Student Chatbot (RAG pipeline). Designed to streamline academic operations, attendance tracking, scheduling, assignment workflows, and information retrieval for Faculty and Students.

---

## 👥 Team

This project was developed at **C R Rao Advanced Institute of Mathematics, Statistics and Computer Science (AIMSCS), Telangana, India**.

| Name | Role | Contact |
|---|---|---|
| **Apoorva Pothakamuri** | Developer | apurvarao47@gmail.com |
| **Amkam Dharani** | Developer | dharaniamkam@gmail.com |
| **Gayathri Settipalli** | Developer | gayathrisettipalli2@gmail.com |
| **Shaik Zaheer Hussain** | Developer | zaheerhussain160304@gmail.com |
| **Dr. G. Padmavathi** | Project Supervisor | padmagvathi@gmail.com |

> © 2026 Apoorva Pothakamuri, Amkam Dharani, Gayathri Settipalli, Shaik Zaheer Hussain & Dr. G. Padmavathi. All Rights Reserved.

---

## 🌟 Key Features

### 🔐 Role-Based Access Control
Separate, secure portals for **Admin**, **Faculty**, **Student**, and **Parent** roles, ensuring data privacy and relevant dashboard experiences.

---

### 🧑‍🏫 Faculty Dashboard
- **Daily Classes**: View auto-fetched timetable for the current live day.
- **Attendance Management**: Mark and manage student attendance per session.
- **Academic Resources**: Upload class notes, course materials, and manual assignments (Drive link-based).
- **🤖 AI Assignment Hub**: An intelligent AI agent powered by a **LangGraph Reflexion Loop** that:
  - Parses free-form faculty instructions (e.g., *"3 NLP coding questions, easy level"*).
  - Retrieves relevant academic context from the branch's vector knowledge base (Hybrid RAG).
  - Drafts → Critiques → Revises the assignment automatically until quality passes.
  - Supports **MCQ**, **Written**, and **Coding** assignment types, each with distinct schemas and prompts.
  - Previews the generated assignment before publishing to class.
  - Publishes via a `/save` endpoint that **never re-triggers generation** — guarantees idempotency.

---

### 🎓 Student Dashboard
- **Schedule & Timetable**: Track daily classes and subjects.
- **Attendance Insights**: Monitor overall and subject-wise attendance percentages.
- **Pending Assignments**: Lists active assignments not yet submitted, uniquely deduplicated across consecutive faculty sessions.
- **📝 HandIn (Submission Portal)**:
  - MCQ: Interactive option selection, auto-graded on submission.
  - Written/Coding: Question + starter code display, link-based submission (Google Drive / GitHub).
  - **Link Editing**: Students can update their submitted link before the deadline.
  - **Deadline Enforcement**: Past-deadline assignments show a locked "Missed Deadline" state; submissions and edits are blocked server-side.
- **🤖 AI Academic Assistant**: A built-in RAG chatbot for querying branch-specific study material.
- **Feedback System**: End-of-semester feedback submission.

---

### 👨‍👩‍👧‍👦 Parent Portal
- Track mapped students' attendance and academic profiles.

### ⚙️ Admin Controls
- Bulk uploads for faculty, courses, and schedules.
- Create and map student, parent, and faculty profiles.
- Manage Course Masters, Subject Offerings, and Timetables.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** & **Vite**: Fast, module-based frontend rendering.
- **Tailwind CSS**: Utility-first, design-system-level styling.
- **Chart.js**: Visual attendance and analytical data representation.

### Backend (Node.js)
- **Express.js**: RESTful API creation.
- **Mongoose / MongoDB**: NoSQL database for flexible data modeling.
- **Bcrypt**: Secure password hashing.
- **Axios**: Used internally for streaming proxy calls from Node → Python Flask.

### AI Engine (Python Flask — `py_backend/`)
- **Flask**: Serves the RAG query engine and Assignment Agent as SSE HTTP APIs.
- **ChromaDB**: Vector database for document embeddings.
- **LlamaIndex**: Document loading, indexing, and hybrid retrieval (Vector + BM25).
- **LangGraph**: Multi-step Reflexion Agent loop (Draft → Critic → Revise → End).
- **LangChain**: Structured output binding (Pydantic models) for reliable JSON generation.
- **Ollama**: Local LLM inference for privacy and performance.

---

## 📁 Project Structure

```text
AMS/
├── src/                          # React Frontend
│   └── components/
│       ├── AssignmentHub.jsx     # Faculty AI Assignment generation & publish
│       ├── HandIn.jsx            # Student submission portal
│       ├── AssignmentGrader.jsx  # Faculty grading view
│       ├── StudentDashboard.jsx  # Student home
│       └── FacultyDashboard.jsx  # Faculty home
├── models/                       # Mongoose Schemas
│   ├── Assignment.js             # AI_Generated / Manual_Upload assignments
│   └── Submission.js             # Student submission records
├── routes/                       # Express API Routes
│   ├── assignmentRoutes.js       # /generate, /save, /manual, /subject/:id, etc.
│   └── submissionRoutes.js       # /submit, /grade, /:id/link (deadline-enforced)
├── py_backend/                   # Python AI Microservice
│   ├── app.py                    # Flask entry point (SSE streaming)
│   ├── agents/
│   │   └── assignment_agent.py   # LangGraph Reflexion Agent
│   ├── prompts/
│   │   └── assignment_prompts.py # MCQ / Written / Coding prompt templates
│   ├── query_engine.py           # Hybrid RAG pipeline (Vector + BM25)
│   └── llm_loaders/              # Pluggable LLM backends (Ollama, Local)
├── server.js                     # Node.js Express entry point (port 3002)
├── LICENSE                       # Proprietary License — All Rights Reserved
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Python](https://www.python.org/) (v3.11+)
- [Ollama](https://ollama.ai/) — pull your model: `ollama pull llama3.2:3b`
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AMS
```

### 2. Node.js Backend & Frontend
```bash
npm install
```

Create `.env` in the project root:
```env
MONGO_URI=your_mongodb_connection_string
PORT=3002
FLASK_API_URL=http://localhost:5001
```

```bash
npm run dev      # Start Vite dev server
npm start        # Start Node.js backend (nodemon)
```

### 3. Python AI Engine
```bash
cd py_backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python app.py    # Starts Flask on port 5001
```

---

## 🔑 Key API Endpoints

### Assignment Routes (`/api/assignment/`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/generate` | Stream AI generation via SSE (proxied to Flask) |
| `POST` | `/save` | Save a pre-generated assignment (no re-generation) |
| `POST` | `/manual` | Create a link-based manual assignment |
| `GET` | `/subject/:id` | Fetch all active assignments for a subject |
| `GET` | `/:id` | Fetch a single assignment |
| `PATCH` | `/:id/deadline` | Extend the submission deadline |
| `DELETE` | `/:id` | Delete an assignment |

### Submission Routes (`/api/submission/`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/submit` | Submit an assignment (deadline-enforced) |
| `GET` | `/student/:id/assignment/:id` | Check if a student has submitted |
| `PATCH` | `/:id/link` | Update a submitted link (deadline-enforced) |
| `PATCH` | `/:id/grade` | Faculty manually grades a submission |

---

## 🔧 Post-Installation / Admin Setup
Use the Admin panel to create `Course Masters`, `Subject Offerings`, and `YrSem` mappings before any faculty/student login.

The AI Assignment Hub requires the vector knowledge base to be built first. Run the ingestion pipeline inside `py_backend/` for the target branch/year combination before generating assignments.

---

## 📄 License

This software is **proprietary** and protected under a custom All Rights Reserved license.

> **Copyright © 2026 Apoorva Pothakamuri, Amkam Dharani, Gayathri Settipalli, Shaik Zaheer Hussain & Dr. G. Padmavathi.**
> No part of this software may be copied, modified, distributed, or used without explicit written permission from all copyright holders.

See the [`LICENSE`](./LICENSE) file for full terms.
