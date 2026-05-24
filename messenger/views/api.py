import json

from django.contrib.auth import get_user_model
from django.db.models import F
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import APIView, api_view
from rest_framework.response import Response

from messenger.models import Conversation, Message, MessageRead
from messenger.serializers import ConversationSerializer, MessageSerializer
from messenger.forms import ConversationSettingsForm

User = get_user_model()


# API VIEWS
class ConversationList(APIView):
    def get(self, request):
        conversations = (
            Conversation.objects.filter(participants=request.user)
            .select_related("last_message")
            .order_by(F("last_message__created_at").desc(nulls_last=True))
        )
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data)


class MessageList(APIView):
    def get(self, request, chat_id):
        conversation = Conversation.objects.get(id=chat_id)
        messages = Message.objects.filter(conversation=conversation)[:150]
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


@api_view(["GET"])
def search_users(request):
    query = request.GET.get("q", "")

    if len(query) < 1:
        return Response([])

    users = User.objects.filter(username__icontains=query)[:10]

    data = [
        {
            "id": u.id,
            "username": u.username,
            "avatar": u.avatar_url,
            "last_name": u.last_name,
            "first_name": u.first_name,
            "description": u.description,
        }
        for u in users
        if u.id != request.user.id
    ]

    return Response(data)


@api_view(["GET"])
def search_user_chats(request):
    conversations = Conversation.objects.filter(participants=request.user)

    data = []
    for chat in conversations:
        if chat.participants.count() == 2:
            other_user = chat.participants.exclude(id=request.user.id).first()
            data.append(
                {
                    "name": chat.get_display_name(request.user),
                    "avatar": chat.avatar_url(request.user),
                    "id": other_user.id,
                }
            )

    return Response(data)


@api_view(["GET"])
def get_chat_data(request, chat_id):
    conversation = Conversation.objects.get(id=chat_id)

    data = {
        "id": conversation.id,
        "name": conversation.get_display_name(request.user),
        "is_group": conversation.is_group,
        "avatar": conversation.avatar_url(request.user),
    }

    participants = conversation.participants.all()
    if participants.count() == 2:
        other_user = participants.exclude(id=request.user.id).first()
        data["status"] = other_user.is_online
        data["active_chat_user_id"] = str(other_user.id)

    if conversation.last_message:
        data["last_message"] = conversation.last_message.content
        data["last_message_created_at"] = conversation.last_message.created_at

    return Response(data)


@api_view(["GET"])
def get_user_chats(request):
    conversations = (
        Conversation.objects.filter(participants=request.user)
        .select_related("last_message")
        .order_by(F("last_message__created_at").desc(nulls_last=True))
    )

    data = []
    for chat in conversations:
        if chat.last_message:
            data.append(
                {
                    "id": chat.id,
                    "name": chat.get_display_name(request.user),
                    "avatar": chat.avatar_url(request.user),
                    "last_message": chat.last_message.content,
                    "last_message_created_at": chat.last_message.created_at,
                }
            )
        else:
            data.append(
                {
                    "id": chat.id,
                    "name": chat.get_display_name(request.user),
                    "avatar": chat.avatar_url(request.user),
                    "last_message": "Відправте перше повідомлення!",
                }
            )

    return Response(data)


@api_view(["GET"])
def get_chat_or_create(request):
    other_user_id = request.GET.get("q")

    if not other_user_id:
        return Response({"error": "Немає параметру q"}, status=400)

    other_user = get_object_or_404(User, id=other_user_id)
    me = request.user

    conversation = (
        Conversation.objects.filter(participants=me)
        .filter(participants=other_user)
        .first()
    )

    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(me, other_user)
        created = True
    else:
        created = False

    return Response({"conversation_id": conversation.id, "created": created})


@api_view(["POST"])
def read_message(request):
    chat_id = request.GET.get("chat")

    unread_messages = Message.objects.filter(chat_id=chat_id).exclude(
        sender=request.user
    )

    for message in unread_messages:
        MessageRead.objects.get_or_create(message=message, user=request.user)

    return Response({"status": "ok"})


@api_view(["DELETE"])
def chat_delete(request):
    chat_id = request.GET.get("chat")

    chat = Conversation.objects.get(id=chat_id)
    chat.delete()

    return Response({"status": "ok"})


@api_view(["GET"])
def get_profile(request):
    chat_id = request.GET.get("q")

    if chat_id != "self":
        chat = Conversation.objects.get(id=chat_id)

        if chat.participants.count() == 2:
            other_user = chat.participants.exclude(id=request.user.id).first()
            return Response(
                {
                    "type": "chat",
                    "username": other_user.username,
                    "first_name": other_user.first_name,
                    "last_name": other_user.last_name,
                    "avatar": other_user.avatar_url,
                    "status": other_user.is_online,
                    "description": other_user.description,
                }
            )
        return Response(
            {
                "type": "group",
                "name": chat.get_display_name(request.user),
                "participants_count": chat.participants.count(),
                "created_at": chat.created_at,
                "avatar": chat.avatar_url(request.user),
            }
        )

    return Response(
        {
            "type": "self",
            "username": request.user.username,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "avatar": request.user.avatar_url,
            "status": request.user.is_online,
            "description": request.user.description,
        }
    )


@api_view(["POST"])
def create_group(request):
    try:
        user_ids = request.data.get("user_ids", [])
        group_name = request.data.get("group_name", "Нова група")

        user_ids.append(request.user.id)

        if not user_ids:
            return Response({"error": "Не обрано ні одного користувача"})

        new_group = Conversation.objects.create(name=group_name, creator=request.user)
        new_group.participants.add(*user_ids)

        return Response(
            {
                "success": True,
                "message": "Групу успішно створено!",
            }
        )

    except json.JSONDecodeError:
        return Response({"error": "Некоректний JSON"})


@api_view(["POST"])
def chat_update_api(request, chat_id):
    chat = get_object_or_404(Conversation, id=chat_id)

    form = ConversationSettingsForm(request.POST, request.FILES, instance=chat)

    if form.is_valid():
        if request.POST.get("delete_avatar") == "true" and chat.avatar:
            chat.avatar.delete(save=False)
            chat.avatar = None

        updated_chat = form.save()

        return Response(
            {
                "success": True,
                "chat_name": str(updated_chat),
                "chat_avatar": updated_chat.avatar.url if updated_chat.avatar else None,
            }
        )
    else:
        return JsonResponse(
            {"success": False, "errors": form.errors.get_json_data()}, status=400
        )