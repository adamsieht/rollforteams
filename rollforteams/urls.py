from django.urls import path
from .views import rollforteams
from django.conf import settings
from django.conf.urls.static import static  # <-- Add this import
urlpatterns = [
    path('', rollforteams, name='rollforteams')
]
