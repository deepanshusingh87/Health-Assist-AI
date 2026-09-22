from flask import Blueprint, request, jsonify, g
from services.rag_service import get_medical_response
from models import ChatHistoryModel
from routes.auth import token_required

import uuid


chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat", methods=["POST"])
@token_required
def chat():
    """
    Ask Health Assist AI
    ---
    tags:
      - Chat

    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - question
          properties:
            question:
              type: string
              example: "What is diabetes?"

            conversation_id:
              type: string
              example: "conv_123"

    responses:
      200:
        description: AI response generated successfully

      400:
        description: Question is required

      500:
        description: Server error
    """

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400

        # -------------------------------------------------
        # Get question
        # -------------------------------------------------

        question = data.get("question", "").strip()

        if not question:
            return jsonify({
                "success": False,
                "message": "Please enter a question"
            }), 400

        # -------------------------------------------------
        # Get user
        # -------------------------------------------------

        user_id = g.user_id

        # -------------------------------------------------
        # Conversation ID
        # -------------------------------------------------

        conversation_id = data.get("conversation_id")

        if not conversation_id:
            conversation_id = "conv_" + uuid.uuid4().hex[:12]

        # -------------------------------------------------
        # Generate unique message ID
        # -------------------------------------------------

        message_id = "msg_" + uuid.uuid4().hex[:12]

        # -------------------------------------------------
        # Generate AI response
        # -------------------------------------------------

        answer = get_medical_response(question)

        # -------------------------------------------------
        # Save conversation to SQLite
        # -------------------------------------------------

        ChatHistoryModel.save_interaction(
            msg_id=message_id,
            user_id=user_id,
            conv_id=conversation_id,
            question=question,
            answer=answer,
            is_urgent=False
        )

        # -------------------------------------------------
        # Send response to React
        # -------------------------------------------------

        return jsonify({
            "success": True,
            "message_id": message_id,
            "conversation_id": conversation_id,
            "question": question,
            "answer": answer
        }), 200

    except Exception as e:

        print("Chat Error:", str(e))

        return jsonify({
            "success": False,
            "message": "Unable to generate response.",
            "error": str(e)
        }), 500