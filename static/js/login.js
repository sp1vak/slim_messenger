(function () {
    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeInput = document.getElementById('rememberMe'); // WIP

    const usernameErrorSpan = document.getElementById('usernameError');
    const passwordErrorSpan = document.getElementById('passwordError');

    const toast = document.getElementById('toastMsg');

    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.classList.add('show');
        if (!isError) {
            toast.style.background = "rgba(15, 23, 42, 0.95)";
            toast.style.color = "#f1f5f9";
        } else {
            toast.style.background = "rgba(244, 63, 94, 0.95)";
            toast.style.color = "white";
        }
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.style.background = "rgba(15, 23, 42, 0.9)";
            }, 300);
        }, 3000);
    }

    function clearErrors() {
        const errorSpans = [usernameErrorSpan, passwordErrorSpan];
        errorSpans.forEach(span => span.textContent = '');
        const inputs = [usernameInput, passwordInput];
        inputs.forEach(inp => inp.classList.remove('input-error'));
    }

    function validateUsername(username) {
        const trimmed = username.trim();
        if (trimmed === '') return 'Укажіть ваш юзернейм!';
        return '';
    }

    function validatePassword(pwd) {
        if (!pwd) return 'Уведіть пароль';
        return '';
    }


    function validateForm() {
        clearErrors();
        let isValid = true;

        const username = usernameInput.value;
        const pwd = passwordInput.value;

        const usernameErr = validateUsername(username);
        if (usernameErr) {
            usernameErrorSpan.textContent = usernameErr;
            usernameInput.classList.add('input-error');
            isValid = false;
        }

        const pwdErr = validatePassword(pwd);
        if (pwdErr) {
            passwordErrorSpan.textContent = pwdErr;
            passwordInput.classList.add('input-error');
            isValid = false;
        }

        return isValid;
    }

    function submitLogin() {
        const username = usernameInput.value.trim();
        showToast(`🎉 Привіт, ${first_name}! В акаунт успішно увійдено.`, false);
    }

    form.addEventListener('submit', (e) => {
        if (validateForm()) {
            submitLogin();
        } else {
            e.preventDefault();
            showToast('❌ Перевірте правильність заповнення полів', true);
        }
    });

    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                const type = targetInput.getAttribute('type') === 'password' ? 'text' : 'password';
                targetInput.setAttribute('type', type);
                const icon = this.querySelector('i');
                if (type === 'text') {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            }
        });
    });

    const googleBtn = document.getElementById('googleLogin');
    const githubBtn = document.getElementById('githubLogin');

    googleBtn.addEventListener('click', () => {
        showToast('🌐 Перенаправлення на вхід через Google', false);
    });

    githubBtn.addEventListener('click', () => {
        showToast('🐙 Перенаправлення на вхід через GitHub', false);
    });

    function setupLiveValidation(input, validator, errorSpan) {
        input.addEventListener('input', function () {
            const val = input.value;
            let errMsg = '';
            if (validator === 'username') errMsg = validateUsername(val);
            else if (validator === 'password') errMsg = validatePassword(val);
            if (errMsg) {
                errorSpan.textContent = errMsg;
                input.classList.add('input-error');
            } else {
                errorSpan.textContent = '';
                input.classList.remove('input-error');
            }
        });
    }

    setupLiveValidation(usernameInput, 'username', usernameErrorSpan);
    setupLiveValidation(passwordInput, 'password', passwordErrorSpan);



    document.querySelectorAll('.toggle-password i').forEach(icon => {
        if (icon.classList.contains('fa-eye-slash')) return;
    });

    clearErrors();
})();