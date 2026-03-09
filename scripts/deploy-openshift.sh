#!/bin/bash
# Применяет манифесты OpenShift в правильном порядке.
# Использование: ./scripts/deploy-openshift.sh [namespace]
set -e
NAMESPACE="${1:-myapp}"

echo "Creating project $NAMESPACE..."
oc new-project "$NAMESPACE" --display-name="Microservices Demo" 2>/dev/null || oc project "$NAMESPACE"

echo "Applying base (ConfigMaps, Secrets, PVC)..."
oc apply -f openshift/base/

echo "Applying Services..."
oc apply -f openshift/services/

echo "Applying Deployments..."
oc apply -f openshift/deployments/

echo "Applying Routes..."
oc apply -f openshift/routes/

echo "Applying HPA..."
oc apply -f openshift/hpa/

echo "Done. Check: oc get pods -n $NAMESPACE"
