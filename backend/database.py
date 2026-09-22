import os
import sqlite3
from config import Config

try:
    from flask import g
except ImportError:
    class MockG:
        pass
    g = MockG()

def get_db():
    """
    Connects to the SQLite database.
    Stores the active connection in Flask's application context `g`.
    """
    if "db" not in g:
        g.db = sqlite3.connect(
            Config.DATABASE_PATH,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
        # Enable foreign key enforcement in SQLite
        g.db.execute("PRAGMA foreign_keys = ON;")
    return g.db

def close_db(e=None):
    """Closes the SQLite database connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def get_standalone_db():
    """Direct connection helper for CLI scripts or background jobs."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_app(app):
    """Registers database teardown hooks with Flask."""
    app.teardown_appcontext(close_db)
