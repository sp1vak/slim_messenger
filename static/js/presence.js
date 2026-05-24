const presenceSocket = new WebSocket(`ws://${window.location.host}/ws/notification/`);
const sound = document.getElementById("notification");

presenceSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    
    if (data.type === "user_status") {
        updateUserStatusUI(data.user_id, data.is_online);
    } else if (data.type === "notification") {
        updateLastMessage(data);
        notificate(data);
    } else if (data.type === "chat_created_notification") {
        appendChat(data);
    } else if (data.type === "chat_deletion_notification") {
        deleteChat(data);
    } else if (data.type === "chat_changed_notification") {
        changeChatData(data);
    }
};

function changeChatData(data) {
    updateChatList();
    markChatAsSelected();
    chatHeaderName.textContent = data.message.name;
    chatHeaderAvatar.innerHTML = `<img style="object-fit: cover; width: 100%; height: 100%; object-position: center;" src="${data.message.avatar}" height=50px>`
}

function appendChat(data) {
    chatsListEl.innerHTML += `
        <div class="chat-item ${escapeHtml(data.message.id)}" data-chat-id="${escapeHtml(data.message.id)}" id="searchedChat">
            <div class="chat-avatar">
                <img src="${escapeHtml(data.message.avatar)}" height=48px/>
            </div>
            <div class="chat-info">
                <div class="chat-name">
                    ${escapeHtml(data.message.name)}
                    <span class="chat-time"></span>
                </div>
                <div class="chat-last-msg">
                    Написати повідомлення
                </div>
            </div>
        </div>
    `
    listenToChatClick();
}

function deleteChat(data) {
    let chatItem = document.querySelector(`[data-chat-id="${data.conversation_id}"]`)
    
    if (chatItem) {
        chatItem.remove()
    }
}

function updateUserStatusUI(userId, isOnline) {
    if (!isChatOpened || isGroup) return;

    if (String(activeChatUserId) !== String(userId)) return ;

    const headerStatus = document.querySelector(`.chat-header-status`);
    if (headerStatus) {
        headerStatus.style.color = isOnline ? '#2ecc71' : '#95a5a6';
        headerStatus.textContent = isOnline ? 'В мережі' : 'Офлайн';
    }
};

function notificate(data) {
    let chatItem = document.querySelector(`[data-chat-id="${data.conversation_id}"]`)

    if (chatItem || isSearching == true) {
        sound.play()
            .then(() => {
                showToast(`${escapeHtml(data.sender_name)}: ${escapeHtml(data.content)}`, false);
            })
            .catch(error => {
                if (error.name === "NotAllowedError") {
                    showToast("🔇 Автовідтворення заблоковано. Зробіть хоч одну дію на сторінці, щоб розблокувати.", true)
                }
            })
    } else {
        fetch(`/api/messenger/get-chat-data/${data.conversation_id}/`)
            .then(res => res.json())
            .then (chat => {
                const newChat = `
                <div class="chat-item ${escapeHtml(chat.id)}" data-chat-id="${escapeHtml(chat.id)}">
                    <div class="chat-avatar">
                        <img src="${escapeHtml(chat.avatar)}" height=48px>
                    </div>
                    <div class="chat-info">
                        <div class="chat-name">
                            ${escapeHtml(chat.name)}
                            <span class="chat-time">${escapeHtml(getCorrectTime(chat.last_message_created_at))}</span>
                        </div>
                        <div class="chat-last-msg">
                            ${escapeHtml(chat.last_message)}
                        </div>
                    </div>
                    ${chat.unread > 0 ? `<div class="unread-badge">${chat.unread}</div>` : ''}
                </div>
            `
                chatsListEl.insertAdjacentHTML('afterbegin', newChat);
                listenToChatClick();
            });
    }
};

function updateLastMessage(msgData) {
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${msgData.conversation_id}"]`);

    if (chatItem) {
        const lastMsgDiv = chatItem.querySelector('.chat-last-msg');
        if (lastMsgDiv) {
            lastMsgDiv.textContent = escapeHtml(msgData.content);
        }

        const timeSpan = chatItem.querySelector('.chat-time');
        if (timeSpan) {
            const created_at = msgData.created_at.includes('T')
                ? msgData.created_at.split('T')[1].substring(0, 5)
                : msgData.created_at;
            timeSpan.textContent = escapeHtml(getCorrectTime(created_at));
        }

        const chatsList = document.getElementById('chatsList');
        chatsList.prepend(chatItem);

        markChatAsSelected();
    }
}

