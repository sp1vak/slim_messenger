# 🚀 Messenger SLIM

Сучасний real-time додаток для обміну повідомленнями, побудований на Django та Django Channels, повністю контейнеризований за допомогою Docker.

---

## 🛠 Технологічний стек

* **Backend:** Django 5.x, Django Channels (WebSockets), Redis
* **Database:** PostgreSQL
* **Containerization:** Docker, Docker Compose
* **Web Server:** Daphne, Nginx

---

## 📋 Функціонал

* 🔐 **Аутентифікація:** Реєстрація, авторизація та відновлення паролю.
* 🌐 **Social Auth:** Вхід в один клік за допомогою Google та GitHub.
* 💬 **Real-time чат:** Миттєвий обмін повідомленнями без перезавантаження сторінки.
* 🟢 **Статус користувачів:** Відображення статусу "в мережі" / "офлайн".
* 👥 **Групові чати:** Створення кімнат для спілкування кількох людей.
* 🔔 **Сповіщення:** Звукові та візуальні тост-сповіщення про нові повідомлення.

---

## ⚙️ Встановлення і запуск (Docker)

> [!NOTE]
> Перед початком переконайтеся, що у вас встановлено **Docker** та **Docker Compose**.

### 1. Клонуйте репозиторій
```bash
git clone [https://github.com/sp1vak/slim_messenger.git](https://github.com/sp1vak/slim_messenger.git)
cd slim_messenger

```

### 2. Налаштуйте змінні оточення

Створіть файл `.env` у кореневій директорії проєкту та заповніть його:

```env
DEBUG=True
ALLOWED_HOSTS=[localhost,127.0.0.1]
SECRET_KEY='your-secret-key-here'

POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

```

### 3. Налаштуйте авторизацію Google та GitHub

Створіть файл `socialapps.json` у кореневій директорії та додайте ваші ключі (не забудьте замінити `your_client_id` та `secret_key` на реальні дані з консолей розробників):

```json
[
  {
    "model": "socialaccount.socialapp",
    "pk": 1,
    "fields": {
      "provider": "google",
      "name": "Google",
      "client_id": "your_client_id",
      "secret": "secret_key",
      "key": ""
    }
  },
  {
    "model": "socialaccount.socialapp",
    "pk": 2,
    "fields": {
      "provider": "github",
      "name": "GitHub",
      "client_id": "your_client_id",
      "secret": "secret_key",
      "key": ""
    }
  }
]

```

### 4. Зберіть та запустіть контейнери

Міграції та збірка статики виконаються автоматично під час старту:

```bash
docker-compose up --build

```

### 5. Створіть суперкористувача

В окремому терміналі виконайте команду для створення адміна:

```bash
docker-compose exec web python manage.py createsuperuser

```

Тепер ваш застосунок доступний за адресою: **http://localhost:8000/** 🚀

---

## 💡 Корисні підказки та команди

**Запуск проєкту у фоновому режимі:**

```bash
docker-compose up -d

```

**Перегляд логів у реальному часі:**

```bash
docker-compose logs -f

```

**Виконання команд `manage.py` всередині контейнера:**

```bash
docker-compose exec web python manage.py <your_command>

```

**Зупинка проєкту та видалення контейнерів:**

```bash
docker-compose down

```

Рекомендується створити файл `.dockerignore` в корені проєкту, щоб уникнути копіювання зайвих файлів (віртуального оточення, кешу, локальних медіа-файлів) у Docker-образ.

Приклад `.dockerignore`:

```text
venv/
.env
.env.*
.git/
.gitignore
Dockerfile
.dockerignore
__pycache__/
media/

```

> [!IMPORTANT]
> Папка `migrations/` свідомо **відсутня** у `.dockerignore`. Без локальних файлів міграцій Django згенерує їх всередині Docker з нуля, що порушить правильний порядок їх виконання та призведе до помилок бази даних.

---

## 🤝 Контакти та контрибуція

Якщо у вас є запитання, знайшли баг або хочете запропонувати покращення — створюйте **Issue** або надсилайте **Pull Request**. Буду радий фідбеку!

* **Автор:** Костянтин
* **Email:** [sp1vak@icloud.com]()
* **GitHub:** [@sp1vak](https://www.google.com/search?q=https://github.com/sp1vak)
* **Telegram:** [@sp2vak](https://www.google.com/search?q=https://t.me/sp2vak)

---

## 📄 Ліцензія

Цей проєкт розповсюджується під ліцензією **MIT**. Подробиці можна знайти у файлі [[LICENSE](LICENSE.txt)].