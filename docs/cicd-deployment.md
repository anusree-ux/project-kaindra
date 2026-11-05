# CI/CD Deployment

This guide explains how changes are checked and deployed. CI runs
automatically; AWS deployment only works after the infrastructure and GitHub
environments have been configured. See the
[Terraform deployment guide](../terraform/DEPLOYMENT.md) for setup details.

## What happens

### Continuous integration (CI)

The workflow in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs
on pushes to `main` and `devops`, and on pull requests targeting `main`. It:

1. Installs backend dependencies and runs backend tests.
2. Installs frontend dependencies, runs ESLint, and builds the frontend.
3. Builds production Docker images, starts a temporary test stack, checks
   service health, then removes the test containers.

Wait for CI to pass before merging or deploying.

### Deployment

The workflow in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
deploys a successful CI commit on `main` to **development**. To deploy
manually, run **Actions → Deploy → Run workflow** on the `main` branch and
select `development` or `production`. Production may require reviewer
approval configured in GitHub.

For the selected environment, GitHub Actions uses OIDC to access AWS, pushes
the frontend and backend images to ECR, and sends a command through SSM to the
environment's EC2 instance. It checks the environment tag and deploys
images pinned to their ECR digests. The instance must be online and managed
by SSM.

## What must be configured

Before enabling deployment, the project owner must set up Terraform, ECR,
the EC2 instance, the Secrets Manager secret value, and the GitHub Actions
environments. Required environment-scoped GitHub variables include:

`AWS_REGION`, `AWS_ROLE_ARN`, `ECR_REGISTRY`, `EC2_INSTANCE_ID`,
`EC2_ENVIRONMENT_TAG`, `SECRET_NAME`, `ECR_BACKEND_REPOSITORY`,
`ECR_FRONTEND_REPOSITORY`, and `CADDY_DOMAIN`.

The workflow also requires `DATABASE_ROLLBACK_SAFE=true`. Set it only after
the release's database changes have been reviewed as backward-compatible.
Optional Google client and Maps settings are used at frontend build time and
become public in the browser; never put private credentials there.

## After a run

Check the workflow run in GitHub Actions. A successful deployment checks
backend readiness, frontend/container health, and HTTP; production also
checks HTTPS. Confirm the site and important features work, since a healthy
container alone does not validate every integration.

If a deployment fails, read the workflow and SSM output and ask the deployment
owner for help. The host script attempts to restore the previous release only
when database rollback safety is confirmed and the previous images are
available. Do not retry repeatedly or bypass approval to resolve a failure.

For AWS variables, secret handling, rollback limitations, and recovery
procedures, see the
[full Terraform deployment documentation](../terraform/DEPLOYMENT.md).