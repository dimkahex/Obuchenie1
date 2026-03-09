# Сборка образов в OpenShift

Чтобы не пушить образы извне, можно собирать их в кластере через BuildConfig.

## Из исходного кода (Source-to-Image или Docker)

После клонирования репозитория в OpenShift или загрузки бинарников:

```bash
# Создать образы из Dockerfile (нужен доступ к исходникам в кластере)
oc new-build --name=auth-service --binary -l app=auth-service
oc start-build auth-service --from-dir=./services/auth --follow

oc new-build --name=user-service --binary -l app=user-service
oc start-build user-service --from-dir=./services/user --follow

# ... аналогично для catalog, order, notification, api-gateway

# Frontend (сборка в два шага или multi-stage Dockerfile уже есть)
oc new-build --name=frontend --binary -l app=frontend
oc start-build frontend --from-dir=./frontend --follow
```

В Deployment тогда укажите образ из ImageStream:

```yaml
spec:
  template:
    spec:
      containers:
        - name: auth
          image: image-registry.openshift-image-registry.svc:5000/myapp/auth-service:latest
          # или просто image: auth-service:latest если ImageStream в том же проекте
```

## Из Git

Если репозиторий в Git:

```bash
oc new-app https://github.com/YOUR_USER/YOUR_REPO#main --context-dir=services/auth --name=auth-service --strategy=docker
```

После сборки обновите Deployment, чтобы использовать образ из ImageStream (имя сервиса совпадает с именем образа в проекте).
