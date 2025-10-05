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


