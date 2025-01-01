from django.shortcuts import redirect
from .models import BrukerDetaljer

def user_is_approved(view_func):
    def wrapper_func(request, *args, **kwargs):
        # Sjekk om brukeren er logget inn og har en godkjent profil
        if request.user.is_authenticated:
            # Hvis brukeren er superuser, gi dem tilgang uten sjekk
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            try:
                # Hent brukerens detaljer for å sjekke om de er godkjent
                bruker_detaljer = BrukerDetaljer.objects.get(user=request.user)
                if not bruker_detaljer.profile_approved:
                    # Hvis profilen ikke er godkjent, omdiriger til ventepågodkjenning-side
                    return redirect('waiting_for_approval')
            except BrukerDetaljer.DoesNotExist:
                # Hvis BrukerDetaljer ikke eksisterer, omdiriger til ventepågodkjenning-side
                return redirect('waiting_for_approval')

        # Hvis brukeren er godkjent, tillat tilgang til viewet
        return view_func(request, *args, **kwargs)
    

    
    
    return wrapper_func

from django.http import JsonResponse
from functools import wraps

def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_superuser:
            return JsonResponse({"error": "Only admins can perform this action."}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view
