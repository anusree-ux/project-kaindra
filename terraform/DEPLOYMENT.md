# Provisioning and application deployment

This guide describes the checked-in Terraform and GitHub Actions workflow.
It does not authorize an infrastructure change or deployment. Use the
organization's change review and access policies, and do not proceed while
the deployment blockers below remain unresolved.

## 1. Prepare AWS access and remote state

1. Confirm the AWS account, region, environment owner, CIDR plan, cost center,
   and operator role with the project owner. Use the AWS CLI credential
   chain/role rather than embedding access keys in Terraform.
2. The Terraform operator role needs the approved permissions to read
   availability-zone and Ubuntu AMI SSM parameter data and manage the
   configured EC2/VPC/networking/Elastic IP, security-group, IAM role and
   instance-profile, OIDC provider/role, ECR repository, and Secrets Manager
   metadata resources. EC2 instance-profile association also requires the
   appropriate `iam:PassRole` authorization. This is a permission scope
   checklist, not a ready-made policy; derive and review the exact actions
   against the organization's guardrails and the Terraform plan.
3. Create or request an organization-approved S3 state bucket outside these
   Terraform roots. Terraform does not provision its own backend bucket.
4. Before use, enable S3 versioning and default encryption, enable all S3
   Block Public Access settings, require TLS, and audit bucket access. Scope
   state operator permissions to that environment's object prefix and lock
   file. See [State and security](./STATE-AND-SECURITY.md).
5. Copy the corresponding `backend.hcl.example` to the ignored local name
   `backend.hcl` and replace only its placeholders with the approved bucket
   and bucket region. The state keys in the examples are different for dev
   and prod.

The backend configuration uses S3 native lock files through
`use_lockfile = true`; it does not use a DynamoDB locking table.

## 2. Initialize and plan Terraform

Run each command from the corresponding root directory. Do not initialize
prod with the dev backend config or use the same state key for both.

Development:

```sh
cd terraform/dev
cp backend.hcl.example backend.hcl
# Edit backend.hcl with the approved state bucket and region.
cp terraform.tfvars.example terraform.tfvars
# Review and replace the example ingress CIDRs before planning.
terraform init -backend-config=backend.hcl
terraform validate
terraform plan -out=review.tfplan
terraform show review.tfplan
```

The development variable example currently opens ports 80 and 443 to
`0.0.0.0/0`; replace those values with approved CIDRs. Do not apply that
example without review.

Production:

```sh
cd terraform/prod
cp backend.hcl.example backend.hcl
# Edit backend.hcl with the approved state bucket and region.
# Create a private, ignored terraform.tfvars using owner-approved values.
terraform init -backend-config=backend.hcl
terraform validate
terraform plan -var-file=terraform.tfvars -out=review.tfplan
terraform show review.tfplan
```

Production requires values for `aws_region`, `instance_type`,
`root_volume_size`, `vpc_cidr`, `public_subnet_cidr`, `http_ingress_cidrs`,
and `https_ingress_cidrs`. Do not guess or copy the development CIDRs or
sizing. `create_github_oidc_provider` defaults to false in production; only
set it true if this account does not already have a provider and ownership
has been approved.

`backend.hcl`, `terraform.tfvars`, plans and state are local sensitive or
environment-specific artifacts. Keep them out of source control and follow
the team's encrypted workstation/storage policy.

## 3. Review and apply a plan

Before any apply, an authorized infrastructure reviewer must inspect the
complete `terraform show review.tfplan` output and confirm:

- The selected AWS account, region, environment root, state bucket and key.
- Network CIDRs, public access, instance sizing and estimated costs.
- No unexpected resource replacement, deletion, state migration, OIDC
  provider ownership change, or access-policy broadening.
- The production inputs, ingress allowlists and GitHub OIDC environment.
- An approved backup and recovery path for resources/state being changed.

After required approvals, apply only that saved plan:

```sh
terraform apply review.tfplan
```

If Terraform says the plan is stale, discard it and create/review a new plan.
Do not run `terraform apply` without a reviewed plan. `terraform destroy` can
remove infrastructure and is not a routine cleanup command; it requires a
separate impact review, data/repository retention check, state backup and
explicit owner approval.

Do not automatically migrate existing local state. If initialization
proposes migration or the remote state is unexpectedly empty, stop and follow
the state migration procedure in [State and security](./STATE-AND-SECURITY.md).
Never delete or overwrite a state file to get past an initialization error.

## 4. Collect outputs and configure GitHub Environments

After infrastructure is deliberately provisioned and its state verified,
inspect outputs from that root:

```sh
terraform output
```

Populate **environment-scoped GitHub Actions variables** in GitHub repository
settings for both `development` and `production` as appropriate:

| Variable | Source / purpose |
|---|---|
| `AWS_REGION` | AWS region for ECR/SSM and the environment |
| `AWS_ROLE_ARN` | Root output `github_actions_role_arn` |
| `ECR_REGISTRY` | Root output `ecr_registry` |
| `EC2_INSTANCE_ID` | Root output `instance_id` |
| `EC2_ENVIRONMENT_TAG` | Must exactly equal the selected environment name and the EC2 `Environment` tag |
| `SECRET_NAME` | Root output `backend_secret_name` |
| `ECR_BACKEND_REPOSITORY` | Root output `backend_ecr_repository` |
| `ECR_FRONTEND_REPOSITORY` | Root output `frontend_ecr_repository` |
| `CADDY_DOMAIN` | Owner-approved hostname to serve; no production domain is defined here |
| `DATABASE_ROLLBACK_SAFE` | Set to the exact string `true` only after confirming backward-compatible database changes |
| `VITE_GOOGLE_CLIENT_ID` | Frontend build-time public client configuration, if required |
| `GOOGLE_MAPS_API_KEY` | Frontend build-time public browser API key, if required |

Use the respective GitHub Environment, not a shared repository-wide target,
to keep dev and production configuration separate. The workflow currently
references the two frontend build settings directly as `vars.*`.

Configure GitHub Environment `production` with required reviewers and branch
restrictions that allow only `main`. Restrict `development` to the intended
branch as well. The workflow dispatch is restricted to `main`; automatic
deployment occurs only after successful CI on `main` and selects development.
Production is an explicit manual selection.

### Required readiness corrections

The following inconsistencies are present in the checked-in configuration.
They must be corrected and reviewed before a deployment can succeed; this
documentation does not modify infrastructure or IAM:

1. `EC2_ENVIRONMENT_TAG` must equal `DEPLOYMENT_ENVIRONMENT` (`development`
   or `production`) and the actual EC2 `Environment` tag. The Terraform roots
   currently pass `dev`/`prod` into the EC2 module, so the resulting tag is
   `dev`/`prod`. The strict workflow check therefore rejects these values.
   Align the Terraform tag convention and GitHub variables in a reviewed
   infrastructure change; do not bypass the identity check.
2. The workflow calls `aws ec2 describe-tags`, but the current
   `github_oidc` role policy does not grant `ec2:DescribeTags`. Grant only
   the necessary permission through a reviewed IAM change. Without it, the
   identity step fails closed.
3. Confirm the existing deployment host is provisioned with the required
   Docker, Compose, AWS CLI and SSM connectivity. Terraform user data installs
   these packages but does not deploy the application or verify readiness.

## 5. Populate the application secret

Terraform creates a Secrets Manager secret name, not a secret value. Have
the secret owner create a protected file containing backend environment
variables, including the correct `DATABASE_URL`, and required integration
settings. Use a protected workstation and restrict file access; never put
the value directly in a shell command, GitHub variables, Terraform input,
or a commit.

The repository's example environment variable names are in
[`.env.example`](../.env.example). On an approved AWS CLI workstation, use
the secret name and region from the environment outputs/configuration:

```sh
aws secretsmanager put-secret-value \
  --region APPROVED_REGION \
  --secret-id SECRET_NAME_FROM_OUTPUT \
  --secret-string file://PATH_TO_PROTECTED_ENV_FILE
```

Use the same controlled procedure for rotation and subsequent versions.
Restrict `PutSecretValue` to secret administrators. The EC2 role is intended
to have `GetSecretValue` only for its environment secret. Terraform state
does not contain the secret value because the secret version is not managed
by Terraform.

### Application environment inventory

The backend's production startup validator requires the following values when
`NODE_ENV=production`; the JWT secrets must be distinct and non-placeholder:

| Required by production startup | Used for |
|---|---|
| `DATABASE_URL` | External MongoDB connection |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Access and refresh token signing |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payments and webhook verification |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media upload/storage |

Other environment names referenced in the backend or its example files
include `PORT`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`,
`GOOGLE_MAPS_API_KEY`, `OPENWEATHER_API_KEY`, `MSG91_AUTH_KEY`,
`MSG91_SOS_TEMPLATE_ID`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`,
`AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`,
`AGORA_TOKEN_EXPIRATION_SECONDS`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`, `CLOUDINARY_REVIEWS_FOLDER`,
`CLOUDINARY_PRODUCTS_FOLDER`, and `STALE_ORDER_EXPIRY_MINUTES`. Configure
only integrations required for the release. `AWS_REGION` may be needed by
AWS SDK clients; use the EC2 role for AWS credentials, not static
`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` values from an example file.

Frontend example/build configuration includes `VITE_GOOGLE_CLIENT_ID`,
`VITE_GOOGLE_MAPS_API_KEY`, and `VITE_MOTOTRIBE_API_URL`; the Vite dev proxy
uses `VITE_API_PROXY_TARGET`. Vite variables are public once compiled into
browser assets. The checked-in frontend example also names
`VITE_API_BASE_URL`, while the current MotoTribe API client reads
`VITE_MOTOTRIBE_API_URL`; verify the correct value for each frontend feature.
The deployment workflow passes the Google Maps build argument, but do not
assume it is consumed by every client bundle. The root, backend and frontend
example files differ, so review their consumers instead of treating any one
example as a complete authoritative manifest.

## 6. Application deployment workflow

The workflow is `.github/workflows/deploy.yml`; the host-side deployment
implementation is `docker/deploy.sh`.

1. CI (`.github/workflows/ci.yml`) runs backend tests, frontend lint/build,
   builds production images, starts a temporary Compose test stack, checks
   health and smoke endpoints, then tears down that CI-only stack.
2. Successful completion on `main` starts the deployment workflow for
   development. `workflow_dispatch` from `main` requires selecting
   development or production. Production requires GitHub Environment
   approval if configured.
3. The workflow uses the tested commit SHA for checkout, build tags and the
   host deployment script. It checks for stale commits before builds and
   again before SSM dispatch.
4. The workflow assumes the environment OIDC role. It builds/pushes backend
   and frontend images to the environment ECR repositories using the SHA
   tag. ECR tags are configured immutable. The workflow resolves each image
   tag to `repository@sha256:...` and passes those digest-pinned references
   to SSM.
5. Before deployment, it checks that the actual EC2 `Environment` tag matches
   both `EC2_ENVIRONMENT_TAG` and the selected deployment environment.
6. SSM downloads `docker/deploy.sh` at the deployment SHA to a unique file
   under `/tmp`. An exit cleanup removes it. `flock` on
   `/var/lock/kaindra-deploy.lock` serializes host deployments; a competing
   attempt fails rather than replacing an in-progress deployment.
7. The script snapshots prior Compose, Caddy, env and last-good release
   configuration in a private `.rollback.*` directory, retrieves the
   secret, validates Compose, pulls images and recreates the containers.
   The workflow polls the SSM command; timeout is failure, not success.
8. The host checks backend `/ready` (including MongoDB connectivity),
   backend/frontend container health, Caddy state and local HTTP. Production
   also requires a successful HTTPS response with a valid/trusted certificate.
   The release is recorded only after the required checks pass.

The deployment Compose services are backend, frontend and Caddy. Caddy
routes API and Socket.IO paths to the backend and other requests to the
frontend. The AWS Compose stack does not include MongoDB; database hosting,
network access, credentials and backups are external responsibilities.

The separate `docker/docker-compose.prod.yml` is an image-based local Compose
configuration that uses Nginx and `.env.production`. It is not the EC2
deployment Compose file, which uses Caddy and retrieves its environment file
from Secrets Manager.

## 7. Rollback and failure handling

The host records backend/frontend digest references and Caddy hostname in
`/opt/kaindra/.last-good-images`. On failure after startup, the script restores
previous configuration and attempts to run the previous digests, then
verifies actual container image IDs and health. Database schema changes are
not automatically reversed. The exact `DATABASE_ROLLBACK_SAFE=true`
attestation is required before deployment; only backward-compatible
migrations are acceptable for this automatic image rollback strategy.

If there is no previous release, the script stops newly created application
containers and preserves Docker volumes. If previous images are missing,
Compose recovery fails, or health checks fail, it stops potentially unhealthy
containers and retains the private recovery backup for manual investigation.
Do not delete a retained backup until recovery is confirmed.

ECR lifecycle policy retains only the ten most recent images. Older digests
can become unavailable for rollback when expired; archive/retention policy
must be considered by the release owner. The workflow and script do not
perform destructive database rollback or Docker volume deletion.

## 8. Pre- and post-deployment checklist

### Before deployment

- [ ] Correct environment selected; GitHub Environment variables are
      environment-scoped and independently verified.
- [ ] Production reviewers and branch restrictions are enabled.
- [ ] EC2 `Environment` tag equals `development` or `production` as selected.
- [ ] The workflow role can perform the required identity check and the
      minimal SSM/ECR operations.
- [ ] CI passed for the exact commit; it remains the latest `main` commit.
- [ ] ECR repositories contain/allow immutable SHA tags; digest resolution
      succeeded.
- [ ] `DATABASE_ROLLBACK_SAFE=true` is justified by migration review.
- [ ] Secrets Manager version and external database availability are
      confirmed without printing values.
- [ ] For production: DNS points to the environment Elastic IP; ingress
      allows required HTTP/HTTPS; approved hostname and HTTPS certificate are
      ready.
- [ ] A database recovery/backup plan exists and an operator is available.

### After deployment

- [ ] GitHub Actions reports SSM success, not timeout or stale skip.
- [ ] Deployment summary identifies environment, commit and image tag.
- [ ] Host output reports the expected backend readiness, frontend health,
      Caddy, HTTP and (production) HTTPS status.
- [ ] Production hostname responds successfully with valid HTTPS.
- [ ] Review application-level smoke tests, error rate and external
      integrations; container health alone does not validate every feature.
- [ ] Confirm last-good release record exists on the host and preserve
      operational diagnostics as required by policy.
- [ ] Check database/service monitoring and backup jobs independently.

For safe diagnostics and recovery guidance, see
[Troubleshooting](./TROUBLESHOOTING.md).
