# Health Assist AI - Python Flask Backend Architecture

Complete, modular Python Flask backend for the **Health Assist AI** B.Tech Major Project, featuring LangChain, Pinecone Vector Database, SQLite persistence, and JWT authentication.

---

## 📂 Project Architecture

```
flask_backend/
├── app.py                      # Starts Flask, Enables CORS, Registers all API routes
├── database.py                 # Connects Flask to SQLite, Database configuration
├── models.py                   # User table, ChatHistory table, Feedback table
├── config.py                   # Secret keys & environment configuration
├── requirements.txt            # Python pip dependencies
├── .env.example                # Sample environment variables
│
├── routes/                     # Modular API Route Blueprints
│   ├── __init__.py
│   ├── auth.py                 # Register, Login, JWT authentication
│   ├── chat.py                 # Receives question, calls RAG service, saves question + answer
│   ├── history.py              # Gets previous conversations, deletes history, clears history
│   ├── location.py             # Receives lat/lng, finds nearby healthcare facilities
│   └── feedback.py             # Helpful / Not Helpful ratings, user comments
│
└── services/                   # Core Intelligent Business Logic
    ├── __init__.py
    ├── rag_service.py          # LangChain, Pinecone, Embeddings, Medical retrieval, LLM response
    └── location_service.py     # Location/maps service, Nearby hospitals & Haversine distance
```

---

## 🚀 How to Run the Backend (Local Setup)

### 1. Open Terminal & Navigate to Directory
```bash
cd flask_backend
```

### 2. Create and Activate a Python Virtual Environment
```bash
# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
venv\Scripts\activate
```

### 3. Install Required Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
cp .env.example .env
# Open .env and add your Pinecone / Gemini API keys (optional, fallback knowledge is enabled)
```

### 5. Start the Flask Server
```bash
python app.py
```
The server will boot up on: **`http://localhost:5000`** with CORS enabled for the React frontend!

---

## 📡 API Endpoints Overview

| Method | Endpoint | Module | Description |
|---|---|---|---|
| `GET` | `/api/health` | `app.py` | System health and module registry check |
| `POST` | `/api/register` | `routes/auth.py` | Registers a new user and returns JWT token |
| `POST` | `/api/login` | `routes/auth.py` | Authenticates user credentials with password hash |
| `POST` | `/api/chat` | `routes/chat.py` | Processes questions with LangChain RAG & saves to SQLite |
| `GET` | `/api/history` | `routes/history.py` | Returns user conversation history |
| `DELETE` | `/api/history/<id>`| `routes/history.py` | Deletes a conversation session |
| `DELETE` | `/api/history` | `routes/history.py` | Clears all conversation history |
| `GET` | `/api/hospitals` | `routes/location.py`| Finds nearby hospitals sorted by distance |
| `POST` | `/api/feedback` | `routes/feedback.py`| Records user feedback & qualitative comments |

---

## 🔗 Connecting with the React Frontend

In the React frontend (`src/services/api.js`), set:
```javascript
export const API_BASE_URL = 'http://localhost:5000/api';
```
Or set in `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
