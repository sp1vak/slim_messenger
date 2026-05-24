from django.urls import include, path

from .views import login_view, logout_view, register_view, settings

urlpatterns = [
    path("register/", register_view, name="register"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("settings/", settings, name="settings"),
    path("accounts/", include("allauth.urls")),
]
