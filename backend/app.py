"""
Health Assist AI - Main Application Entry Point
Starts Flask Server, Enables CORS, Swagger, and Registers all API routes.
"""

import os
from datetime import datetime, timezone

from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger

from config import Config
import database
import models

# Import Route Blueprints
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.history import history_bp
from routes.location import location_bp
from routes.feedback import feedback_bp
from extensions import mail


def create_app():
    """Application Factory for Health Assist AI Flask Backend."""

    app = Flask(__name__)
    app.config.from_object(Config)
    # Initialize Flask-Mail
    mail.init_app(app)

    # 1. Swagger Configuration
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": "apispec",
                "route": "/apispec.json",
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/"
    }

    swagger_template = {
        "info": {
            "title": "Health Assist AI API",
            "description": "REST API documentation for Health Assist AI",
            "version": "1.0.0"
        }
    }

    Swagger(
        app,
        config=swagger_config,
        template=swagger_template
    )

    # 2. Enable CORS
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization"]
    )

    # 3. Database Initialization
    database.init_app(app)
    models.init_tables()

    # 4. Register API Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api")
    app.register_blueprint(location_bp, url_prefix="/api")
    app.register_blueprint(feedback_bp, url_prefix="/api")

    # 5. Health Check
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """
        Health Check
        ---
        tags:
          - System
        responses:
          200:
            description: Backend is running successfully
        """
        return jsonify({
            "status": "healthy",
            "service": "Health Assist AI - Flask REST Backend",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "registered_modules": [
                "auth (Register, Login, JWT)",
                "chat (LangChain + Pinecone RAG)",
                "history (Conversations & Deletion)",
                "location (Nearby Hospitals & Haversine Distance)",
                "feedback (Helpful/Not Helpful & User Comments)"
            ]
        })
    
    

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))

    print("=======================================================")
    print("  Health Assist AI - Python Flask Backend Server")
    print(f"  Running on: http://0.0.0.0:{port}")
    print("  API Prefix: /api")
    print(f"  Swagger UI: http://127.0.0.1:{port}/apidocs/")
    print("=======================================================")

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )
    