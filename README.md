# C R Rao Campus Management System (AMS)

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/Frontend-React_18-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-green)
![Python](https://img.shields.io/badge/AI_Engine-Python_Flask-yellow)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-success)

A comprehensive, MERN-stack based Campus Management System enriched with an AI-powered Student Chatbot (RAG pipeline). This platform is designed to streamline academic operations, attendance tracking, scheduling, and information retrieval for administrators, faculty, students, and parents.

---

## 🌟 Key Features

### 🔐 Role-Based Access Control
Separate, secure portals for **Admin**, **Faculty**, **Student**, and **Parent** roles, ensuring data privacy and relevant dashboard experiences.

### 🧑‍🏫 Faculty Dashboard
- **Daily Classes**: View auto-fetched timetable for the current day.
- **Attendance Management**: Easily mark and manage student attendance.
- **Academic Resources**: Upload class notes, course materials, and assignments.
- **🤖 Assignment Reflexion Agent**: An intelligent AI agent (powered by LangGraph) that drafts, critiques, and refines high-quality assignments based on uploaded class context.


### 🎓 Student Dashboard
- **Schedule & Timetable**: Track daily classes and subjects.
- **Attendance Insights**: Monitor overall and subject-wise attendance percentages.
- **Feedback System**: Provide end-of-semester feedback securely.
- **🤖 AI Academic Assistant**: A built-in Retrieval-Augmented Generation (RAG) chatbot allowing students to query branch-specific (e.g., CSDS, CSE, CSAIML) study material and context.

### 👨‍👩‍👧‍👦 Parent Portal
- **Child Monitoring**: Track mapped students' attendance and academic profile securely from the parent dashboard.

### ⚙️ Admin Controls
- **Bulk Setup**: Form-based bulk uploads for faculty, courses, and schedules.
- **Entity Management**: Create and map student, parent, and faculty profiles.
- **Curriculum Planning**: Manage Course Masters, Subject Offerings, and Timetables.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** & **Vite**: Fast, module-based frontend rendering.
- **Tailwind CSS** & **Ant Design (antd)**: Modern, responsive UI/UX.
- **Chart.js**: Visual attendance and analytical data representation.

### Backend (Node.js)
- **Express.js**: RESTful API creation.
- **Mongoose / MongoDB**: NoSQL database for flexible data modeling mapping.
- **Bcrypt**: For secure password hashing.

### AI Engine (Python)
- **Flask**: Serves the ModularRAG query engine as an HTTP API.
- **ChromaDB**: Vector database for storing document embeddings.
- **PyTorch & Hugging Face**: Local models for inference.
- **LlamaIndex & LangGraph**: Intelligent retrieval and multi-step agentic reasoning loops.
- **Ollama**: Local LLM inference for privacy and performance.


---

## 📁 Project Structure

```text
C R Rao Campus Management System/
|-- src/                      # React Frontend source code (Components, Pages, UI)
|-- public/                   # Static assets
|-- models/                   # Mongoose Database Models (User, Student, Faculty, etc.)
|-- py_backend/               # Python AI Service (RAG, Flask API, ChromaDB)
|   |-- app.py                # Flask entry point (port defaults to 5001)
|   |-- agents/               # LangGraph Agentic logic (State, Nodes, Workflow)
|   |-- prompts/              # System/Human templates for RAG and Agents
|   |-- query_engine.py       # Modular RAG Pipeline
|   `-- ...                   # Loaders, retrieval logic, and configs
|-- server.js                 # Node.js Express Server entry point (port defaults to 3002)
|-- package.json              # Node dependencies and scripts
`-- README.md                 # Project Documentation
```

---

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Python](https://www.python.org/) (v3.11+)
- [Ollama](https://ollama.ai/) (Required for local LLM inference)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas instance)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Node.js Backend & Frontend Setup
Install dependencies:
```bash
npm install
```

Set up Environment Variables (`.env` in the root folder):
```env
MONGO_URI=your_mongodb_connection_string
PORT=3002
```

Start the Node backend & React frontend concurrently (using Vite & Nodemon):
```bash
# Run the application in development mode
npm run dev
# Alternatively, start backend specifically: npm start
```

### 3. Python AI Engine Setup
Navigate to the Python backend:
```bash
cd py_backend
```

Create a virtual environment:
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Start the Flask Server:
```bash
python app.py
```
*The AI engine will run on port 5001 by default and act as a microservice for the Node.js backend.*

---

## 🔧 Post-Installation / Admin Setup
To initialize the system, use the Admin panel to create `Course Masters`, `Subject Offerings`, and `YrSem` (Year & Semester) mappings.
The AI Chatbot requires vector indices to be built. Ensure the document data ingestion process within `py_backend/ingestion` has been run for specific branches prior to querying.

---

## 📄 License
This original software is provided under the terms specified in the `LICENSE` file. All rights reserved to C R Rao AIMSCS.
