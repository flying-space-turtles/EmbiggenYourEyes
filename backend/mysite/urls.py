from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_health(request):
    return JsonResponse({"status": "ok", "message": "Django backend is running"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', api_health, name='api_health'),
    path('api/', include('api.urls')),
]