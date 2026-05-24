import json

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model

from .models import Conversation, Message

User = get_user_model()


@database_sync_to_async
def get_chat(conversation_id):
    return Conversation.objects.get(id=conversation_id)


@sync_to_async
def get_chat_users(chat):
    return list(chat.participants.all())


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"
        self.conversation = await get_chat(self.conversation_id)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        message = await self.create_message(data["content"])

        # отправка самих сообщений в чат пользователю
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": {
                    "id": message.id,
                    "content": message.content,
                    "created_at": str(message.created_at),
                    "sender": str(message.sender.id),
                    "conversation_id": self.conversation_id,
                },
            },
        )

        chat = await get_chat(self.conversation_id)
        users = await get_chat_users(chat)

        for user in users:
            # отправка уведомлений типочкам
            if user.id != self.user.id:
                await self.channel_layer.group_send(
                    f"notify_{str(user.id)}",
                    {
                        "type": "notification",
                        "content": message.content,
                        "created_at": str(message.created_at),
                        "sender_id": str(self.user.id),
                        "sender_name": self.user.first_name,
                        "conversation_id": str(chat.id),
                        "participants_count": len(users),
                    },
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @sync_to_async
    def create_message(self, content):
        can_send = Conversation.objects.filter(
            id=self.conversation_id, participants=self.user
        ).exists()

        if not can_send:
            print(
                f"{self.user} tried to post message in chat {self.conversation_id} without permission"
            )

        conversation = Conversation.objects.get(id=self.conversation_id)

        msg = Message.objects.create(
            conversation=conversation, sender=self.user, content=content
        )

        conversation.last_message = msg
        conversation.save()

        return msg


# NOTIFICATIONS + ONLINE/OFFLINE STATUS PROCESSING
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        self.status_group_name = "online_users"
        await self.channel_layer.group_add(self.status_group_name, self.channel_name)

        self.notify_group_name = f"notify_{str(self.user.id)}"
        await self.channel_layer.group_add(self.notify_group_name, self.channel_name)

        await self.accept()

        await self.update_user_status(True)
        await self.broadcast_status(True)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.status_group_name, self.channel_name
        )
        await self.channel_layer.group_discard(
            self.notify_group_name, self.channel_name
        )

        await self.update_user_status(False)
        await self.broadcast_status(False)

    async def notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "notification",
                    "content": event["content"],
                    "created_at": str(event["created_at"]),
                    "sender_id": event["sender_id"],
                    "sender_name": event["sender_name"],
                    "conversation_id": event["conversation_id"],
                    "participants_count": event["participants_count"],
                }
            )
        )

    async def broadcast_status(self, is_online):
        await self.channel_layer.group_send(
            self.status_group_name,
            {
                "type": "user_status_update",
                "user_id": str(self.user.id),
                "is_online": is_online,
            },
        )

    async def user_status_update(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "user_status",
                    "user_id": str(event["user_id"]),
                    "is_online": event["is_online"],
                }
            )
        )

    async def chat_created_notification(self, event):
        conversation_id = event["conversation_id"]

        chat_data = await self.get_serialized_conversation(conversation_id, self.user)
        if chat_data:
            await self.send(
                text_data=json.dumps(
                    {"type": "chat_created_notification", "message": chat_data}
                )
            )

    async def chat_deletion_notification(self, event):
        conversation_id = event["conversation_id"]

        if conversation_id:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "chat_deletion_notification",
                        "conversation_id": conversation_id,
                    }
                )
            )

    async def chat_changed_notification(self, event):
        conversation_id = event["conversation_id"]

        chat_data = await self.get_serialized_conversation(conversation_id, self.user)
        if chat_data:
            await self.send(
                text_data=json.dumps(
                    {"type": "chat_changed_notification", "message": chat_data}
                )
            )

    @database_sync_to_async
    def update_user_status(self, is_online):
        User.objects.filter(id=self.user.id).update(is_online=is_online)

    @database_sync_to_async
    def get_serialized_conversation(self, conversation_id, current_user):
        try:
            instance = Conversation.objects.get(id=conversation_id)
            return {
                "id": str(instance.id),
                "name": instance.get_display_name(current_user),
                "avatar": instance.avatar_url(current_user),
            }
        except Conversation.DoesNotExist:
            return None
