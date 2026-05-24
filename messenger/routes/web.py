from django.urls import path

from messenger.views.web import (
    messenger,
)

urlpatterns = [
    path("", messenger, name="messenger"),
]
