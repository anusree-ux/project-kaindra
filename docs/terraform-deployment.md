# Terraform and Application Deployment

This guide explains how the AWS infrastructure and application deployment fit
together. It is an overview, not approval to change AWS resources or deploy to
production. For detailed commands and safety procedures, see the
[Terraform deployment guide](../terraform/DEPLOYMENT.md).

## How deployment works

1. Terraform provisions AWS resources for `development` or `production`.
2. GitHub Actions builds and tests the project through the CI workflow.
3. After successful CI on `main`, the Deploy workflow automatically deploys
   that commit to **development**.
4. A release to **production** is started manually from the Deploy workflow
   on `main` and requires any configured production approval.
5. GitHub Actions uses OIDC to access AWS, pushes the backend and frontend
   images to ECR, then uses Systems Manager (SSM) to deploy them to EC2.

The images are identified by commit and deployed by immutable ECR digest. The
EC2 server must be online and connected to SSM.

## Before enabling deployment

- Provision and review the matching Terraform environment.
- Configure the GitHub Actions environment named exactly `development` or
  `production`, with access limited to the intended branch. Add required
  reviewers for production.
- Add the following as **environment-scoped GitHub Actions variables** using
  the Terraform outputs and owner-approved settings:

  `AWS_REGION`, `AWS_ROLE_ARN`, `ECR_REGISTRY`, `EC2_INSTANCE_ID`,
  `EC2_ENVIRONMENT_TAG`, `SECRET_NAME`, `ECR_BACKEND_REPOSITORY`,
  `ECR_FRONTEND_REPOSITORY`, and `CADDY_DOMAIN`.

- Set `EC2_ENVIRONMENT_TAG` to exactly `development` or `production` for the
  selected environment. The workflow checks it against the actual EC2 tag.
- Set `DATABASE_ROLLBACK_SAFE` to the exact string `true` only after confirming
  database changes are backward-compatible.
- If needed, add `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_MAPS_API_KEY` as
  environment variables. These are build-time frontend settings, so they are
  included in the public frontend bundle; never put private secrets there.
- Have the secret owner populate the environment's AWS Secrets Manager secret
  with the backend configuration, including a working `DATABASE_URL`.
  Terraform creates the secret name, not its value.
- Confirm production database ownership, backups and restore testing,
  monitoring, and recovery responsibilities before treating production as
  ready.

## Starting a deployment

For development, merge the intended change to `main` and wait for CI to pass;
the deployment workflow starts automatically. To deploy manually, open
**Actions → Deploy → Run workflow**, select the `main` branch, and choose
`development` or `production`. Production may wait for an environment
reviewer's approval.

Follow the run in GitHub Actions. A failed CI or deployment run must be
investigated before retrying. Do not start a second deployment to work around
an error or bypass an environment approval.

For Terraform state, plan review, AWS setup, secret handling, and recovery
instructions, use the full
[Terraform deployment documentation](../terraform/DEPLOYMENT.md) and
[state and security guide](../terraform/STATE-AND-SECURITY.md).