import json
import os
from pathlib import Path

from dotenv import load_dotenv





BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_list(name, default=""):
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


SECRET_KEY = os.environ["SECRET_KEY"]  # fail fast if missing
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "daphne",  # must be first so runserver serves ASGI (needed for Channels)
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "channels",
    "trading",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]


DATABASES = {
    "default": {
        "ENGINE": "mssql",
        "NAME": "TradingPlatformDB",
        "HOST": r"DESKTOP-RVCE8J8\SQLEXPRESS",
        "OPTIONS": {
            "driver": "ODBC Driver 18 for SQL Server",
            "trusted_connection": "yes",
            "extra_params": "TrustServerCertificate=yes;Encrypt=no;",
        },
    }
}



DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# In-memory layer is fine for one process. Use channels_redis for multiple workers.
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:5173")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "EXCEPTION_HANDLER": "trading.exceptions.api_exception_handler",
    "UNAUTHENTICATED_USER": None,
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_TZ = True
STATIC_URL = "static/"

# --- Trading configuration -------------------------------------------------
TRADING_AUTH_URL = os.getenv("TRADING_AUTH_URL", "http://s138.acttrader.com:10138/api/v2/auth/token")
TRADING_WS_URL = os.getenv("TRADING_WS_URL", "ws://s138.acttrader.com:22138/ws")
TRADING_API_USERNAME = os.getenv("TRADING_API_USERNAME", "")
TRADING_API_PASSWORD = os.getenv("TRADING_API_PASSWORD", "")
TRADING_AUTH_USERNAME_FIELD = os.getenv("TRADING_AUTH_USERNAME_FIELD", "username")
TRADING_AUTH_PASSWORD_FIELD = os.getenv("TRADING_AUTH_PASSWORD_FIELD", "password")
TRADING_AUTH_FORMAT = os.getenv("TRADING_AUTH_FORMAT", "json")  # json | form
TRADING_AUTH_EXTRA = json.loads(os.getenv("TRADING_AUTH_EXTRA", "{}") or "{}")
TRADING_HTTP_TIMEOUT = float(os.getenv("TRADING_HTTP_TIMEOUT", "10"))
TRADING_INSTRUMENTS = [s.upper() for s in env_list("TRADING_INSTRUMENTS", "BTC-USD,GBPUSD,USDJPY")]
PRICE_MAX_AGE_SECONDS = float(os.getenv("PRICE_MAX_AGE_SECONDS", "30"))
FEED_IDLE_TIMEOUT_SECONDS = float(os.getenv("FEED_IDLE_TIMEOUT_SECONDS", "60"))
FEED_RECONNECT_BASE_SECONDS = float(os.getenv("FEED_RECONNECT_BASE_SECONDS", "1"))
FEED_RECONNECT_MAX_SECONDS = float(os.getenv("FEED_RECONNECT_MAX_SECONDS", "30"))
UI_BROADCAST_INTERVAL_MS = int(os.getenv("UI_BROADCAST_INTERVAL_MS", "250"))

# --- Logging (never log credentials or tokens) -----------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "std": {"format": "%(asctime)s %(levelname)-7s %(name)s: %(message)s"},
    },
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "std"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        # websockets logs the connection URI (which carries the token) at DEBUG
        "websockets": {"level": "WARNING"},
        "httpx": {"level": "WARNING"},
        "httpcore": {"level": "WARNING"},
    },
}
