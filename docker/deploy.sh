#!/bin/bash

set -Eeuo pipefail
umask 077

AWS_REGION="${AWS_REGION:?AWS_REGION is required}"
SECRET_NAME="${SECRET_NAME:?SECRET_NAME is required}"
ECR_REGISTRY="${ECR_REGISTRY:?ECR_REGISTRY is required}"
ECR_BACKEND_REPOSITORY="${ECR_BACKEND_REPOSITORY:?ECR_BACKEND_REPOSITORY is required}"
ECR_FRONTEND_REPOSITORY="${ECR_FRONTEND_REPOSITORY:?ECR_FRONTEND_REPOSITORY is required}"
BACKEND_IMAGE="${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:?FRONTEND_IMAGE is required}"
CADDY_DOMAIN="${CADDY_DOMAIN:?CADDY_DOMAIN is required}"
DEPLOYMENT_ENVIRONMENT="${DEPLOYMENT_ENVIRONMENT:?DEPLOYMENT_ENVIRONMENT is required}"
DATABASE_ROLLBACK_SAFE="${DATABASE_ROLLBACK_SAFE:-false}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
GITHUB_SHA="${GITHUB_SHA:?GITHUB_SHA is required}"

APP_DIR="/opt/kaindra"
ENV_FILE="$APP_DIR/.env"
LAST_GOOD_FILE="$APP_DIR/.last-good-images"
DEPLOYMENT_STARTED=0
STEP="initialization"
BACKUP_DIR=""
SECRET_TMP_FILE=""
RELEASE_TMP_FILE=""
PREVIOUS_BACKEND_IMAGE=""
PREVIOUS_FRONTEND_IMAGE=""
PREVIOUS_CADDY_DOMAIN=""

RAW_BASE_URL="https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_SHA}"

cleanup_temporary_files() {
  if [[ -n "$SECRET_TMP_FILE" ]]; then
    if ! rm -f "$SECRET_TMP_FILE"; then
      echo "SECRET_TEMP_CLEANUP_FAILED path=$SECRET_TMP_FILE"
    fi
  fi
  if [[ -n "$RELEASE_TMP_FILE" ]]; then
    if ! rm -f "$RELEASE_TMP_FILE"; then
      echo "RELEASE_TEMP_CLEANUP_FAILED path=$RELEASE_TMP_FILE"
    fi
  fi
}
trap cleanup_temporary_files EXIT

record_backup_file() {
  local name="$1"
  local source="$2"

  if [[ -e "$source" ]]; then
    printf 'present\n' > "$BACKUP_DIR/$name.existed"
    cp -p "$source" "$BACKUP_DIR/$name"
  else
    printf 'absent\n' > "$BACKUP_DIR/$name.existed"
  fi
}

restore_backup_file() {
  local name="$1"
  local destination="$2"
  local marker="$BACKUP_DIR/$name.existed"
  local existed

  if [[ ! -f "$marker" ]]; then
    echo "CONFIG_RESTORE_FAILED file=$destination reason=original-presence-not-recorded"
    return 1
  fi
  IFS= read -r existed < "$marker"

  if [[ "$existed" == "present" ]]; then
    if [[ ! -f "$BACKUP_DIR/$name" ]] ||
      ! cp -p "$BACKUP_DIR/$name" "$destination" ||
      ! cmp -s "$BACKUP_DIR/$name" "$destination"; then
      echo "CONFIG_RESTORE_FAILED file=$destination reason=backup-restore-or-verification-failed"
      return 1
    fi
  elif [[ "$existed" == "absent" ]]; then
    if [[ -e "$destination" ]] && ! rm -f "$destination"; then
      echo "CONFIG_RESTORE_FAILED file=$destination reason=remove-new-file-failed"
      return 1
    fi
    if [[ -e "$destination" ]]; then
      echo "CONFIG_RESTORE_FAILED file=$destination reason=new-file-still-exists"
      return 1
    fi
  else
    echo "CONFIG_RESTORE_FAILED file=$destination reason=invalid-presence-marker"
    return 1
  fi

  echo "CONFIG_RESTORE_OK file=$destination"
  return 0
}

restore_configuration() {
  local failed=0
  restore_backup_file docker-compose.yml "$APP_DIR/docker-compose.yml" || failed=1
  restore_backup_file Caddyfile "$APP_DIR/Caddyfile" || failed=1
  restore_backup_file .env "$ENV_FILE" || failed=1
  restore_backup_file .last-good-images "$LAST_GOOD_FILE" || failed=1
  return "$failed"
}

remove_recovery_backup() {
  local file
  for file in \
    docker-compose.yml Caddyfile .env .last-good-images \
    docker-compose.yml.existed Caddyfile.existed .env.existed .last-good-images.existed; do
    if [[ -e "$BACKUP_DIR/$file" ]]; then
      if ! rm -f "$BACKUP_DIR/$file" || [[ -e "$BACKUP_DIR/$file" ]]; then
        echo "RECOVERY_BACKUP_RETAINED path=$BACKUP_DIR reason=cleanup-failed"
        return 1
      fi
    fi
  done
  if ! rmdir "$BACKUP_DIR"; then
    echo "RECOVERY_BACKUP_RETAINED path=$BACKUP_DIR reason=directory-not-empty"
    return 1
  fi
  BACKUP_DIR=""
  return 0
}

verify_stopped() {
  local name status
  for name in kaindra-backend kaindra-frontend kaindra-nginx; do
    status="$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null || true)"
    if [[ -n "$status" && "$status" != "exited" ]]; then
      echo "SERVICE_STOP_FAILED container=$name status=$status"
      return 1
    fi
  done
  echo "SERVICE_STOP_OK application containers are stopped; named volumes were preserved."
}

stop_application_services() {
  local name status failed=0
  for name in kaindra-backend kaindra-frontend kaindra-nginx; do
    status="$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null || true)"
    if [[ -n "$status" && "$status" != "exited" ]]; then
      if ! docker stop "$name" >/dev/null; then
        echo "SERVICE_STOP_FAILED container=$name"
        failed=1
      fi
    fi
  done
  verify_stopped || failed=1
  return "$failed"
}

valid_image_reference() {
  local image="$1"
  local repository="$2"
  local prefix="$ECR_REGISTRY/$repository@"
  local digest

  [[ "$image" == "$prefix"* ]] || return 1
  digest="${image#"$prefix"}"
  [[ "$digest" =~ ^sha256:[a-f0-9]{64}$ ]]
}

verify_running_images() {
  local backend_expected backend_actual frontend_expected frontend_actual
  backend_expected="$(docker image inspect --format='{{.Id}}' "$BACKEND_IMAGE" 2>/dev/null)" || return 1
  backend_actual="$(docker inspect --format='{{.Image}}' kaindra-backend 2>/dev/null)" || return 1
  frontend_expected="$(docker image inspect --format='{{.Id}}' "$FRONTEND_IMAGE" 2>/dev/null)" || return 1
  frontend_actual="$(docker inspect --format='{{.Image}}' kaindra-frontend 2>/dev/null)" || return 1

  if [[ "$backend_actual" != "$backend_expected" || "$frontend_actual" != "$frontend_expected" ]]; then
    echo "RUNNING_IMAGE_CHECK_FAILED backend_id=$backend_actual expected_backend_id=$backend_expected frontend_id=$frontend_actual expected_frontend_id=$frontend_expected"
    return 1
  fi
  echo "RUNNING_IMAGE_CHECK_OK backend=$BACKEND_IMAGE frontend=$FRONTEND_IMAGE"
}

wait_for_health() {
  local attempt backend_status backend_ready frontend_status caddy_status
  local http_status https_status

  for attempt in {1..30}; do
    backend_status="$(docker inspect --format='{{.State.Health.Status}}' kaindra-backend 2>/dev/null || true)"
    if docker exec kaindra-backend wget -q --spider http://127.0.0.1:5000/ready >/dev/null 2>&1; then
      backend_ready="ready"
    else
      backend_ready="not-ready"
    fi
    frontend_status="$(docker inspect --format='{{.State.Health.Status}}' kaindra-frontend 2>/dev/null || true)"
    caddy_status="$(docker inspect --format='{{.State.Status}}' kaindra-nginx 2>/dev/null || true)"
    http_status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 \
      -H "Host: $CADDY_DOMAIN" http://127.0.0.1/ 2>/dev/null || true)"

    https_status="not-required"
    if [[ "$DEPLOYMENT_ENVIRONMENT" == "production" ]]; then
      https_status="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 10 \
        --resolve "$CADDY_DOMAIN:443:127.0.0.1" "https://$CADDY_DOMAIN/" 2>/dev/null || true)"
    fi

    if [[ "$backend_status" == "healthy" &&
      "$backend_ready" == "ready" &&
      "$frontend_status" == "healthy" &&
      "$caddy_status" == "running" &&
      "$http_status" =~ ^[23][0-9][0-9]$ &&
      ( "$DEPLOYMENT_ENVIRONMENT" != "production" || "$https_status" =~ ^2[0-9][0-9]$ ) ]]; then
      echo "HEALTH_CHECK backend=$backend_status readiness=$backend_ready frontend=$frontend_status caddy=$caddy_status http=$http_status https=$https_status"
      return 0
    fi

    if [[ "$attempt" -eq 30 ]]; then
      echo "HEALTH_CHECK_FAILED backend=${backend_status:-missing} readiness=$backend_ready frontend=${frontend_status:-missing} caddy=${caddy_status:-missing} http=${http_status:-unavailable} https=${https_status:-unavailable}"
      return 1
    fi
    sleep 5
  done
}

handle_error() {
  local exit_code="${1:-$?}"
  local recovery_ok=1
  trap - ERR INT TERM
  set +e

  echo "DEPLOYMENT_RESULT=failed commit=$GITHUB_SHA image_tag=$IMAGE_TAG step=$STEP"

  if [[ "$DEPLOYMENT_STARTED" -eq 1 ]]; then
    if [[ -n "$PREVIOUS_BACKEND_IMAGE" && -n "$PREVIOUS_FRONTEND_IMAGE" ]]; then
      if [[ "$DATABASE_ROLLBACK_SAFE" != "true" ]]; then
        echo "ROLLBACK_RESULT=blocked database rollback safety was not confirmed; stopping the new services and retaining recovery backup."
        stop_application_services || recovery_ok=0
        recovery_ok=0
      else
        echo "ROLLBACK_RESULT=attempting backend=$PREVIOUS_BACKEND_IMAGE frontend=$PREVIOUS_FRONTEND_IMAGE"

        if [[ -n "$BACKUP_DIR" ]] && restore_configuration; then
          BACKEND_IMAGE="$PREVIOUS_BACKEND_IMAGE"
          FRONTEND_IMAGE="$PREVIOUS_FRONTEND_IMAGE"
          IMAGE_TAG="${PREVIOUS_BACKEND_IMAGE##*@}"
          CADDY_DOMAIN="${PREVIOUS_CADDY_DOMAIN:-$CADDY_DOMAIN}"
          ECR_REGISTRY="${PREVIOUS_BACKEND_IMAGE%%/*}"
          ECR_BACKEND_REPOSITORY="${PREVIOUS_BACKEND_IMAGE#*/}"
          ECR_BACKEND_REPOSITORY="${ECR_BACKEND_REPOSITORY%@*}"
          ECR_FRONTEND_REPOSITORY="${PREVIOUS_FRONTEND_IMAGE#*/}"
          ECR_FRONTEND_REPOSITORY="${ECR_FRONTEND_REPOSITORY%@*}"
          export ECR_REGISTRY ECR_BACKEND_REPOSITORY ECR_FRONTEND_REPOSITORY
          export BACKEND_IMAGE FRONTEND_IMAGE CADDY_DOMAIN IMAGE_TAG DEPLOYMENT_ENVIRONMENT

          if ! docker image inspect "$PREVIOUS_BACKEND_IMAGE" >/dev/null 2>&1; then
            docker pull "$PREVIOUS_BACKEND_IMAGE" >/dev/null || recovery_ok=0
          fi
          if ! docker image inspect "$PREVIOUS_FRONTEND_IMAGE" >/dev/null 2>&1; then
            docker pull "$PREVIOUS_FRONTEND_IMAGE" >/dev/null || recovery_ok=0
          fi

          if [[ "$recovery_ok" -eq 1 ]] &&
            docker compose -f "$APP_DIR/docker-compose.yml" config --quiet &&
            docker compose -f "$APP_DIR/docker-compose.yml" up -d --no-build --force-recreate --pull never >/dev/null &&
            verify_running_images &&
            wait_for_health; then
            echo "ROLLBACK_RESULT=succeeded image_tag=$IMAGE_TAG backend_image=$BACKEND_IMAGE frontend_image=$FRONTEND_IMAGE"
          else
            echo "ROLLBACK_RESULT=failed; detailed logs and configuration backups remain on the host."
            stop_application_services || echo "ROLLBACK_STOP_RESULT=failed; one or more application containers may still be running."
            recovery_ok=0
          fi
        else
          echo "ROLLBACK_RESULT=failed; configuration restoration failed and backups are retained."
          stop_application_services || echo "ROLLBACK_STOP_RESULT=failed; one or more application containers may still be running."
          recovery_ok=0
        fi
      fi
    else
      echo "ROLLBACK_RESULT=unavailable; no previous release was available."
      if stop_application_services &&
        [[ -n "$BACKUP_DIR" ]] &&
        restore_configuration; then
        echo "FIRST_DEPLOYMENT_FAILURE=services stopped; named volumes were preserved."
      else
        echo "FIRST_DEPLOYMENT_RECOVERY=failed; backup retained for manual recovery."
        recovery_ok=0
      fi
    fi
  elif [[ -n "$BACKUP_DIR" ]]; then
    if ! restore_configuration; then
      echo "CONFIG_RESTORE_RESULT=failed; backups are retained."
      recovery_ok=0
    fi
  fi

  if [[ "$recovery_ok" -eq 1 && -n "$BACKUP_DIR" ]]; then
    remove_recovery_backup || recovery_ok=0
  fi

  if [[ "$recovery_ok" -ne 1 && -n "$BACKUP_DIR" ]]; then
    echo "RECOVERY_BACKUP_RETAINED path=$BACKUP_DIR"
  fi
  exit "$exit_code"
}
trap 'handle_error $?' ERR
trap 'handle_error 130' INT
trap 'handle_error 143' TERM

echo "DEPLOYMENT_START commit=$GITHUB_SHA image_tag=$IMAGE_TAG backend_image=$BACKEND_IMAGE frontend_image=$FRONTEND_IMAGE"

if [[ ! "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ || "$GITHUB_SHA" != "$IMAGE_TAG" ]]; then
  echo "IMAGE_TAG must equal the full Git commit SHA."
  false
fi

if ! valid_image_reference "$BACKEND_IMAGE" "$ECR_BACKEND_REPOSITORY" ||
  ! valid_image_reference "$FRONTEND_IMAGE" "$ECR_FRONTEND_REPOSITORY"; then
  echo "Deployment images must be digest-pinned references in the configured ECR repositories."
  false
fi

if [[ "$DEPLOYMENT_ENVIRONMENT" != "development" && "$DEPLOYMENT_ENVIRONMENT" != "production" ]]; then
  echo "DEPLOYMENT_ENVIRONMENT must be development or production."
  false
fi

if [[ "$DATABASE_ROLLBACK_SAFE" != "true" ]]; then
  echo "DEPLOYMENT_BLOCKED database migration rollback safety is not confirmed; only backward-compatible database migrations may be deployed."
  false
fi

STEP="prepare"
mkdir -p "$APP_DIR"
BACKUP_DIR="$(mktemp -d "$APP_DIR/.rollback.XXXXXX")"
record_backup_file docker-compose.yml "$APP_DIR/docker-compose.yml"
record_backup_file Caddyfile "$APP_DIR/Caddyfile"
record_backup_file .env "$ENV_FILE"
record_backup_file .last-good-images "$LAST_GOOD_FILE"

if [[ -f "$LAST_GOOD_FILE" ]]; then
  STEP="validate-previous-release"
  if [[ "$(wc -l < "$LAST_GOOD_FILE")" -ne 1 ]]; then
    echo "PREVIOUS_RELEASE_INVALID reason=expected-one-complete-record"
    false
  fi
  IFS=$'\t' read -r PREVIOUS_BACKEND_IMAGE PREVIOUS_FRONTEND_IMAGE PREVIOUS_CADDY_DOMAIN EXTRA < "$LAST_GOOD_FILE"
else
  PREVIOUS_BACKEND_IMAGE="$(docker inspect --format='{{.Config.Image}}' kaindra-backend 2>/dev/null || true)"
  PREVIOUS_FRONTEND_IMAGE="$(docker inspect --format='{{.Config.Image}}' kaindra-frontend 2>/dev/null || true)"
fi
if [[ -z "$PREVIOUS_CADDY_DOMAIN" ]]; then
  PREVIOUS_CADDY_DOMAIN="$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' kaindra-nginx 2>/dev/null |
    sed -n 's/^CADDY_DOMAIN=//p' | head -n 1 || true)"
fi

if [[ -n "$PREVIOUS_BACKEND_IMAGE" || -n "$PREVIOUS_FRONTEND_IMAGE" || -f "$LAST_GOOD_FILE" ]]; then
  if [[ -n "${EXTRA:-}" ||
    -z "$PREVIOUS_CADDY_DOMAIN" ||
    -z "$PREVIOUS_BACKEND_IMAGE" ||
    -z "$PREVIOUS_FRONTEND_IMAGE" ]] ||
    ! valid_image_reference "$PREVIOUS_BACKEND_IMAGE" "$ECR_BACKEND_REPOSITORY" ||
    ! valid_image_reference "$PREVIOUS_FRONTEND_IMAGE" "$ECR_FRONTEND_REPOSITORY"; then
    echo "PREVIOUS_RELEASE_INVALID reason=missing-fields-or-image-not-digest-pinned; refusing deployment to preserve a known rollback target."
    false
  fi
fi

STEP="download-configuration"
echo "Downloading deployment configuration for commit $GITHUB_SHA."
curl -fsSL "$RAW_BASE_URL/docker/docker-compose.deploy.yml" -o "$APP_DIR/docker-compose.yml"
curl -fsSL "$RAW_BASE_URL/docker/Caddyfile" -o "$APP_DIR/Caddyfile"

STEP="fetch-secrets"
SECRET_TMP_FILE="$(mktemp "$APP_DIR/.env.XXXXXX")"
aws secretsmanager get-secret-value \
  --region "$AWS_REGION" \
  --secret-id "$SECRET_NAME" \
  --query SecretString \
  --output text > "$SECRET_TMP_FILE"
chmod 600 "$SECRET_TMP_FILE"
mv "$SECRET_TMP_FILE" "$ENV_FILE"
SECRET_TMP_FILE=""

STEP="ecr-login"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY" >/dev/null

cd "$APP_DIR"
export ECR_REGISTRY ECR_BACKEND_REPOSITORY ECR_FRONTEND_REPOSITORY
export BACKEND_IMAGE FRONTEND_IMAGE CADDY_DOMAIN IMAGE_TAG DEPLOYMENT_ENVIRONMENT

STEP="compose-validation"
docker compose -f "$APP_DIR/docker-compose.yml" config --quiet

STEP="pull-images"
docker pull "$BACKEND_IMAGE" >/dev/null
docker pull "$FRONTEND_IMAGE" >/dev/null
docker image inspect "$BACKEND_IMAGE" >/dev/null
docker image inspect "$FRONTEND_IMAGE" >/dev/null
if ! docker image inspect caddy:2-alpine >/dev/null 2>&1; then
  docker pull caddy:2-alpine >/dev/null
fi

STEP="container-startup"
DEPLOYMENT_STARTED=1
docker compose -f "$APP_DIR/docker-compose.yml" up -d --no-build --force-recreate --pull never >/dev/null

STEP="health-check"
wait_for_health
verify_running_images

STEP="record-release"
RELEASE_TMP_FILE="$(mktemp "$APP_DIR/.release.XXXXXX")"
printf '%s\t%s\t%s\n' "$BACKEND_IMAGE" "$FRONTEND_IMAGE" "$CADDY_DOMAIN" > "$RELEASE_TMP_FILE"
chmod 600 "$RELEASE_TMP_FILE"
mv "$RELEASE_TMP_FILE" "$LAST_GOOD_FILE"
RELEASE_TMP_FILE=""

if ! remove_recovery_backup; then
  echo "DEPLOYMENT_WARNING recovery backup could not be fully removed."
fi
echo "DEPLOYMENT_RESULT=success commit=$GITHUB_SHA backend_image=$BACKEND_IMAGE frontend_image=$FRONTEND_IMAGE"
