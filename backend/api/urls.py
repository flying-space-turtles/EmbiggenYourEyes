from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'messages', views.MessageViewSet)

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('search/', views.geocode_search, name="geocode_search"),
    path('get_region/', views.get_region, name="get_region"),
    path('historical_prompt/', views.generate_historical_prompt, name="generate_historical_prompt"),
    path('ask_gemini/', views.ask_gemini_about_region, name="ask_gemini_about_region"),
    path('list_gemini_models/', views.list_gemini_models, name="list_gemini_models"),
    path('', include(router.urls))
]