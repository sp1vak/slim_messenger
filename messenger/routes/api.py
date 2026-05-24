from django.urls import path

from messenger.views.api import (
    ConversationList,
    MessageList,
    chat_delete,
    create_group,
    get_chat_data,
    get_chat_or_create,
    get_profile,
    get_user_chats,
    read_message,
    search_user_chats,
    search_users,
    chat_update_api,
)

urlpatterns = [
    path("conversations-list/", ConversationList.as_view()),
    path("messages-list/<int:chat_id>/", MessageList.as_view()),
    path("search-users/", search_users),
    path("get-chat-data/<str:chat_id>/", get_chat_data),
    path("get-user-chats/", get_user_chats),
    path("get-chat-or-create/", get_chat_or_create),
    path("read-message/", read_message),
    path("chat-delete/", chat_delete),
    path("get-profile/", get_profile),
    path("search-user-chats/", search_user_chats),
    path("create-group/", create_group),
    path("chats/<int:chat_id>/update/", chat_update_api, name="chat_update_api"),
]
