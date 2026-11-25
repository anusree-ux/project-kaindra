# CI/CD Deployment

CI checks code before deployment. GitHub Actions then builds Docker images,
deploys them to EC2 through AWS, and reports the result.

## Before a deployment

Ask the project owner to complete:

- [AWS infrastructure setup](./aws-infrastructure-setup.md)
- [Terraform deployment setup](./terraform-deployment.md)
- [Environment configuration](./environment-configuration.md)

The GitHub environment must contain:

| Name | Purpose |
|---|---|
| `AWS_REGION` | AWS region |
| `AWS_ROLE_ARN` | AWS role for GitHub Actions |
| `ECR_REGISTRY` | Container image registry |
| `EC2_INSTANCE_ID` | Server receiving the deployment |
| `EC2_ENVIRONMENT_TAG` | Must match `development` or `production` |
| `SECRET_NAME` | AWS Secrets Manager secret |
| `ECR_BACKEND_REPOSITORY` | Backend container repository |
| `ECR_FRONTEND_REPOSITORY` | Frontend container repository |
| `CADDY_DOMAIN` | Public website domain |
| `DATABASE_ROLLBACK_SAFE` | Set to `true` only for backward-compatible database changes |

Never put passwords or private keys in a GitHub variable. Browser variables
such as `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_MAPS_API_KEY` are public.

## How it runs

The [CI workflow](../.github/workflows/ci.yml) runs on pull requests and pushes
to `main` or `devops`. It tests the backend, lint-checks and builds the
frontend, and checks the Docker setup.

The [deployment workflow](../.github/workflows/deploy.yml) runs automatically
after successful CI on `main`. It deploys to `development`.

To choose an environment manually:

1. Open **GitHub → Actions**.
2. Select **Deploy**.
3. Choose **Run workflow**.
4. Select `main`, then choose `development` or `production`.

Production may require approval. A deployment will stop if GitHub, AWS, or EC2
configuration is missing or incorrect.

## After a run

Open the completed workflow in **GitHub Actions** and check the deployment
summary.

- **Success:** verify the website and important features.
- **Skipped:** a newer commit was added while this run was waiting.
- **Failed:** read the workflow output; do not retry repeatedly or bypass
  approval.

The deployment can attempt rollback, but it cannot undo database changes.
Only deploy database migrations that are backward-compatible.
