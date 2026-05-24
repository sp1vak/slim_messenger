from django import forms
from django.contrib.auth.forms import (
    AuthenticationForm,
    PasswordChangeForm,
    UserCreationForm,
)

from .models import CustomUser


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "password1",
            "password2",
        )


class CustomUserAuthenticationForm(AuthenticationForm):
    pass


class CustomUserChangeForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = (
            "first_name",
            "last_name",
            "email",
            "username",
            "description",
            "avatar",
        )
        widgets = {
            "avatar": forms.FileInput(),
            "description": forms.Textarea(),
        }


class CustomUserPasswordChangeForm(PasswordChangeForm):
    class Meta:
        model = CustomUser
        fields = ("old_password", "new_password1", "new_password2")
