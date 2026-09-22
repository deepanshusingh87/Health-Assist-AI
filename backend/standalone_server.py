"""
Zero-dependency Python HTTP Server implementing the Flask REST API endpoints
for Health Assist AI (B.Tech Major Project).
Runs directly using Python 3 standard library (http.server, sqlite3, json, hashlib, hmac).
Compatible with Python 3.8+.
"""

import http.server
import socketserver
import json
import sqlite3
import os
import sys
import uuid
import base64
import hmac
import hashlib
import time
from urllib.parse import urlparse, parse_qs

PORT = int(os.getenv("PORT", 5000))
DB_PATH = os.path.join(os.path.dirname(__file__), "health_assist.db")
SECRET_KEY = os.getenv("SECRET_KEY", "health_assist_super_secret_jwt_key_btech_2026")

# ------------------------------------------------------------------------------
# SQLite Database Setup
# ------------------------------------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        snippet TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        is_urgent INTEGER DEFAULT 0,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
    )
    """)
    conn.commit()
    conn.close()

# ------------------------------------------------------------------------------
# Pure Python JWT implementation (HS256)
# ------------------------------------------------------------------------------
def base64url_encode(input_bytes):
    return base64.urlsafe_b64encode(input_bytes).rstrip(b'=').decode('ascii')

def base64url_decode(input_str):
    rem = len(input_str) % 4
    if rem > 0:
        input_str += '=' * (4 - rem)
    return base64.urlsafe_b64decode(input_str.encode('ascii'))

def create_jwt(payload):
    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = base64url_encode(json.dumps(header).encode('utf-8'))
    encoded_payload = base64url_encode(json.dumps(payload).encode('utf-8'))
    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    encoded_sig = base64url_encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_sig}"

def verify_jwt(token):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        signing_input = f"{parts[0]}.{parts[1]}".encode('utf-8')
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        provided_sig = base64url_decode(parts[2])
        if not hmac.compare_digest(expected_sig, provided_sig):
            return None
        payload_bytes = base64url_decode(parts[1])
        payload = json.loads(payload_bytes.decode('utf-8'))
        if payload.get("exp") and payload["exp"] < time.time():
            return None
        return payload
    except Exception:
        return None

# Password hash helper
def hash_password(password):
    return hashlib.sha256(f"{password}:{SECRET_KEY}".encode('utf-8')).hexdigest()

# ------------------------------------------------------------------------------
# Medical RAG Pipeline & Keywords
# ------------------------------------------------------------------------------
EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "stroke", "cannot breathe", 
    "difficulty breathing", "severe bleeding", "overdose", "unconscious"
]

def query_rag(question: str):
    q_lower = question.lower()
    for kw in EMERGENCY_KEYWORDS:
        if kw in q_lower:
            return {
                "text": (
                    "⚠️ IMMEDIATE ATTENTION REQUIRED: The symptoms described may indicate a medical emergency.\n\n"
                    "Please stop using this chatbot and immediately contact your local emergency medical services "
                    "(such as 911, 112, or your local hospital emergency hotline).\n\n"
                    "Health Assist AI is an informational tool and cannot replace emergency intervention."
                ),
                "is_urgent": True
            }

    if "diabetes" in q_lower:
        ans = (
            "Common symptoms of diabetes include increased thirst (polydipsia), frequent urination, "
            "extreme fatigue, unexplained weight loss, blurred vision, and slow-healing sores. "
            "A clinical blood test (such as Fasting Blood Glucose or HbA1c) conducted by a healthcare "
            "professional is essential for confirmation and management."
        )
    elif "blood pressure" in q_lower or "hypertension" in q_lower:
        ans = (
            "According to standard guidelines (AHA & WHO), normal resting adult blood pressure is "
            "systolic < 120 mm Hg AND diastolic < 80 mm Hg. Regular aerobic activity, a low-sodium "
            "diet, limiting stress, and routine checks help maintain healthy vascular tone."
        )
    elif "migraine" in q_lower or "headache" in q_lower:
        ans = (
            "Migraines are neurovascular headaches characterized by intense throbbing pain, light/sound "
            "sensitivity, and nausea. Common triggers include stress, sleep deprivation, hormonal changes, "
            "and food additives. Resting in a quiet, dark room and hydration offer relief."
        )
    elif "vitamin d" in q_lower:
        ans = (
            "Vitamin D deficiency often causes fatigue, bone pain, muscle aches, and lowered immune function. "
            "A 25-hydroxy vitamin D test confirms levels. Safe sun exposure, fortified food, and doctor-advised "
            "supplements restore adequate stores."
        )
    else:
        ans = (
            f"Thank you for asking about '{question}'.\n\n"
            "In general healthcare practices, maintaining wellness requires balanced nutrition, "
            "7–9 hours of sleep, daily exercise, and routine preventive checkups. "
            "Please consult a certified physician for medical diagnosis."
        )

    return {"text": ans, "is_urgent": False}

# ------------------------------------------------------------------------------
# HTTP Request Handler
# ------------------------------------------------------------------------------
class HealthAssistHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _send_json(self, data, status_code=200):
        response_bytes = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _read_body_json(self):
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len == 0:
            return {}
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            return json.loads(body)
        except Exception:
            return {}

    def _get_auth_user(self):
        auth = self.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
            return verify_jwt(token)
        return None

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/health":
            return self._send_json({
                "status": "healthy",
                "service": "Health Assist AI Python Backend",
                "version": "1.0.0"
            })

        elif path == "/api/history":
            user = self._get_auth_user()
            user_id = user["user_id"] if user else 1
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            rows = cursor.execute(
                "SELECT id, title, snippet, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            ).fetchall()
            conn.close()

            history = []
            for r in rows:
                history.append({
                    "id": r["id"],
                    "title": r["title"],
                    "snippet": r["snippet"],
                    "date": r["created_at"]
                })
            return self._send_json({"history": history})

        elif path == "/api/hospitals":
            hospitals = [
                {
                    "id": "hosp_1",
                    "name": "Apollo Multispeciality Hospital",
                    "address": "58 Canal Circular Road, Kadapara",
                    "distanceKm": 1.8,
                    "phone": "+91 33 2320 3040",
                    "isOpen": True,
                    "emergencyAvailable": True,
                    "rating": 4.6,
                    "specialties": ["Cardiology", "Trauma Care", "Neurology", "ICU"]
                },
                {
                    "id": "hosp_2",
                    "name": "Fortis Hospital & Kidney Institute",
                    "address": "730 Anandapur, E.M. Bypass Road",
                    "distanceKm": 3.4,
                    "phone": "+91 33 6628 4444",
                    "isOpen": True,
                    "emergencyAvailable": True,
                    "rating": 4.5,
                    "specialties": ["Emergency Medicine", "Nephrology", "Pulmonology"]
                },
                {
                    "id": "hosp_3",
                    "name": "Max Super Speciality Hospital",
                    "address": "1, 2 Press Enclave Marg, Saket",
                    "distanceKm": 4.2,
                    "phone": "+91 11 2651 5050",
                    "isOpen": True,
                    "emergencyAvailable": True,
                    "rating": 4.7,
                    "specialties": ["Cardiac Emergency", "Stroke Unit", "Orthopedics"]
                }
            ]
            return self._send_json({"hospitals": hospitals})

        else:
            return self._send_json({"error": "Not Found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body_json()

        if path == "/api/register":
            name = body.get("name", "").strip()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")

            if not name or not email or not password:
                return self._send_json({"error": "All fields are required"}, 400)

            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            try:
                p_hash = hash_password(password)
                cursor.execute(
                    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                    (name, email, p_hash)
                )
                conn.commit()
                user_id = cursor.lastrowid
            except sqlite3.IntegrityError:
                conn.close()
                return self._send_json({"error": "Email already exists"}, 409)
            conn.close()

            token = create_jwt({
                "user_id": user_id,
                "email": email,
                "name": name,
                "exp": time.time() + (7 * 86400)
            })

            return self._send_json({
                "token": token,
                "user": {"id": user_id, "name": name, "email": email}
            }, 201)

        elif path == "/api/login":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")

            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            user = cursor.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            conn.close()

            if not user or user["password_hash"] != hash_password(password):
                return self._send_json({"error": "Invalid email or password"}, 401)

            token = create_jwt({
                "user_id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "exp": time.time() + (7 * 86400)
            })

            return self._send_json({
                "token": token,
                "user": {"id": user["id"], "name": user["name"], "email": user["email"]}
            })

        elif path == "/api/chat":
            msg_text = body.get("message") or body.get("question", "")
            conv_id = body.get("conversationId") or f"conv_{uuid.uuid4().hex[:8]}"

            user = self._get_auth_user()
            user_id = user["user_id"] if user else 1

            rag_res = query_rag(msg_text)

            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            # Upsert conversation
            existing = cursor.execute("SELECT id FROM conversations WHERE id = ?", (conv_id,)).fetchone()
            if not existing:
                cursor.execute(
                    "INSERT INTO conversations (id, user_id, title, snippet) VALUES (?, ?, ?, ?)",
                    (conv_id, user_id, msg_text[:35], msg_text[:70])
                )
            # Store assistant message
            msg_id = f"msg_{uuid.uuid4().hex[:8]}"
            cursor.execute(
                "INSERT INTO messages (id, conversation_id, sender, text, is_urgent) VALUES (?, ?, ?, ?, ?)",
                (msg_id, conv_id, "ASSISTANT", rag_res["text"], 1 if rag_res["is_urgent"] else 0)
            )
            conn.commit()
            conn.close()

            return self._send_json({
                "reply": rag_res["text"],
                "isUrgent": rag_res["is_urgent"],
                "conversationId": conv_id,
                "messageId": msg_id
            })

        elif path == "/api/feedback":
            return self._send_json({"success": True})

        else:
            return self._send_json({"error": "Not Found"}, 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith("/api/history/"):
            conv_id = path.replace("/api/history/", "")
            conn = sqlite3.connect(DB_PATH)
            conn.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
            conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
            conn.commit()
            conn.close()
            return self._send_json({"success": True})
        return self._send_json({"error": "Not Found"}, 404)

if __name__ == "__main__":
    init_db()
    print(f"Health Assist AI Python Server listening on port {PORT}")
    with socketserver.TCPServer(("0.0.0.0", PORT), HealthAssistHandler) as httpd:
        httpd.serve_forever()
