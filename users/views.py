from django.contrib.auth import login, logout
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required

from .forms import (
    CustomUserAuthenticationForm,
    CustomUserChangeForm,
    CustomUserCreationForm,
    CustomUserPasswordChangeForm,
)


# DEFAULT VIEWS
def register_view(request):
    errors = []
    form = CustomUserCreationForm()

    if request.method == "POST":
        form = CustomUserCreationForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")

            next_url = request.POST.get("next") or request.GET.get("next")
            return redirect("/" or next_url)

        errors.append("Користувач з таким юзернеймом вже існує!")
        return render(request, "register.html", {"form": form, "errors": errors})
    return render(request, "register.html", {"form": form})


def login_view(request):
    errors = []

    if request.method == "POST":
        form = CustomUserAuthenticationForm(request, data=request.POST)

        if form.is_valid():
            login(
                request,
                form.get_user(),
                backend="django.contrib.auth.backends.ModelBackend",
            )
            next_url = request.POST.get("next") or request.GET.get("next")
            return redirect("/" or next_url)
        errors.append("Щось пішло не так!")
        return render(request, "login.html", {"form": form, "errors": errors})

    form = CustomUserAuthenticationForm()
    return render(request, "login.html", {"form": form})


@login_required
def logout_view(request):
    logout(request)
    return redirect("login")


@login_required
def settings(request):
    profile_form = CustomUserChangeForm(instance=request.user)
    change_password_form = CustomUserPasswordChangeForm(user=request.user)

    if request.method == "POST":
        if request.POST.get("delete_avatar") == "true":
            if request.user.avatar:
                request.user.avatar.delete(save=False)
            request.user.avatar = None
            request.user.save()

        if "update_profile" in request.POST:
            profile_form = CustomUserChangeForm(
                request.POST, request.FILES, instance=request.user
            )
            if profile_form.is_valid():
                print("lox")
                profile_form.save()
                return redirect("/")
            print(profile_form.errors)

        if "change_password" in request.POST:
            change_password_form = CustomUserPasswordChangeForm(
                user=request.user, data=request.POST
            )
            if change_password_form.is_valid():
                change_password_form.save()
                # update_session_auth_hash(request, user)
                return redirect("/")

    return render(
        request,
        "settings.html",
        {"profile_form": profile_form, "change_password_form": change_password_form},
    )
