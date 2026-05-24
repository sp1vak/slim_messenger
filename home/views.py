from django.shortcuts import render, redirect


def main_redirect(request):
    if request.user.is_authenticated:
        return redirect("messenger")
    return redirect("messenger") # login