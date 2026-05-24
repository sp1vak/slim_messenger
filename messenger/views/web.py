from django.shortcuts import render
from django.db.models import F
from django.contrib.auth.decorators import login_required

from messenger.models import Conversation, Message
from messenger.forms import ConversationSettingsForm


@login_required
def messenger(request):
    conversations = (
        Conversation.objects.filter(participants=request.user)
        .select_related("last_message")
        .order_by(F("last_message__created_at").desc(nulls_last=True))
    )
    messages = Message.objects.filter(conversation__in=conversations)
    conversation_settings_form = ConversationSettingsForm()
    return render(
        request,
        "messenger.html",
        {
            "conversations": conversations,
            "messages": messages,
            "conversation_settings_form": conversation_settings_form,
        },
    )
