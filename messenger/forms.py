from django import forms

from .models import Conversation


class ConversationSettingsForm(forms.ModelForm):
    class Meta:
        model = Conversation
        fields = ("name", "avatar")
        widgets = {
            'avatar': forms.FileInput(),
        }