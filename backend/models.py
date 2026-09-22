"""
Database Models & SQLite Schema Definition for Health Assist AI.

Defines:
- User table
- ChatHistory table
- Feedback table
- Email OTP table
"""

import sqlite3
import hashlib
import hmac

try:
    from werkzeug.security import generate_password_hash, check_password_hash
except ImportError:
    def generate_password_hash(password: str) -> str:
        salt = "health_assist_salt"
        return hashlib.sha256(
            f"{salt}:{password}".encode("utf-8")
        ).hexdigest()

    def check_password_hash(p_hash: str, password: str) -> bool:
        salt = "health_assist_salt"

        computed = hashlib.sha256(
            f"{salt}:{password}".encode("utf-8")
        ).hexdigest()

        return hmac.compare_digest(p_hash, computed)


from database import get_db, get_standalone_db


# =========================================================
# DATABASE TABLES
# =========================================================

def init_tables():
    """Initializes all database tables in SQLite."""

    conn = get_standalone_db()
    cursor = conn.cursor()

    # 1. User Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Chat History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        conversation_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        is_urgent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE
    );
    """)

    # 3. Feedback Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT NOT NULL,
        user_id INTEGER,
        feedback_type TEXT NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE SET NULL
    );
    """)

    # 4. Email OTP Verification Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS email_otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()


# =========================================================
# USER MODEL
# =========================================================

class UserModel:

    @staticmethod
    def create(name: str, email: str, password: str):
        db = get_db()
        cursor = db.cursor()

        password_hash = generate_password_hash(password)

        try:
            cursor.execute(
                """
                INSERT INTO users (
                    name,
                    email,
                    password_hash
                )
                VALUES (?, ?, ?)
                """,
                (
                    name,
                    email.lower().strip(),
                    password_hash
                )
            )

            db.commit()

            return {
                "id": cursor.lastrowid,
                "name": name,
                "email": email.lower().strip()
            }

        except sqlite3.IntegrityError:
            return None

    @staticmethod
    def get_by_email(email: str):
        db = get_db()

        return db.execute(
            """
            SELECT *
            FROM users
            WHERE email = ?
            """,
            (email.lower().strip(),)
        ).fetchone()

    @staticmethod
    def get_by_id(user_id: int):
        db = get_db()

        return db.execute(
            """
            SELECT
                id,
                name,
                email,
                created_at
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        ).fetchone()

    @staticmethod
    def verify_password(user_row, password: str) -> bool:
        if not user_row:
            return False

        return check_password_hash(
            user_row["password_hash"],
            password
        )

    # Forgot Password - Update User Password
    @staticmethod
    def update_password(email: str, new_password: str) -> bool:
        db = get_db()

        password_hash = generate_password_hash(new_password)

        cursor = db.execute(
            """
            UPDATE users
            SET password_hash = ?
            WHERE LOWER(email) = LOWER(?)
            """,
            (
                password_hash,
                email.strip()
            )
        )

        db.commit()

        return cursor.rowcount > 0


# =========================================================
# CHAT HISTORY MODEL
# =========================================================

class ChatHistoryModel:

    @staticmethod
    def save_interaction(
        msg_id: str,
        user_id: int,
        conv_id: str,
        question: str,
        answer: str,
        is_urgent: bool = False
    ):
        db = get_db()

        db.execute(
            """
            INSERT INTO chat_history (
                id,
                user_id,
                conversation_id,
                question,
                answer,
                is_urgent
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                msg_id,
                user_id,
                conv_id,
                question,
                answer,
                1 if is_urgent else 0
            )
        )

        db.commit()

    @staticmethod
    def get_conversations(user_id: int):
        db = get_db()

        query = """
        SELECT
            conversation_id AS id,
            question AS title,
            answer AS snippet,
            created_at AS date,
            COUNT(id) AS messageCount
        FROM chat_history
        WHERE user_id = ?
        GROUP BY conversation_id
        ORDER BY created_at DESC
        """

        rows = db.execute(
            query,
            (user_id,)
        ).fetchall()

        result = []

        for r in rows:
            result.append({
                "id": r["id"],
                "title": (
                    r["title"][:45]
                    + ("..." if len(r["title"]) > 45 else "")
                ),
                "snippet": (
                    r["snippet"][:90]
                    + ("..." if len(r["snippet"]) > 90 else "")
                ),
                "date": str(r["date"]),
                "messageCount": r["messageCount"]
            })

        return result

    @staticmethod
    def get_messages_by_conversation(
        conv_id: str,
        user_id: int
    ):
        db = get_db()

        rows = db.execute(
            """
            SELECT
                id,
                question,
                answer,
                is_urgent,
                created_at
            FROM chat_history
            WHERE conversation_id = ?
            AND user_id = ?
            ORDER BY created_at ASC
            """,
            (
                conv_id,
                user_id
            )
        ).fetchall()

        return rows

    @staticmethod
    def delete_conversation(
        conv_id: str,
        user_id: int
    ):
        db = get_db()

        db.execute(
            """
            DELETE FROM chat_history
            WHERE conversation_id = ?
            AND user_id = ?
            """,
            (
                conv_id,
                user_id
            )
        )

        db.commit()

    @staticmethod
    def clear_all(user_id: int):
        db = get_db()

        db.execute(
            """
            DELETE FROM chat_history
            WHERE user_id = ?
            """,
            (user_id,)
        )

        db.commit()


# =========================================================
# FEEDBACK MODEL
# =========================================================

class FeedbackModel:

    @staticmethod
    def record(
        message_id: str,
        feedback_type: str,
        comments: str = None,
        user_id: int = None
    ):
        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            """
            INSERT INTO feedback (
                message_id,
                user_id,
                feedback_type,
                comments
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                message_id,
                user_id,
                feedback_type,
                comments
            )
        )

        db.commit()

        return cursor.lastrowid


# =========================================================
# EMAIL OTP MODEL
# =========================================================

class OTPModel:

    @staticmethod
    def save_otp(email: str, otp: str, expires_at):
        db = get_db()

        # Same email ka old OTP remove karo
        db.execute(
            """
            DELETE FROM email_otps
            WHERE email = ?
            """,
            (email.lower().strip(),)
        )

        # OTP ko plain text me store nahi karenge
        otp_hash = generate_password_hash(otp)

        db.execute(
            """
            INSERT INTO email_otps (
                email,
                otp_hash,
                expires_at
            )
            VALUES (?, ?, ?)
            """,
            (
                email.lower().strip(),
                otp_hash,
                expires_at
            )
        )

        db.commit()

    @staticmethod
    def get_by_email(email: str):
        db = get_db()

        return db.execute(
            """
            SELECT *
            FROM email_otps
            WHERE email = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (email.lower().strip(),)
        ).fetchone()

    @staticmethod
    def verify_otp(otp_row, otp: str) -> bool:
        if not otp_row:
            return False

        return check_password_hash(
            otp_row["otp_hash"],
            otp
        )

    @staticmethod
    def delete_otp(email: str):
        db = get_db()

        db.execute(
            """
            DELETE FROM email_otps
            WHERE email = ?
            """,
            (email.lower().strip(),)
        )

        db.commit()