from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'messages', views.MessageViewSet)

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('', include(router.urls)),
]