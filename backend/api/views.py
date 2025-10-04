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

@api_view(['GET'])
def geocode_search(request):
    query = request.GET.get("q")
    if not query:
        return JsonResponse({"error": "Missing query parameter 'q'."}, status=400)

    url = "https://nominatim.openstreetmap.org/search"
    params = {"format": "json", "q": query, "limit": 10}  # return up to 10 suggestions
    headers = {"User-Agent": "django-geocoder"}

    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    if not data:
        return JsonResponse({"error": "Location not found."}, status=404)

    # map to needed fields + bounding box
    results = []
    for item in data:
        result = {
            "name": item["display_name"],
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
        }
        if "boundingbox" in item:
            result["boundingbox"] = [
                float(item["boundingbox"][0]),
                float(item["boundingbox"][1]),
                float(item["boundingbox"][2]),
                float(item["boundingbox"][3]),
            ]
        results.append(result)

    return JsonResponse({"results": results})
