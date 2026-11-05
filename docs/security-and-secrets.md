# Security and Secrets

Use this guide to handle credentials and sensitive project configuration
safely. For the AWS policy and Terraform state details, see the
[Terraform state and security guide](../terraform/STATE-AND-SECURITY.md).

## Protect credentials

- Never commit passwords, API keys, tokens, private keys, or real `.env`
  files. Keep local settings in ignored `.env` files; commit only example
  files with placeholders.
- Use test credentials for local development and request access from the
  project owner. Use separate credentials for development and production.
- Do not paste secrets into source code, Terraform variables, GitHub Actions
  variables, logs, tickets, or shell command arguments.
- Frontend variables prefixed with `VITE_` are included in browser code.
  Treat them as public; never put private credentials there.

## Production secrets

The production backend reads its configuration from AWS Secrets Manager.
Terraform creates the secret's name, but not its value. An authorized secret
owner must provide the required application settings and keep access limited.
The EC2 instance uses its IAM role to retrieve the secret; do not put long-lived
AWS access keys in the application configuration.

At production startup, the backend requires:

- `DATABASE_URL`
- Distinct, non-placeholder `JWT_SECRET` and `JWT_REFRESH_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
  `CLOUDINARY_API_SECRET`

Other integrations need credentials only when those features are enabled. See
the [environment configuration guide](./environment-configuration.md) and
the example files for variable names.

## Terraform and GitHub access

Terraform state and plan files can reveal sensitive infrastructure details.
Keep them in the approved protected S3 backend or other encrypted,
access-controlled storage; never commit state, plans, `terraform.tfvars`, or
backend configuration.

GitHub Actions uses OIDC to assume an AWS role instead of storing AWS access
keys in GitHub. Keep development and production settings in their respective
GitHub Environments, restrict deployment branches, and require production
review approval. Grant access only to people and roles that need it.

## If a secret is exposed

Treat it as compromised: tell the project owner, revoke or rotate it with
the issuing provider, update the approved secret store, and verify any
dependent service. Removing a secret from a file or Git commit does not undo
exposure; ask the repository administrator to handle any required history
cleanup.

## Shiprocket Integration — Production Handover

The Shiprocket integration is currently implemented with mock mode
for local development and automated CI testing.

### Current status

- Mock shipment creation is implemented.
- Shipment tracking and delivery webhook handling are implemented.
- Backend tests pass using mock Shiprocket configuration.
- Real Shiprocket credentials have not yet been configured.

### Required before production activation

1. Obtain valid Shiprocket API credentials.
2. Store credentials securely in AWS Secrets Manager.
3. Configure EC2 IAM permissions to retrieve the secrets.
4. Configure the production backend environment.
5. Set `SHIPROCKET_MOCK=false`.
6. Configure and verify the production webhook.
7. Perform end-to-end testing with a real shipment.

### Security notes

Do not commit API credentials or store them in source code.
Production shipment functionality requires valid Shiprocket
credentials and account access.