from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet
from . import views
from django.conf import settings
from django.conf.urls.static import static

# Opprett en router for REST API-et
router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
from django.urls import path
from .views import RoomList

urlpatterns = [
    # Eksisterende ruter
    path('dashboard/', views.dashboard, name='dashboard'),
    path('book-room/', views.bestill_view, name='book_room_api'),
    path('login/', views.api_login, name='api_login'),
    path('signup/', views.signup, name='signup'),
    path('booking-history/', views.booking_history, name='booking_history'),
    path('brukerdetaljer/', views.brukerdetaljer_view, name='brukerdetaljer'),
    path('delete-booking/<int:booking_id>/', views.delete_booking, name='delete_booking'),
    path('admin/', views.admin_view, name='admin_view'),
    path('approve/<int:user_id>/', views.approve_user, name='approve_user'),
    path('delete_user/<int:user_id>/', views.delete_user, name='delete_user'),
    path('google-login/', views.google_login, name='google_login'),
    path('oauth2callback/', views.oauth2callback, name='oauth2callback'),
    path('test-google-calendar/', views.test_google_calendar, name='test_google_calendar'),
    path('google-disconnect/', views.google_disconnect, name='google_disconnect'),
    path('get-valid-dates/', views.get_valid_dates, name='get_valid_dates'),
    path("rooms/", RoomList.as_view(), name="room_list"),
    path("get-all-bookings/", views.get_all_bookings, name="get_all_bookings"),
    path('get-booking/<int:booking_id>/', views.get_booking, name='get_booking'),
    path("unapproved-users/", views.get_unapproved_users, name="unapproved_users"),
    path("active-users/", views.get_active_users, name="active_users"),
    path("check-approval-status/", views.check_approval_status, name="check_approval_status"),
    path('check-admin-status/', views.check_admin_status, name='check_admin_status'),
    


    

    # Legg til ruter fra routeren
    path('', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
