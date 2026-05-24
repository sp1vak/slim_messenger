(function () {
    const form = document.getElementById('registrationForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const termsCheck = document.getElementById('termsCheckbox');

    const usernameErrorSpan = document.getElementById('usernameError');
    const emailErrorSpan = document.getElementById('emailError');
    const nameErrorSpan = document.getElementById('nameError');
    const passwordErrorSpan = document.getElementById('passwordError');
    const confirmErrorSpan = document.getElementById('confirmError');

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
        const errorSpans = [usernameErrorSpan, emailErrorSpan, nameErrorSpan, passwordErrorSpan, confirmErrorSpan];
        errorSpans.forEach(span => span.textContent = '');
        const inputs = [usernameInput, firstNameInput, lastNameInput, emailInput, passwordInput, confirmInput];
        inputs.forEach(inp => inp.classList.remove('input-error'));
    }

    function validateUsername(username) {
        const trimmed = username.trim();
        if (trimmed === '') return 'Укажіть ваш юзернейм!';
        if (trimmed.length < 4) return 'Юзернейм повинен бути не меншим ніж 5 символи!';
        if (!/^[a-zA-Z\s\-']+$/.test(trimmed) && !/[0-9]/.test(trimmed)) return 'Юзернейм може містити тільки букви та цифри!';
        return '';
    }

    function validateName(name) {
        const trimmed = name.trim();
        if (trimmed === '') return 'Укажіть ваше ім`я або фамілію!';
        if (trimmed.length < 2) return 'Ім`я та фамілія повинні мати як мінімум 2 символи!';
        if (!/^[a-zA-Zа-яА-ЯёЁіІїЇ\'\s\-']+$/.test(trimmed)) return 'Ім`я чи фамілія може складатися тільки з букв, пропусків та дефісів';
        return '';
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!email) return 'Введите адрес электронной почты';
        if (!emailRegex.test(email)) return 'Введите корректный email (пример: name@domain.com)';
        return '';
    }

    function validatePassword(pwd) {
        if (!pwd) return 'Уведіть пароль';
        if (pwd.length < 6) return 'Пароль повинен складатися як мінімум з 6 символів!';
        if (!/[A-Za-z]/.test(pwd) && !/[0-9]/.test(pwd)) {
            return 'Пароль повинен мати мінімум одну букву та цифру!';
        }
        return '';
    }

    function validateConfirm(pwd, confirm) {
        if (!confirm) return 'Підтвердіть пароль';
        if (pwd !== confirm) return 'Паролі не співпадають';
        return '';
    }

    function validateTerms(checked) {
        if (!checked) return 'Необхідно погодитися з умовами';
        return '';
    }

    function validateForm() {
        clearErrors();
        let isValid = true;

        const username = usernameInput.value;
        const first_name = firstNameInput.value;
        const last_name = lastNameInput.value;
        const email = emailInput.value;
        const pwd = passwordInput.value;
        const confirm = confirmInput.value;
        const termsOk = termsCheck.checked;

        const usernameErr = validateUsername(username);
        if (usernameErr) {
            usernameErrorSpan.textContent = usernameErr;
            usernameInput.classList.add('input-error');
            isValid = false;
        }

        const emailErr = validateEmail(email);
        if (emailErr) {
            emailErrorSpan.textContent = emailErr;
            emailInput.classList.add('input-error');
            isValid = false;
        }

        const firstnameErr = validateName(first_name);
        if (firstnameErr) {
            nameErrorSpan.textContent = firstnameErr;
            lastNameInput.classList.add('input-error');
            firstNameInput.classList.add('input-error');
            isValid = false;
        }

        const lastnameErr = validateName(last_name);
        if (lastnameErr) {
            nameErrorSpan.textContent = lastnameErr;
            lastNameInput.classList.add('input-error');
            firstNameInput.classList.add('input-error');
            isValid = false;
        }

        const pwdErr = validatePassword(pwd);
        if (pwdErr) {
            passwordErrorSpan.textContent = pwdErr;
            passwordInput.classList.add('input-error');
            isValid = false;
        }

        const confirmErr = validateConfirm(pwd, confirm);
        if (confirmErr) {
            confirmErrorSpan.textContent = confirmErr;
            confirmInput.classList.add('input-error');
            isValid = false;
        }

        const termsErr = validateTerms(termsOk);
        if (termsErr) {
            const existingTermsError = document.getElementById('termsCustomError');
            if (!existingTermsError) {
                const termsErrorSpan = document.createElement('span');
                termsErrorSpan.id = 'termsCustomError';
                termsErrorSpan.className = 'error-message';
                termsErrorSpan.style.marginTop = '0px';
                termsErrorSpan.textContent = termsErr;
                const checkboxGroup = document.querySelector('.checkbox-group');
                checkboxGroup.appendChild(termsErrorSpan);
            } else {
                existingTermsError.textContent = termsErr;
            }
            isValid = false;
        } else {
            const existing = document.getElementById('termsCustomError');
            if (existing) existing.remove();
        }

        return isValid;
    }

    function submitRegistration() {
        const first_name = firstNameInput.value.trim();
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        showToast(`🎉 Привіт, ${first_name}! Акаунт создано.`, false);
    }

        form.addEventListener('submit', (e) => {
            if (validateForm()) {
                submitRegistration();
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

    const googleBtn = document.getElementById('googleSignup');
    const githubBtn = document.getElementById('githubSignup');

    googleBtn.addEventListener('click', () => {
        showToast('🌐 Перенаправлення на вхід через Google', false);
    });

    githubBtn.addEventListener('click', () => {
        showToast('🐙 Перенаправлення на вхід через GitHub', false);
    });

    const termsLink = document.getElementById('termsLink');
    const privacyLink = document.getElementById('privacyLink');
    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('📜 Показати умови використання (демо-окно)', false);
    });
    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('🔒 Політика кондефиційності (демо-информация)', false);
    });

    function setupLiveValidation(input, validator, errorSpan) {
        input.addEventListener('input', function () {
            const val = input.value;
            let errMsg = '';
            if (validator === 'username') errMsg = validateUsername(val);
            else if (validator === 'email') errMsg = validateEmail(val);
            else if (validator === 'last-name') errMsg = validateName(val);
            else if (validator === 'first-name') errMsg = validateName(val);
            else if (validator === 'password') errMsg = validatePassword(val);
            if (errMsg) {
                errorSpan.textContent = errMsg;
                input.classList.add('input-error');
            } else {
                errorSpan.textContent = '';
                input.classList.remove('input-error');
            }
            if (validator === 'password' && confirmInput.value) {
                const confirmVal = confirmInput.value;
                const confirmErr = validateConfirm(val, confirmVal);
                if (confirmErr) {
                    confirmErrorSpan.textContent = confirmErr;
                    confirmInput.classList.add('input-error');
                } else {
                    confirmErrorSpan.textContent = '';
                    confirmInput.classList.remove('input-error');
                }
            }
        });
    }

    setupLiveValidation(usernameInput, 'username', usernameErrorSpan);
    setupLiveValidation(firstNameInput, 'first-name', nameErrorSpan);
    setupLiveValidation(lastNameInput, 'last-name', nameErrorSpan)
    setupLiveValidation(emailInput, 'email', emailErrorSpan);
    setupLiveValidation(passwordInput, 'password', passwordErrorSpan);

    confirmInput.addEventListener('input', function () {
        const pwd = passwordInput.value;
        const confirmVal = confirmInput.value;
        const err = validateConfirm(pwd, confirmVal);
        if (err) {
            confirmErrorSpan.textContent = err;
            confirmInput.classList.add('input-error');
        } else {
            confirmErrorSpan.textContent = '';
            confirmInput.classList.remove('input-error');
        }
    });

    termsCheck.addEventListener('change', function () {
        const existing = document.getElementById('termsCustomError');
        if (existing && termsCheck.checked) existing.remove();
    });

    document.querySelectorAll('.toggle-password i').forEach(icon => {
        if (icon.classList.contains('fa-eye-slash')) return;
    });

    clearErrors();
})();