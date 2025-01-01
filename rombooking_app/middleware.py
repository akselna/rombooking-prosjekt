# rombookingapp/middleware.py
from django.utils import timezone
from .models import BrukerDetaljer

class UpdateLastActivityMiddleware:
    """
    Middleware for å oppdatere last_activity for autentiserte brukere.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.user.is_authenticated:
            try:
                bruker_detaljer = BrukerDetaljer.objects.get(user=request.user)
                bruker_detaljer.last_activity = timezone.now()
                bruker_detaljer.save(update_fields=['last_activity'])
            except BrukerDetaljer.DoesNotExist:
                pass  # Du kan logge dette hvis ønskelig
        return response
