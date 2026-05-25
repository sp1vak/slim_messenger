let activeChatId = null;
let activeChatUserId = null;
let isGroup = null;
let currentMessages = [];
let socket = null;
let isChatOpened = false;
let isSearching = false;
let selectedUserIds = [];

const chatsListEl = document.getElementById('chatsList');
const messagesArea = document.getElementById('messagesArea');
const messageInputArea = document.getElementById('messageInputArea');
const chatHeaderName = document.getElementById('chatHeaderName');
const chatHeaderStatus = document.getElementById('chatHeaderStatus');
const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const searchChatsInput = document.getElementById('searchChats');
const logoutBtn = document.getElementById('logoutBtn');
const chatInfo = document.getElementById('chatInfo');
const toast = document.getElementById('toastMsg');
const chatDeleteButton = document.getElementById('chatDeleteBtn');
const profileModal = document.getElementById('profileModal');
const profileOpenBtn = document.getElementById('openProfile');
const profileCloseBtn = document.getElementById('closeProfile');
const createGroupModal = document.getElementById('createGroupModal');
const groupCloseBtn = document.getElementById('closeGroupCreate');
const searchedChatsList = document.getElementById("searchedChats");
const createGroupBtn = document.getElementById('createGroupSubmitBtn');


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

// ВІДКРИВАННЯ ЧАТУ
document.querySelectorAll('.chat-item').forEach(el => {
    el.addEventListener('click', () => {
        const chatId = el.dataset.chatId
        
        document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));

        el.classList.add('active')

        openChat(chatId);
    });
});

async function openChat(chatId) {
    if (socket) {
        socket.close();
    }

    activeChatId = chatId;
    isChatOpened = true;

    socket = new WebSocket(`ws://${window.location.host}/ws/messenger/${chatId}/`);

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === "chat_message") {
            appendNewMessage(data.message);
            updateLastMessage(data.message);
        };
    };

    socket.onclose = () => console.log("Connection closed");
    socket.onerror = (e) => console.error("Socket error:", e);

    localStorage.setItem('activeChatId', chatId);

    messageInputArea.style.display = 'flex';

    let response = await fetch(`/api/messenger/get-chat-data/${chatId}/`);
    let chat = await response.json()

    isGroup = chat.isGroup;

    activeChatUserId = !isGroup ? chat.active_chat_user_id : null;

    chatHeaderName.textContent = chat.name;

    if (typeof chat.status != "undefined"){
        if (chat.status == true) {
            chatHeaderStatus.textContent = "В мережі";
            chatHeaderStatus.style.color = "#2ecc71";
        } else if (chat.status == false) { 
            chatHeaderStatus.textContent = "Офлайн";
            chatHeaderStatus.style.color = "#95a5a6";
        }
    } else {
        chatHeaderStatus.textContent = "Група";
        chatHeaderStatus.style.color = '#95a5a6';
    }
    if (typeof chat.avatar != "undefined") {
        chatHeaderAvatar.innerHTML = `<img style="object-fit: cover; width: 100%; height: 100%; object-position: center;" src="${escapeHtml(chat.avatar)}" height=50px>`;
    } else { chatHeaderAvatar.innerHTML = `<i class="fas fa-comments"></i>`;}
    
    await renderMessages();
}

async function appendNewMessage(msgData) {
    const messageDiv = document.createElement('div');

    const isOutgoing = msgData.sender === currentUserId;
    messageDiv.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;

    messageDiv.innerHTML = `
            <div class="message-bubble">
                ${escapeHtml(msgData.content)}
                <div class="message-time">${escapeHtml(getCorrectTime(msgData.created_at))}</div>
            </div>
    `;
    const emptyChatMsg = messagesArea.querySelector('.empty-chat');
    if (emptyChatMsg) {
        emptyChatMsg.remove();
    }

    messagesArea.appendChild(messageDiv);

    scrollToBottom();
}

async function renderMessages() {
    const messages = await getMessages(activeChatId);

    if (messages.length === 0) {
        messagesArea.innerHTML = `
            <div class="empty-chat">
                <i class="fas fa-smile-wink" style="user-select:none; font-size: 2rem; opacity: 0.5;"></i>
                <p>Напишіть перше повідомлення!</p>
            </div>
        `;
        return;
    }
    messagesArea.innerHTML = messages.map(msg => {
        const isOutgoing = msg.sender === currentUserId;
        const messageClass = isOutgoing ? 'outgoing' : 'incoming';
        return `
            <div class="message ${messageClass}">
                <div class="message-bubble">
                    ${escapeHtml(msg.content)}
                    <div class="message-time">${escapeHtml(getCorrectTime(msg.created_at))}</div>
                </div>
            </div>
        `;
    }).join('');

    scrollToBottom();
}

async function getMessages(chatId) {
    try {
        const response = await fetch(`/api/messenger/messages-list/${chatId}/`);
        const messages = await response.json();
        
        return messages;
    } catch (error) {
        console.error("Load error:", error);
    }
}

async function scrollToBottom() {
    setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 50);
}


// ВІДПРАВКА ПОВІДОМЛЕНЬ
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            'content': text
        }));
        messageInput.value = '';
    } else {
        console.error("Socket is not ready", socket ? socket.readyState : 'not created');
    }
}

async function updateChatList() {
    const response = await fetch(`/api/messenger/get-user-chats/`);
    const chats = await response.json();

    chatsListEl.innerHTML = chats.map(chat => `
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
    `).join(''); 

    await listenToChatClick();
    //${data.unread > 0 ? `<div class="unread-badge">${data.unread}</div>` : ''}
}

async function listenToChatClick() {
    document.querySelectorAll('.chat-item').forEach(el => {
        el.addEventListener('click', () => {
            const chatId = el.dataset.chatId

            document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));

            el.classList.add('active')

            openChat(chatId);
        });
    });
}

async function markChatAsSelected(chat_id = undefined) {
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    
    if (chat_id == undefined) { // so we are taking activeChatId
        let chatItem = document.querySelector(`[data-chat-id="${escapeHtml(activeChatId)}"]`)
        chatItem.classList.add('active')
    } else {
        if (chatItem) {
            let chatItem = document.querySelector(`[data-chat-id="${escapeHtml(chat_id)}"]`)
            chatItem.classList.add('active')
        }
    }
}

async function searchedChats(data) {
    // searched contacts
    isSearching = true;

    chatsListEl.innerHTML = data.map(user => `
        <div class="chat-item ${escapeHtml(user.id)}" data-chat-id="${escapeHtml(user.id)}" id="searchedChat">
            <div class="chat-avatar">
                <img src="${escapeHtml(user.avatar)}" height=48px/>
            </div>
            <div class="chat-info">
                <div class="chat-name">
                    ${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}
                    <span class="chat-time">Пошук</span>
                </div>
                <div class="chat-last-msg">
                    Написати повідомлення
                </div>
            </div>
        </div>
    `).join(' ');

    document.querySelectorAll('.chat-item').forEach(el => {
        el.addEventListener('click', async () => {
            const elId = el.dataset.chatId;

            document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));

            el.classList.add('active');

            const response = await fetch(`/api/messenger/get-chat-or-create?q=${elId}`);
            const result = await response.json();

            openChat(result.conversation_id);
            isSearching = false;

            await updateChatList();
            await markChatAsSelected();
            searchChatsInput.value = '';
        });
    });
}

function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;

    if (!isError) {
        toast.style.background = "rgba(15, 23, 42, 0.95)";
        toast.style.color = "#f1f5f9";
    } else {
        toast.style.background = "rgba(244, 63, 94, 0.95)";
        toast.style.color = "white";
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');

        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 3000);
}

let timeout = null;

searchChatsInput.addEventListener('input', (e) => { 
    clearTimeout(timeout);
    console.log(e.target.value)
    if (e.target.value.length == 0){
        updateChatList();
        markChatAsSelected();
    } else {
        timeout = setTimeout(() => {
            fetch(`/api/messenger/search-users?q=${e.target.value}`)
                .then(res => res.json())
                .then(data => {
                    searchedChats(data);
                });
        }, 300);
    }
});

chatDeleteButton.addEventListener('click', (e) => {
    if (isChatOpened) {
        if (confirm("Ви впевнені, що хочете видалити чат?")) {
        fetch(`/api/messenger/chat-delete/?chat=${activeChatId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken,  // Обязательный заголовок для Django
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    location.reload();
                } else {
                    console.error("Ошибка удаления:", response.status);
                }
            });
    }
    }
})

// XSS SECURITY
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getCorrectTime(date) {
    if (typeof date != "undefined") {
        const time = new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
        return time
    } else {
        return ' '
    }
}

function getCorrectDate(date) {
    if (typeof date != "undefined") {
        const time = new Date(date).toLocaleTimeString([], {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        })
        return time
    } else {
        return ' '
    }
}

logoutBtn.addEventListener('click', (e) => {
    if (confirm('Вийти з акаунту?')) {
    }
    else {
        e.preventDefault()
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const savedChatId = localStorage.getItem('activeChatId');

    await updateChatList();
    
    if (savedChatId) {
        const chatElement = document.querySelector(`[data-chat-id="${savedChatId}"]`);

        if (chatElement) {
            chatElement.click();
        } else {
            localStorage.removeItem('activeChatId');
        }
    }
});


// profile
const profileButtons = document.querySelectorAll('.profile-trigger');

profileButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');

        const queryId = (type === 'self') ? 'self' : activeChatId;

        profileModal.showModal();

        fetch(`/api/messenger/get-profile/?q=${queryId}`)
            .then(res => res.json())
            .then(data => {
                const profileData = document.getElementById("profileInfo");
                renderProfile(data, profileData); // Выносим отрисовку в отдельную функцию
            });
    });
});

function renderProfile(data, container) {
    if (data.type === "chat" || data.type === "self") {
        container.innerHTML = `
            <div class="profile-avatar">
                <img src="${escapeHtml(data.avatar)}" alt="Avatar">
            </div>
            <div class="profile-info">
                <p><strong>Ім'я:</strong> <span>${escapeHtml(data.first_name)} ${escapeHtml(data.last_name)}</span></p>
                <p><strong>Юзернейм:</strong> ${escapeHtml(data.username)}</p>
                <p><strong>Статус:</strong> ${data.status ? 'В мережі' : 'Офлайн'}</p>
                <p><strong>Опис:</strong> ${data.description || 'Немає опису'}</p>
            </div>`;
    } else if (data.type === "group") {
        container.innerHTML = `
            <div class="profile-avatar">
                <img src="${escapeHtml(data.avatar)}" alt="Avatar">
            </div>
            <div class="profile-info">
                <p><strong>Назва:</strong> <span>${escapeHtml(data.name)}</span></p>
                <p><strong>Кількість учасників:</strong> ${escapeHtml(data.participants_count)}</p>
                <p><strong>Групу створено:</strong> ${escapeHtml(getCorrectDate(data.created_at))}</p>
            </div>`;
    }
}

profileCloseBtn.addEventListener('click', () => {
    profileModal.close();
});

profileModal.addEventListener('click', (e) => {
    const dialogDimensions = profileModal.getBoundingClientRect();
    if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
    ) {
        profileModal.close();
    }
});

// CREATING GROUPS
const groupButtons = document.querySelectorAll('.group-trigger');

groupButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        createGroupModal.showModal();
        createGroupBtn.disabled = true;

        const searchUsersGroup = document.getElementById("searchUsersGroup");

        fetch(`/api/messenger/search-user-chats/`)
            .then(res => res.json())
            .then(data => {
                searchedChatsList.innerHTML = data.map(chat => `
                    <div class="searching-list">
                        <label class="searching-chat-item" data-id="${escapeHtml(chat.id)}">
                            <input type="checkbox" class="chat-checkbox" value="${escapeHtml(chat.id)}">
                            <img src="${escapeHtml(chat.avatar)}" height="28px" alt="avatar"> 
                            <span>${escapeHtml(chat.name)}</span>
                        </label>
                    </div>
                `).join('');
        });
    });
});

searchedChatsList.addEventListener('change', (event) => {
    if (event.target.classList.contains('chat-checkbox')) {
        const userId = event.target.value;

        if (event.target.checked) {
            selectedUserIds.push(userId);
        } else {
            selectedUserIds = selectedUserIds.filter(id => id !== userId);
        }
        
        if (selectedUserIds.length > 0) {
            createGroupBtn.disabled = false;
            createGroupBtn.textContent = `Створити групу (${selectedUserIds.length})`; // Показываем счетчик на кнопке
        } else {
            createGroupBtn.disabled = true;
            createGroupBtn.textContent = 'Оберіть користувачів';
        }
    }
});

createGroupBtn.addEventListener('click', async () => {
    if (selectedUserIds.length === 0) return;

    const requestData = {
        user_ids: selectedUserIds,
        group_name: "Нова група"
    };

    try {
        const response = await fetch('/api/messenger/create-group/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('createGroupModal').close();
        } else {
            alert('Ошибка при создании группы: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
    }
});


groupCloseBtn.addEventListener('click', () => {
    selectedUserIds = [];
    createGroupModal.close();
});

createGroupModal.addEventListener('click', (e) => {
    const dialogDimensions = createGroupModal.getBoundingClientRect();
    if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
    ) {
        createGroupModal.close();
    }
});

// settings group modal

const chatSettingsModal = document.getElementById('chatSettingsModal');
const chatSettingsForm = document.getElementById('chatSettingsForm');
const chatSettingsButtons = document.querySelectorAll('.chat-settings-trigger');
const closeChatSettings = document.getElementById('closeChatSettings');

const settingsNameInput = document.getElementById('settingsName');
const avatarPreviewImg = document.getElementById('avatarPreviewImg');


chatSettingsButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        let response = await fetch(`/api/messenger/get-chat-data/${activeChatId}/`);
        let chat = await response.json()

        chatSettingsForm.action = `/api/messenger/chats/${activeChatId}/update/`;

        if (settingsNameInput) {
            settingsNameInput.value = chat.name;
        }

        if (chat.avatar && avatarPreviewImg) {
            avatarPreviewImg.src = chat.avatar;
            avatarPreviewImg.style.display = 'block';
        } else if (avatarPreviewImg) {
            avatarPreviewImg.style.display = 'none';
        }

        chatSettingsModal.showModal();
    });
});

chatSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const url = chatSettingsForm.action;
    const formData = new FormData(chatSettingsForm);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrftoken
            }
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();

            if (response.ok && data.success) {
                alert('Налаштування успішно збережено!');
                chatSettingsModal.close();
                await updateChatList();
            } else {
                alert('Помилка: ' + JSON.stringify(data.errors));
            }
        } else {
            const textError = await response.text();
            console.error('Сервер отдал не JSON:', textError);
            alert('Помилка сервера. Деталі в консолі.');
        }

    } catch (error) {
        console.error('Ошибка:', error);
    }
});

const fileInput = document.getElementById('settingsAvatar');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const removeAvatarBtn = document.getElementById('removeAvatarBtn');
const deleteAvatarFlag = document.getElementById('deleteAvatarFlag');

changeAvatarBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            avatarPreviewImg.src = event.target.result;
            avatarPreviewImg.style.display = 'block';
        }
        reader.readAsDataURL(file);
        deleteAvatarFlag.value = "false"; 
    }
});

removeAvatarBtn.addEventListener('click', () => {
    fileInput.value = "";
    avatarPreviewImg.src = "";
    avatarPreviewImg.style.display = 'none';
    deleteAvatarFlag.value = "true";
});

closeChatSettings.addEventListener('click', () => {
    chatSettingsModal.close();
});

chatSettingsModal.addEventListener('click', (e) => {
    if (e.target === chatSettingsModal) {
        chatSettingsModal.close();
    }
});

// MOBILE FUNCTIONAL
let touchStartX = 0;
document.querySelector('.messenger')?.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

document.querySelector('.messenger')?.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX - touchEndX > 50) {
        document.getElementById('sidebar')?.classList.remove('open');
    } else if (touchEndX - touchStartX > 50) {
        document.getElementById('sidebar')?.classList.add('open');
    }
});
