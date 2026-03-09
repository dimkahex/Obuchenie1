# Развёртывание в OpenShift

## Порядок применения манифестов

Сначала создайте проект и примените базовые ресурсы (ConfigMaps, Secrets, PVC), затем сервисы (чтобы DNS имён был доступен), затем деплойменты, маршруты и HPA.

```bash
# 1. Проект
oc new-project myapp --display-name="Microservices Demo"

# 2. Базовые ресурсы (ConfigMaps, Secrets, PVC, init SQL)
oc apply -f base/

# 3. Services (чтобы имена postgres-*, redis были известны до старта подов)
oc apply -f services/

# 4. Deployments (образы нужно собрать и запушить — см. ниже)
oc apply -f deployments/

# 5. Маршруты (OpenShift)
oc apply -f routes/

# 6. HPA (опционально)
oc apply -f hpa/
```

## Образы приложений

Манифесты ссылаются на образы вида `auth-service:latest`, `user-service:latest` и т.д. Варианты:

### Вариант A: Сборка в OpenShift (BuildConfig)

Используйте `oc new-app` с Dockerfile или S2I, например:

```bash
oc new-app . --name=auth-service --strategy=docker -e JWT_SECRET=from-secret
# или из репозитория:
# oc new-app https://github.com/your/repo --context-dir=services/auth --name=auth-service
```

После сборки образ попадёт в ImageStream. В Deployment замените `image: auth-service:latest` на `image: image-registry.openshift-image-registry.svc:5000/myapp/auth-service:latest` или используйте imageStream в манифесте.

### Вариант B: Сборка локально и пуш в registry OpenShift

```bash
# Войти в registry OpenShift
oc whoami -t | docker login -u $(oc whoami) --password-stdin $(oc get route default-route -n openshift-image-registry -o jsonpath='{.spec.host}' 2>/dev/null || echo "image-registry.openshift-image-registry.svc:5000")

# Сборка и пуш (подставьте свой registry/host)
export REGISTRY=$(oc get route default-route -n openshift-image-registry -o jsonpath='{.spec.host}' 2>/dev/null)
docker build -t $REGISTRY/myapp/auth-service:latest ./services/auth
docker push $REGISTRY/myapp/auth-service:latest
```

В Deployment укажите полное имя образа: `image: <registry>/myapp/auth-service:latest`.

### Вариант C: Образы из внешнего registry

Соберите образы на своей машине и запушьте в Docker Hub (или другой registry). В манифестах укажите, например, `image: docker.io/youruser/auth-service:latest` и при необходимости `imagePullSecrets` для доступа к приватному registry.

## Проверка

```bash
oc get pods
oc get svc
oc get routes
oc get hpa
```

Логи пода:

```bash
oc logs -f deployment/auth-service
```

## Kubernetes (без OpenShift)

Используйте каталог `ingress/` вместо `routes/` и установите Ingress Controller (например, NGINX Ingress). Секреты и ConfigMaps те же. API версии Route — только для OpenShift; в обычном K8s используйте только Deployment, Service, Ingress, HPA из этих манифестов.
