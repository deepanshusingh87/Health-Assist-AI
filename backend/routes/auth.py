from functools import wraps
from datetime import datetime, timezone, timedelta
import secrets
import jwt

from flask import Blueprint, request, jsonify, g
from flask_mail import Message

from extensions import mail
from config import Config
from models import UserModel, OTPModel


auth_bp = Blueprint("auth", __name__)

# JWT Helpers

def token_required(f):
    """
    Decorator enforcing valid JWT Bearer token in Authorization header.
    """
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization", "")

        if not auth_header:
            return jsonify({
                "error": "Authorization header missing"
            }), 401

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "error": "Invalid token header format. Use 'Bearer <token>'"
            }), 401

        token = parts[1]

        try:
            payload = jwt.decode(
                token,
                Config.SECRET_KEY,
                algorithms=["HS256"]
            )

            g.user_id = payload.get("user_id")
            g.user_email = payload.get("email")
            g.user_name = payload.get("name")

        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Session token has expired. Please log in again."
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "error": "Invalid or tampered session token."
            }), 401

        return f(*args, **kwargs)

    return decorated


def optional_token(f):
    """
    Attach authenticated user if token exists.
    Otherwise use guest user.
    """
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization", "")

        g.user_id = 1
        g.user_email = "guest@healthassist.ai"
        g.user_name = "Guest User"

        if auth_header:

            parts = auth_header.split()

            if len(parts) == 2 and parts[0].lower() == "bearer":

                try:
                    payload = jwt.decode(
                        parts[1],
                        Config.SECRET_KEY,
                        algorithms=["HS256"]
                    )

                    g.user_id = payload.get("user_id", 1)
                    g.user_email = payload.get(
                        "email",
                        "guest@healthassist.ai"
                    )
                    g.user_name = payload.get(
                        "name",
                        "Guest User"
                    )

                except Exception:
                    pass

        return f(*args, **kwargs)

    return decorated


def generate_jwt_token(user: dict) -> str:
    """Generate login JWT valid for configured expiration period."""

    now = datetime.now(timezone.utc)

    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "exp": now + Config.JWT_EXPIRATION_DELTA,
        "iat": now
    }

    return jwt.encode(
        payload,
        Config.SECRET_KEY,
        algorithm="HS256"
    )

# SEND EMAIL OTP

@auth_bp.route("/send-otp", methods=["POST"])
@auth_bp.route("/auth/send-otp", methods=["POST"])
def send_otp():
    """
    Send Email Verification OTP
    ---
    tags:
      - Authentication
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
          properties:
            email:
              type: string
              example: user@example.com
    responses:
      200:
        description: OTP sent successfully
      400:
        description: Email is required
      409:
        description: Email already registered
      500:
        description: Unable to send verification email
    """

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({
            "error": "Email is required"
        }), 400

    # Check whether account already exists
    existing_user = UserModel.get_by_email(email)

    if existing_user:
        return jsonify({
            "error": "An account with this email address already exists"
        }), 409

    # Server-side resend cooldown: allow one OTP request every 60 seconds
    existing_otp = OTPModel.get_by_email(email)

    if existing_otp:
        try:
            created_at = existing_otp["created_at"]

            # SQLite may return either a string or datetime object
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)

            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            elapsed_seconds = (datetime.now(timezone.utc) - created_at).total_seconds()
            cooldown_seconds = 60

            if elapsed_seconds < cooldown_seconds:
                retry_after = max(1, int(cooldown_seconds - elapsed_seconds) + 1)

                return jsonify({
                    "error": f"Please wait {retry_after} seconds before requesting another OTP.",
                    "retry_after": retry_after
                }), 429

        except (ValueError, TypeError, AttributeError, KeyError) as e:
            # Do not block OTP sending if an old row has malformed timestamp data
            print(f"OTP cooldown timestamp error: {e}")

    # Generate secure 6-digit OTP
    otp = f"{secrets.randbelow(1000000):06d}"

    # OTP expires after 5 minutes
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    try:

        # Save hashed OTP
        OTPModel.save_otp(
            email=email,
            otp=otp,
            expires_at=expires_at.strftime("%Y-%m-%d %H:%M:%S")
        )

        # Send email
        msg = Message(
            subject="Health Assist AI - Email Verification",
            recipients=[email],
            body=f"""Welcome to Health Assist AI.

Your email verification code is:

{otp}

This OTP is valid for 5 minutes.

If you did not request this code, you can ignore this email.
"""
        )

        mail.send(msg)

        return jsonify({
            "message": "OTP sent successfully"
        }), 200

    except Exception as e:

        # Remove OTP if email failed
        OTPModel.delete_otp(email)

        print(f"OTP email error: {e}")

        return jsonify({
            "error": "Unable to send verification email"
        }), 500

# VERIFY EMAIL OTP

@auth_bp.route("/verify-otp", methods=["POST"])
@auth_bp.route("/auth/verify-otp", methods=["POST"])
def verify_otp():
    """
    Verify Email OTP
    ---
    tags:
      - Authentication
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - otp
          properties:
            email:
              type: string
              example: user@example.com
            otp:
              type: string
              example: "123456"
    responses:
      200:
        description: Email verified successfully
      400:
        description: Invalid or expired OTP
      404:
        description: OTP not found
    """

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    otp = str(data.get("otp", "")).strip()

    if not email or not otp:
        return jsonify({
            "error": "Email and OTP are required"
        }), 400

    # OTP should contain exactly 6 digits
    if len(otp) != 6 or not otp.isdigit():
        return jsonify({
            "error": "OTP must be a 6-digit number"
        }), 400

    otp_row = OTPModel.get_by_email(email)

    if not otp_row:
        return jsonify({
            "error": "No OTP found. Please request a new OTP."
        }), 404
    # Check expiration

    try:

        expires_at = otp_row["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            OTPModel.delete_otp(email)
            return jsonify({
                "error": "OTP has expired. Please request a new OTP."
             }), 400
    except (ValueError, TypeError, AttributeError) as e:
        print(f"OTP expiry error: {e}")
        return jsonify({
            "error": "Invalid OTP expiry data"
        }), 500            

    # Verify hashed OTP

    if not OTPModel.verify_otp(otp_row, otp):

        return jsonify({
            "error": "Invalid OTP"
        }), 400

    # OTP can only be used once
    OTPModel.delete_otp(email)

    # Generate short-lived email verification token

    now = datetime.now(timezone.utc)

    verification_token = jwt.encode(
        {
            "email": email,
            "purpose": "email_verification",
            "iat": now,
            "exp": now + timedelta(minutes=10)
        },
        Config.SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({
        "message": "Email verified successfully",
        "verification_token": verification_token
    }), 200


# FORGOT PASSWORD - SEND OTP

@auth_bp.route("/forgot-password/send-otp", methods=["POST"])
@auth_bp.route("/auth/forgot-password/send-otp", methods=["POST"])
def forgot_password_send_otp():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({
            "error": "Email is required"
        }), 400

    # Password reset is only available for an existing account.
    existing_user = UserModel.get_by_email(email)

    if not existing_user:
        return jsonify({
            "error": "No account found with this email address"
        }), 404

    # Server-side resend cooldown: one OTP request every 60 seconds.
    existing_otp = OTPModel.get_by_email(email)

    if existing_otp:
        try:
            created_at = existing_otp["created_at"]

            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)

            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            elapsed_seconds = (
                datetime.now(timezone.utc) - created_at
            ).total_seconds()

            cooldown_seconds = 60

            if elapsed_seconds < cooldown_seconds:
                retry_after = max(
                    1,
                    int(cooldown_seconds - elapsed_seconds) + 1
                )

                return jsonify({
                    "error": (
                        f"Please wait {retry_after} seconds "
                        "before requesting another OTP."
                    ),
                    "retry_after": retry_after
                }), 429

        except (ValueError, TypeError, AttributeError, KeyError) as e:
            print(f"Password reset OTP cooldown error: {e}")

    otp = f"{secrets.randbelow(1000000):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    try:
        OTPModel.save_otp(
            email=email,
            otp=otp,
            expires_at=expires_at.strftime("%Y-%m-%d %H:%M:%S")
        )

        msg = Message(
            subject="Health Assist AI - Password Reset OTP",
            recipients=[email],
            body=f"""Health Assist AI Password Reset

Your password reset verification code is:

{otp}

This OTP is valid for 5 minutes.

If you did not request a password reset, you can ignore this email.
"""
        )

        mail.send(msg)

        return jsonify({
            "message": "Password reset OTP sent successfully"
        }), 200

    except Exception as e:
        OTPModel.delete_otp(email)
        print(f"Password reset OTP email error: {e}")

        return jsonify({
            "error": "Unable to send password reset email"
        }), 500


# FORGOT PASSWORD - VERIFY OTP

@auth_bp.route("/forgot-password/verify-otp", methods=["POST"])
@auth_bp.route("/auth/forgot-password/verify-otp", methods=["POST"])
def forgot_password_verify_otp():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    otp = str(data.get("otp", "")).strip()

    if not email or not otp:
        return jsonify({
            "error": "Email and OTP are required"
        }), 400

    if len(otp) != 6 or not otp.isdigit():
        return jsonify({
            "error": "OTP must be a 6-digit number"
        }), 400

    if not UserModel.get_by_email(email):
        return jsonify({
            "error": "No account found with this email address"
        }), 404

    otp_row = OTPModel.get_by_email(email)

    if not otp_row:
        return jsonify({
            "error": "No OTP found. Please request a new OTP."
        }), 404

    try:
        expires_at = otp_row["expires_at"]

        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            OTPModel.delete_otp(email)

            return jsonify({
                "error": "OTP has expired. Please request a new OTP."
            }), 400

    except (ValueError, TypeError, AttributeError) as e:
        print(f"Password reset OTP expiry error: {e}")

        return jsonify({
            "error": "Invalid OTP expiry data"
        }), 500

    if not OTPModel.verify_otp(otp_row, otp):
        return jsonify({
            "error": "Invalid OTP"
        }), 400

    # OTP becomes unusable after successful verification.
    OTPModel.delete_otp(email)

    now = datetime.now(timezone.utc)

    reset_token = jwt.encode(
        {
            "email": email,
            "purpose": "password_reset",
            "iat": now,
            "exp": now + timedelta(minutes=10)
        },
        Config.SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({
        "message": "OTP verified successfully",
        "reset_token": reset_token
    }), 200


# FORGOT PASSWORD - RESET PASSWORD

@auth_bp.route("/forgot-password/reset", methods=["POST"])
@auth_bp.route("/auth/forgot-password/reset", methods=["POST"])
def forgot_password_reset():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    new_password = data.get("new_password", "")
    reset_token = data.get("reset_token", "").strip()

    if not email or not new_password or not reset_token:
        return jsonify({
            "error": "Email, new password, and reset token are required"
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    try:
        payload = jwt.decode(
            reset_token,
            Config.SECRET_KEY,
            algorithms=["HS256"]
        )

    except jwt.ExpiredSignatureError:
        return jsonify({
            "error": "Password reset session has expired. Please request a new OTP."
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "error": "Invalid password reset token"
        }), 401

    if payload.get("purpose") != "password_reset":
        return jsonify({
            "error": "Invalid password reset token"
        }), 401

    verified_email = payload.get("email", "").strip().lower()

    if verified_email != email:
        return jsonify({
            "error": "Verified email does not match reset email"
        }), 400

    if not UserModel.get_by_email(email):
        return jsonify({
            "error": "User not found"
        }), 404

    updated = UserModel.update_password(
        email,
        new_password
    )

    if not updated:
        return jsonify({
            "error": "Unable to update password"
        }), 500

    return jsonify({
        "message": "Password updated successfully"
    }), 200


# REGISTER
@auth_bp.route("/register", methods=["POST"])
@auth_bp.route("/auth/register", methods=["POST"])
def register():

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    verification_token = data.get("verification_token", "").strip()

    # ---------------------------------------------------------
    # Basic validation
    # ---------------------------------------------------------

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email, and password are all required"
        }), 400

    if len(password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    # ---------------------------------------------------------
    # Verification token required
    # ---------------------------------------------------------

    if not verification_token:
        return jsonify({
            "error": "Please verify your email before registration"
        }), 401

    # ---------------------------------------------------------
    # Verify email verification token
    # ---------------------------------------------------------

    try:

        verification_payload = jwt.decode(
            verification_token,
            Config.SECRET_KEY,
            algorithms=["HS256"]
        )

    except jwt.ExpiredSignatureError:

        return jsonify({
            "error": "Email verification has expired. Please verify your email again."
        }), 401

    except jwt.InvalidTokenError:

        return jsonify({
            "error": "Invalid email verification token"
        }), 401

    # ---------------------------------------------------------
    # Make sure this is an email-verification token
    # ---------------------------------------------------------

    if verification_payload.get("purpose") != "email_verification":
        return jsonify({
            "error": "Invalid email verification token"
        }), 401

    # ---------------------------------------------------------
    # Verified email must match registration email
    # ---------------------------------------------------------

    verified_email = (
        verification_payload.get("email", "")
        .strip()
        .lower()
    )

    if verified_email != email:
        return jsonify({
            "error": "Verified email does not match registration email"
        }), 400

    # ---------------------------------------------------------
    # Check existing user
    # ---------------------------------------------------------

    existing_user = UserModel.get_by_email(email)

    if existing_user:
        return jsonify({
            "error": "An account with this email address already exists"
        }), 409

    # ---------------------------------------------------------
    # Create user
    # ---------------------------------------------------------

    user = UserModel.create(
        name,
        email,
        password
    )

    if not user:
        return jsonify({
            "error": "Failed to create user account"
        }), 500

    # ---------------------------------------------------------
    # Generate normal login JWT
    # ---------------------------------------------------------

    token = generate_jwt_token(user)

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }), 201
# LOGIN


@auth_bp.route("/login", methods=["POST"])
@auth_bp.route("/auth/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    user_row = UserModel.get_by_email(email)

    if not user_row or not UserModel.verify_password(
        user_row,
        password
    ):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    user_dict = {
        "id": user_row["id"],
        "name": user_row["name"],
        "email": user_row["email"]
    }

    token = generate_jwt_token(user_dict)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user_dict
    })

# CURRENT USER


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    """Return profile of currently authenticated user."""

    user = UserModel.get_by_id(g.user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": str(user["created_at"])
        }
    })