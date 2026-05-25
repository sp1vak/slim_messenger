from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import (
    m2m_changed,
    post_delete,
    pre_delete,
    post_save,
    pre_save,
)
from django.dispatch import receiver

from .models import Conversation


@receiver(m2m_changed, sender=Conversation.participants.through)
def chat_participants_changed(sender, instance, action, **kwargs):
    if action == "pre_add":
        instance._is_brand_new_chat = not instance.participants.exists()

    elif action == "post_add":
        is_creation = getattr(instance, "_is_brand_new_chat", False)

        if is_creation:
            channel_layer = get_channel_layer()
            user_ids = list(instance.participants.values_list("id", flat=True))

            for user_id in user_ids:
                async_to_sync(channel_layer.group_send)(
                    f"notify_{str(user_id)}",
                    {
                        "type": "chat_created_notification",
                        "conversation_id": str(instance.id),
                    },
                )
        else:
            print("user added to the chat")
            #TODO; обробка звичайного додавання юзеру до чату


@receiver(pre_delete, sender=Conversation)
def count_participants(sender, instance, **kwargs):
    if instance.pk is None:
        instance._user_ids = []
        return
    instance._user_ids = list(instance.participants.values_list("id", flat=True))


@receiver(post_delete, sender=Conversation)
def chat_delete(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    user_ids = getattr(instance, "_user_ids", [])

    for user_id in user_ids:
        async_to_sync(channel_layer.group_send)(
            f"notify_{str(user_id)}",
            {
                "type": "chat_deletion_notification",
                "conversation_id": instance.id,
            },
        )


@receiver(pre_save, sender=Conversation)
def pre_save_counter(sender, instance, **kwargs):
    if instance.pk is None:
        instance._user_ids = []
        instance._changes_count = 0
        return
    instance._user_ids = list(instance.participants.values_list("id", flat=True))

    try:
        old_instance = Conversation.objects.get(pk=instance.id)
    except Conversation.DoesNotExist:
        return

    changes_count = 0
    if old_instance.name != instance.name:
        changes_count += 1

    if old_instance.avatar != instance.avatar:
        changes_count += 1
    
    instance._changes_count = changes_count


@receiver(post_save, sender=Conversation)
def chat_changed(sender, instance, created, **kwargs):
    changes_count = getattr(instance, "_changes_count", 0)
    if created or changes_count == 0:
        return
    
    channel_layer = get_channel_layer()
    user_ids = getattr(instance, "_user_ids", [])

    for user_id in user_ids:
        async_to_sync(channel_layer.group_send)(
            f"notify_{str(user_id)}",
            {"type": "chat_changed_notification", "conversation_id": instance.id},
        )
