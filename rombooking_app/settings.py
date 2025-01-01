import os
from django.core.exceptions import ImproperlyConfigured
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False)
)

environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='your-default-secret-key')

DEBUG = env.bool('DEBUG', default=False)

ALLOWED_HOSTS = env.list(
    'ALLOWED_HOSTS', 
    default=['rombooking-ac36a5388660.herokuapp.com', '127.0.0.1', 'localhost']
)


CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React frontend
]

LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = '/api/dashboard'
LOGOUT_REDIRECT_URL = 'login'

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'whitenoise.runserver_nostatic',
    'rombooking_api',
    'rest_framework',
    'django_ses',
    'corsheaders',
    'django_extensions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'rombooking_app.urls'

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            os.path.join(BASE_DIR, "frontend_react", "build"),
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]




WSGI_APPLICATION = 'rombooking_app.wsgi.application'


# --- Databaseoppsett ---
ENVIRONMENT = env('ENVIRONMENT', default='development')

if ENVIRONMENT == 'development':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }
else:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(conn_max_age=600, ssl_require=True)
    }


# Passordvalidering
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/Oslo'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "frontend_react", "build", "static"),
]



STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/api/media/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CLIENT_SECRETS_FILE = os.path.join(BASE_DIR, 'credentials.json')
GOOGLE_OAUTH2_CLIENT_ID = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH2_CLIENT_SECRET')
GOOGLE_OAUTH2_TOKEN_URI = 'https://oauth2.googleapis.com/token'
REDIRECT_URI = 'https://rombooking-ac36a5388660.herokuapp.com/api/oauth2callback/'

# Krypteringsnøkler
FIELD_ENCRYPTION_KEY = env('FIELD_ENCRYPTION_KEY')
if not FIELD_ENCRYPTION_KEY:
    raise ImproperlyConfigured('The FIELD_ENCRYPTION_KEY setting must be set.')

MODEL_FIELD_ENCRYPTION_KEY = env('MODEL_FIELD_ENCRYPTION_KEY')
if not MODEL_FIELD_ENCRYPTION_KEY:
    raise ImproperlyConfigured('The MODEL_FIELD_ENCRYPTION_KEY setting must be set.')
import encrypted_model_fields.fields
encrypted_model_fields.fields.FIELD_ENCRYPTION_KEY = MODEL_FIELD_ENCRYPTION_KEY
