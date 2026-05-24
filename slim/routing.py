from django.urls import path

from messenger import consumers

websocket_urlpatterns = [
    path("ws/messenger/<int:conversation_id>/", consumers.ChatConsumer.as_asgi()),
    path("ws/notification/", consumers.NotificationConsumer.as_asgi()),
]