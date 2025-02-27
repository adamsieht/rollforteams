from django.shortcuts import render
from .models import Player
# Create your views here.
def rollforteams(request):
    players = Player.objects.all()
    return render(request, 'rollforteams.html', {'players': players})