from .base import *  # noqa: F401,F403

DEBUG = False

ALLOWED_HOSTS = []  # TODO: Add production domain(s)

CORS_ALLOWED_ORIGINS = [
    # 'https://yourdomain.com',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'classivo',
        'USER': 'classivo_user',
        'PASSWORD': '',  # TODO: Set from environment variable
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
