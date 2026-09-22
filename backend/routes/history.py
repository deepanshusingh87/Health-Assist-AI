"""
History Routes for Health Assist AI.
Provides:
- Gets previous conversations (GET /api/history)
- Deletes specific conversation history (DELETE /api/history/<conversation_id>)
- Clears entire conversation history (DELETE /api/history or POST /api/history/clear)
"""

from flask import Blueprint, jsonify, g
from models import ChatHistoryModel
from routes.auth import token_required


history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
@token_required
def get_history():
    """
    GET /api/history
    Returns list of saved conversation summaries for the active user.
    """
    user_id = g.user_id
    conversations = ChatHistoryModel.get_conversations(user_id)

    # Return sample conversations if database is currently empty
    if not conversations:
        conversations = [
            {
                "id": "conv_sample_1",
                "title": "Understanding Type 2 Diabetes",
                "snippet": "Type 2 diabetes symptoms include increased thirst, frequent urination, fatigue...",
                "date": "2026-09-14",
                "messageCount": 4
            },
            {
                "id": "conv_sample_2",
                "title": "Migraine triggers and relief",
                "snippet": "Migraines can be triggered by stress, dietary factors, sleep changes...",
                "date": "2026-09-12",
                "messageCount": 6
            }
        ]

    return jsonify({
        "history": conversations
    })


@history_bp.route("/history/<conversation_id>", methods=["GET"])
@token_required
def get_conversation_details(conversation_id):
    """
    GET /api/history/<conversation_id>
    Retrieves all messages for a specific conversation session.
    """
    user_id = g.user_id

    rows = ChatHistoryModel.get_messages_by_conversation(
        conversation_id,
        user_id
    )

    messages = []

    for r in rows:
        messages.append({
            "id": r["id"],
            "question": r["question"],
            "answer": r["answer"],
            "isUrgent": bool(r["is_urgent"]),
            "createdAt": str(r["created_at"])
        })

    return jsonify({
        "conversationId": conversation_id,
        "messages": messages
    })


@history_bp.route("/history/<conversation_id>", methods=["DELETE"])
@token_required
def delete_conversation(conversation_id):
    """
    DELETE /api/history/<conversation_id>
    Deletes a single conversation session.
    """
    user_id = g.user_id

    ChatHistoryModel.delete_conversation(
        conversation_id,
        user_id
    )

    return jsonify({
        "success": True,
        "message": f"Conversation {conversation_id} deleted."
    })


@history_bp.route("/history", methods=["DELETE"])
@history_bp.route("/history/clear", methods=["POST", "DELETE"])
@token_required
def clear_history():
    """
    DELETE /api/history
    POST /api/history/clear
    DELETE /api/history/clear

    Clears all saved conversation records for the active user.
    """
    user_id = g.user_id

    ChatHistoryModel.clear_all(user_id)

    return jsonify({
        "success": True,
        "message": "All chat history cleared successfully."
    })