"""
Feedback Routes for Health Assist AI.
Provides:
- Helpful / Not Helpful response rating (POST /api/feedback)
- User comments recording in SQLite Feedback table
"""

from flask import Blueprint, request, jsonify, g
from models import FeedbackModel
from routes.auth import optional_token

feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.route("/feedback", methods=["POST"])
@optional_token
def record_feedback():
    """
    POST /api/feedback
    Payload:
    {
        "messageId": "msg_xxx",
        "feedback": "helpful" | "not_helpful",
        "comments": "Very detailed and accurate answer" (optional)
    }
    """
    data = request.get_json() or {}
    message_id = data.get("messageId") or data.get("message_id")
    feedback_type = data.get("feedback") or data.get("feedbackType") or data.get("type")
    comments = data.get("comments") or data.get("comment")

    if not message_id or not feedback_type:
        return jsonify({"error": "messageId and feedback type are required"}), 400

    # Sanitize feedback type
    feedback_type = feedback_type.lower().strip()
    if feedback_type not in ["helpful", "not_helpful"]:
        feedback_type = "helpful" if "helpful" in feedback_type else "not_helpful"

    user_id = getattr(g, "user_id", None)
    feedback_id = FeedbackModel.record(
        message_id=message_id,
        feedback_type=feedback_type,
        comments=comments,
        user_id=user_id
    )

    return jsonify({
        "success": True,
        "message": "Feedback recorded successfully",
        "feedbackId": feedback_id
    })
