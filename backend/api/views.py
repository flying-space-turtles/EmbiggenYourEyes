from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Message
from .serializers import MessageSerializer

import requests
from django.http import JsonResponse

@api_view(['GET'])
def health_check(request):
    return Response({'status': 'healthy', 'message': 'API is working!'})

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

@api_view(['GET'])
def hello_api():
    return Response({"message": "Hello from DRF!"})

from django.http import JsonResponse
from rest_framework.decorators import api_view
import requests

@api_view(['GET'])
def geocode_search(request):
    query = request.GET.get("q")
    if not query:
        return JsonResponse({"error": "Missing query parameter 'q'."}, status=400)

    # Call Nominatim API
    url = "https://nominatim.openstreetmap.org/search"
    params = {"format": "json", "q": query, "limit": 5}  # limit to 5 results
    headers = {"User-Agent": "django-geocoder"}

    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    if not data:
        return JsonResponse({"error": "Location not found."}, status=404)

    results = []
    for item in data:
        bbox = [float(coord) for coord in item["boundingbox"]]  # [south, north, west, east]
        results.append({
            "name": item["display_name"],
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
            "boundingbox": {
                "south": bbox[0],
                "north": bbox[1],
                "west": bbox[2],
                "east": bbox[3]
            }
        })

    return JsonResponse({"results": results})


@api_view(["GET"])
def get_region(request):
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")

    if lat is None or lon is None:
        return Response({"error": "Missing lat or lon"}, status=400)

    try:
        r = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"format": "json", "lat": lat, "lon": lon},
            headers={"User-Agent": "django-geocoder"}
        )
        r.raise_for_status()
        data = r.json()
        display_name = data.get("display_name", f"{lat}, {lon}")
        return Response({"region": display_name})
    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=500)
    except ValueError:
        return Response({"error": "Invalid JSON from Nominatim", "raw": r.text}, status=500)