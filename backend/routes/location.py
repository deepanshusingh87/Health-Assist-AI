from flask import Blueprint, request, jsonify
from services.location_service import get_nearby_hospitals

location_bp = Blueprint("location", __name__)


@location_bp.route("/hospitals/nearby", methods=["POST"])
def nearby_hospitals():
    """
    Find Nearby Hospitals
    ---
    tags:
      - Location
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - latitude
            - longitude
          properties:
            latitude:
              type: number
              example: 23.1815
            longitude:
              type: number
              example: 79.9864
            radius:
              type: integer
              example: 5000
    responses:
      200:
        description: Nearby hospitals
      400:
        description: Invalid location
    """

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Location data required"
        }), 400

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    radius = data.get("radius", 5000)

    if latitude is None or longitude is None:
        return jsonify({
            "success": False,
            "message": "Latitude and longitude required"
        }), 400

    try:
        latitude = float(latitude)
        longitude = float(longitude)
        radius = int(radius)

        hospitals = get_nearby_hospitals(
            latitude,
            longitude,
            radius
        )

        return jsonify({
            "success": True,
            "count": len(hospitals),
            "hospitals": hospitals
        })

    except Exception as e:
        print("Location Error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to find nearby hospitals"
        }), 500