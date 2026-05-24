from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Conversation(models.Model):
    name = models.CharField(max_length=100)
    participants = models.ManyToManyField(User, related_name="conversations")
    created_at = models.DateTimeField(auto_now_add=True)
    last_message = models.ForeignKey(
        "Message",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="last_message",
    )
    avatar = models.ImageField(upload_to="chat-avatars/", null=True, blank=True)
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_conversation",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name

    def get_display_name(self, current_user):
        participants = self.participants.all()

        if participants.count() == 2:
            other_user = participants.exclude(id=current_user.id).first()
            return (
                other_user.first_name + " " + other_user.last_name
                if other_user
                else "Uknown"
            )

        return self.name or "Group chat"

    def avatar_url(self, current_user):
        if self.participants.count() == 2:
            other_user = self.participants.exclude(id=current_user.id).first()
            return other_user.avatar_url
        if self.avatar and hasattr(self.avatar, "url"):
            return self.avatar.url
        return "/static/img/default_avatar.png"

    @property
    def is_group(self):
        if self.participants.count() > 2:
            return True
        return False


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    is_read = models.BooleanField(default=False)

    message_types = (
        ("text", "Text"),
        ("image", "Image"),
        ("file", "File"),
    )

    type = models.CharField(max_length=10, choices=message_types, default="text")

    def __str__(self):
        return f"{self.sender}: {self.content}"


class MessageRead(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user")
