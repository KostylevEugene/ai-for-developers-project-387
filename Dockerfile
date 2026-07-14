# === ЭТАП 1: Сборка фронтенда ===
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Копирование package файлов для кэширования npm workspaces
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

RUN npm ci

# Копирование кода фронтенда
COPY frontend/ ./frontend/

# Для сборки фронтенда, развернутого на одном домене/порту с бэкендом,
# мы отключаем порт в API_BASE_URL, чтобы запросы шли по относительным путям.
# Мы устанавливаем VITE_BACKEND_URL в пустую строку, а PORT в 'false'.
ARG PORT=false
ARG VITE_BACKEND_URL=""
ENV PORT=$PORT
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run frontend:build


# === ЭТАП 2: Финальный образ (Python + Nginx + Supervisor) ===
FROM python:3.10-slim

# Установка переменных окружения для Python и Poetry
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.2 \
    POETRY_HOME="/opt/poetry" \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PORT=8080

# Установка системных зависимостей (Nginx, Supervisor, curl, PostgreSQL-клиент, gettext-base для envsubst)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    build-essential \
    libpq-dev \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Установка Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="$POETRY_HOME/bin:$PATH"

WORKDIR /app

# Установка Python-зависимостей бэкенда
COPY backend/pyproject.toml ./
RUN poetry install --no-root --only main --no-interaction --no-ansi

# Копирование кода бэкенда
COPY backend/app/ ./app/
COPY backend/migrations/ ./migrations/
COPY backend/alembic.ini ./

# Директория для SQLite-файла (используется по умолчанию, если DATABASE_URL не задан)
RUN mkdir -p /app/data

# Копирование скомпилированного фронтенда из Этапа 1
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Копирование конфигураций Nginx и Supervisor
COPY nginx.conf.template /etc/nginx/sites-available/default.template
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Создаем симлинк на default в sites-enabled
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Открываем порт приложения (управляется переменной окружения PORT, по умолчанию 8080)
EXPOSE 8080

# Запуск: сначала подменяем PORT в шаблоне Nginx, затем запускаем supervisor
CMD ["sh", "-c", "envsubst '${PORT}' < /etc/nginx/sites-available/default.template > /etc/nginx/sites-available/default && /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf"]
