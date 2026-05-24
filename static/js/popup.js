const menuButtons = document.querySelectorAll('.js-menu-btn');
const allMenus = document.querySelectorAll('.js-popup-menu');

menuButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
        const currentMenu = allMenus[index];

        allMenus.forEach(menu => {
            if (menu !== currentMenu) menu.classList.remove('show');
        });

        currentMenu.classList.toggle('show');
        e.stopPropagation();
    });
});

window.addEventListener('click', () => {
    allMenus.forEach(menu => menu.classList.remove('show'));
});