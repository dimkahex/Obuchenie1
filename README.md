# Микросервисное приложение для OpenShift/Kubernetes

Учебный проект: полноценная микросервисная архитектура для развёртывания в OpenShift.

**Работа через Git (хост + VM):** пошаговая инструкция — [GIT-WORKFLOW.md](GIT-WORKFLOW.md). Имитирует реальную систему (каталог товаров, заказы, пользователи, уведомления).

## Архитектура

```
                    [Ingress/Route]
                           |
                    +------+------+
                    |   Frontend  |
                    +------+------+
                           |
              +------------+------------+
              |      API Gateway        |
              +------------+------------+
                    |    |    |    |
        +-----------+----+----+----+-----------+
        |           |         |         |     |
   [Auth]      [Users]   [Catalog]  [Orders] [Notifications]
        |           |         |         |     |
        +-----------+---------+---------+-----+
                    |         |         |
              +-----+-----+   |   +-----+-----+
              | PostgreSQL |  |   |   Redis   |
              |  (users)   |  |   | (cache)   |
              +------------+  |   +-----------+
              +------------+  |
              | PostgreSQL |  |
              | (catalog)  |  |
              +------------+  |
              +------------+  |
              | PostgreSQL |  |
              |  (orders)  |  |
              +------------+---+
```

## Компоненты

| Сервис | Назначение | Порт | БД |
|--------|------------|------|-----|
| **frontend** | SPA интерфейс | 8080 | — |
| **api-gateway** | Маршрутизация, агрегация запросов | 8080 | — |
| **auth-service** | JWT, логин/логаут | 8081 | — |
| **user-service** | CRUD пользователей | 8082 | PostgreSQL |
| **catalog-service** | Каталог товаров | 8083 | PostgreSQL |
| **order-service** | Заказы | 8084 | PostgreSQL |
| **notification-service** | События, уведомления | 8085 | Redis |

## Структура репозитория

```
├── README.md
├── docker-compose.yml          # Локальная разработка
├── openshift/                  # Манифесты OpenShift/Kubernetes
│   ├── base/                   # Базовые ресурсы (ConfigMaps, Secrets, PVC)
│   ├── deployments/            # Deployments для каждого сервиса
│   ├── services/
│   ├── routes/
│   ├── ingress/
│   ├── hpa/                    # Horizontal Pod Autoscaler
│   └── kustomization.yaml      # Опционально: Kustomize
├── frontend/
├── api-gateway/
├── services/
│   ├── auth/
│   ├── user/
│   ├── catalog/
│   ├── order/
│   └── notification/
└── db/                         # SQL-скрипты инициализации
```

## Быстрый старт в OpenShift

1. Создать проект:
   ```bash
   oc new-project myapp --display-name="Microservices Demo"
   ```

2. Применить манифесты (по порядку):
   ```bash
   oc apply -f openshift/base/
   oc apply -f openshift/deployments/
   oc apply -f openshift/services/
   oc apply -f openshift/routes/
   oc apply -f openshift/hpa/
   ```

3. Или всё сразу:
   ```bash
   oc apply -f openshift/ -R
   ```

4. Проверить поды:
   ```bash
   oc get pods -w
   oc get routes
   ```

5. **Фронтенд и API:** если у фронтенда и API разные маршруты (хосты), соберите фронтенд с переменной `VITE_API_URL=https://<ваш-route-api>/api`, чтобы запросы шли на API. Если фронт и API отдаются с одного домена (через общий Ingress/Route с путями), оставьте `VITE_API_URL=/api`.

## Локальный запуск (Docker Compose)

```bash
docker-compose up -d
# Frontend: http://localhost:3000
# API: http://localhost:8080
```

## Что изучить в OpenShift/Kubernetes

- **Pods** — минимальная единица деплоя (несколько подов на сервис при HPA).
- **Deployments** — управление репликами, rolling update.
- **Services** — ClusterIP, обнаружение сервисов по имени.
- **Routes/Ingress** — внешний доступ, TLS.
- **ConfigMaps и Secrets** — конфигурация и пароли.
- **PersistentVolumeClaim** — постоянное хранилище для БД.
- **Horizontal Pod Autoscaler (HPA)** — автомасштабирование по CPU/памяти.
- **Probes** — readiness/liveness для здоровья подов.
- **Resource limits/requests** — лимиты CPU и памяти.
