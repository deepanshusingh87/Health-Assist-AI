import math
import requests

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate straight-line distance in kilometers."""

    radius = 6371

    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return radius * c


def get_nearby_hospitals(latitude, longitude, radius=5000):

    query = f"""
    [out:json][timeout:25];

    (
        node["amenity"="hospital"]
        (around:{radius},{latitude},{longitude});

        way["amenity"="hospital"]
        (around:{radius},{latitude},{longitude});

        relation["amenity"="hospital"]
        (around:{radius},{latitude},{longitude});
    );

    out center tags;
    """

    headers = {
    "User-Agent": "HealthAssistAI/1.0",
    "Accept": "application/json"
    }

    response = requests.post(
        OVERPASS_URL,
        data={"data": query},
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    data = response.json()

    hospitals = []

    for place in data.get("elements", []):

        tags = place.get("tags", {})

        hospital_lat = place.get("lat")
        hospital_lon = place.get("lon")

        # Ways/relations provide coordinates through center
        if hospital_lat is None or hospital_lon is None:
            center = place.get("center", {})
            hospital_lat = center.get("lat")
            hospital_lon = center.get("lon")

        if hospital_lat is None or hospital_lon is None:
            continue

        distance = calculate_distance(
            latitude,
            longitude,
            hospital_lat,
            hospital_lon
        )

        hospitals.append({
            "name": tags.get("name", "Unnamed Hospital"),
            "latitude": hospital_lat,
            "longitude": hospital_lon,
            "distance_km": round(distance, 2)
        })

    hospitals.sort(key=lambda x: x["distance_km"])

    return hospitals[:10]