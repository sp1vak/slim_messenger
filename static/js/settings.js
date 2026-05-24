let currentSection = 'profile';

function showToast(message, isError = false) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = message;
    toast.classList.add('show');
    if (isError) {
        toast.style.background = "rgba(244, 63, 94, 0.95)";
    } else {
        toast.style.background = "rgba(15, 23, 42, 0.95)";
    }
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.background = "rgba(15, 23, 42, 0.95)";
        }, 300);
    }, 2500);
}

const menuItems = document.querySelectorAll('.settings-menu-item');
const sections = document.querySelectorAll('.settings-section');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const sectionId = item.dataset.section;
        currentSection = sectionId;

        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        sections.forEach(section => section.classList.remove('active-section'));
        document.getElementById(`${sectionId}-section`).classList.add('active-section');
    });
});

document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const name = document.getElementById('fullName').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const bio = document.getElementById('bio').value;

    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('avatarPreview').innerHTML = initials || '👤';

    showToast('Профіль успішно оновлено!');
});


document.addEventListener('DOMContentLoaded', function () {
    const changeBtn = document.getElementById('changeAvatarBtn');
    const fileInput = document.getElementById('avatarInput');

    changeBtn.addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            this.form.submit();
        }
    });
});

const removeBtn = document.getElementById('removeAvatarBtn');
const deleteFlag = document.getElementById('deleteAvatarFlag');
const avatarForm = document.getElementById('avatarForm');

document.getElementById('removeAvatarBtn').addEventListener('click', () => {
    if (confirm("Ви впевнені, що хочете видалити аватар?")) {
        deleteFlag.value = "true";
        avatarForm.submit();
        showToast("Аватар видалено", false)
    }
});