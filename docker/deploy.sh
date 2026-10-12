#!/bin/bash

set -euo pipefail

AWS_REGION="${AWS_REGION:?AWS_REGION is required}"
SECRET_NAME="${SECRET_NAME:?SECRET_NAME is required}"
ECR_REGISTRY="${ECR_REGISTRY:?ECR_REGISTRY is required}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"

APP_DIR="/opt/kaindra"
ENV_FILE="$APP_DIR/.env"
NGINX_DIR="$APP_DIR/nginx"

RAW_BASE_URL="https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${IMAGE_TAG}"

echo "Preparing application directory..."

mkdir -p "$APP_DIR"
mkdir -p "$NGINX_DIR"

echo "Downloading deployment files from GitHub commit: $IMAGE_TAG"

curl -fsSL \
  "$RAW_BASE_URL/docker/docker-compose.deploy.yml" \
  -o "$APP_DIR/docker-compose.yml"

curl -fsSL \
  "$RAW_BASE_URL/docker/nginx/default.conf" \
  -o "$NGINX_DIR/default.conf"

echo "Deployment files downloaded."

echo "Fetching application secrets..."

aws secretsmanager get-secret-value \
  --region "$AWS_REGION" \
  --secret-id "$SECRET_NAME" \
  --query SecretString \
  --output text > "$ENV_FILE"

chmod 600 "$ENV_FILE"

echo "Application secrets written to $ENV_FILE"

echo "Logging in to Amazon ECR..."

aws ecr get-login-password \
  --region "$AWS_REGION" \
  | docker login \
      --username AWS \
      --password-stdin "$ECR_REGISTRY"

echo "Pulling Docker images for commit: $IMAGE_TAG"

docker pull "${ECR_REGISTRY}/kaindra-dev-backend:${IMAGE_TAG}"
docker pull "${ECR_REGISTRY}/kaindra-dev-frontend:${IMAGE_TAG}"

echo "Starting application..."

cd "$APP_DIR"

export ECR_REGISTRY
export IMAGE_TAG

docker compose up -d

echo "Waiting for containers to become healthy..."

for i in {1..30}; do
  BACKEND_STATUS=$(docker inspect --format='{{.State.Health.Status}}' kaindra-backend 2>/dev/null || true)
  FRONTEND_STATUS=$(docker inspect --format='{{.State.Health.Status}}' kaindra-frontend 2>/dev/null || true)

  echo "Backend: $BACKEND_STATUS | Frontend: $FRONTEND_STATUS"

  if [[ "$BACKEND_STATUS" == "healthy" && "$FRONTEND_STATUS" == "healthy" ]]; then
    echo "Backend and frontend are healthy."
    break
  fi

  if [[ "$BACKEND_STATUS" == "unhealthy" || "$FRONTEND_STATUS" == "unhealthy" ]]; then
    echo "Deployment failed: a container is unhealthy."
    docker compose ps
    docker compose logs --tail=100
    exit 1
  fi

  if [[ "$i" -eq 30 ]]; then
    echo "Deployment failed: containers did not become healthy within the expected time."
    docker compose ps
    docker compose logs --tail=100
    exit 1
  fi

  sleep 5
done

echo "Deployment completed successfully."

docker compose ps