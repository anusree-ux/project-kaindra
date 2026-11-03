# Terraform state, secrets and security

## Terraform state and plans

Terraform state maps configuration to real AWS resources and may contain
resource attributes that should not be public. Plans can also contain
infrastructure details and proposed changes. Treat both as sensitive
operational data, even when no application secret is intentionally managed by
Terraform.

The roots configure an S3 backend with native lock files:

| Environment | Backend key |
|---|---|
| Development | `kaindra/dev/terraform.tfstate` |
| Production | `kaindra/prod/terraform.tfstate` |

The bucket is not created by this Terraform project. Before using it:

- Enable S3 versioning and server-side encryption (organization-approved
  SSE-S3 or SSE-KMS).
- Enable all S3 Block Public Access settings and enforce TLS-only access.
- Grant state access only to authorized Terraform operator/automation roles.
- Scope `s3:ListBucket` to the environment prefix and object operations to
  that environment's state and `.tflock` objects.
- Audit access, maintain version history, and define recovery ownership.
- If using SSE-KMS, separately scope the required KMS permissions to the
  approved key.

S3 lock files are enabled through `use_lockfile = true`; a DynamoDB locking
table is not used. Do not remove a lock file to bypass a live lock. Confirm
that no Terraform operation is active and follow the team's lock-recovery
procedure.

### State initialization or migration

The config contains an S3 backend block, and existing workstations may have
local or previously initialized state artifacts. Never infer state ownership
from the presence of files. Before changing backend configuration:

1. Stop concurrent Terraform changes for the environment.
2. Record the current backend/key and identify the authoritative state with
   the owner.
3. Make and verify a protected state backup, including the relevant remote
   object version where applicable.
4. Confirm the destination key and that it is not owned by another root.
5. Plan a controlled migration/import and verify the resulting state and
   resource mapping with an authorized reviewer.

Do not answer yes to an unexpected migration prompt. `terraform init
-reconfigure -backend-config=backend.hcl` changes backend configuration
without copying state; it can leave an empty destination state. Do not plan
or apply against an empty state if resources already exist. Do not run
`terraform init -migrate-state` until the migration is explicitly approved
and backed up. Never delete or overwrite state to resolve an error.

### Backups and recovery

S3 versioning provides recoverable object versions only if enabled and
protected. State recovery must be coordinated with Terraform operators:

- Freeze applies and confirm the exact environment and state key.
- Identify the correct known-good object version from the approved change
  window and audit trail.
- Preserve the current object version before any restoration.
- Restore only after owner approval, then run `terraform state list`,
  `terraform plan` and review for unexpected create/delete/replace actions.
- Reconcile configuration and state deliberately; do not make an apply
  decision from an old state backup alone.

For local sensitive files, use encrypted storage and an access-controlled
backup location. Never check local state, backend configuration, tfvars,
plans, crash logs, or backups into Git.

## Application secrets

Terraform manages a Secrets Manager secret resource/name, but not a secret
version or value. Initial creation and rotation use the approved secret
management process; the deployment guide documents the file-based AWS CLI
input method. Restrict `PutSecretValue` to secret administrators and
`GetSecretValue` to the EC2 role for only that environment's secret.

The EC2 deployment retrieves the current secret value and writes the
application env file under `/opt/kaindra` with mode 0600, using a private
temporary file. Recovery backups are created under a private directory
because the saved configuration includes `.env`. Protect the host, backups,
and SSM access as secret-bearing systems.

Do not:

- Put actual values in Terraform configuration, `.tfvars`, GitHub variables,
  this documentation, issue comments or shell command arguments.
- Add `aws_secretsmanager_secret_version` values to Terraform without
  accepting that state and plans will contain the value.
- Print `.env`, `docker inspect` environment blocks, secret CLI responses,
  or unrestricted application logs into GitHub Actions.
- Store AWS long-lived access keys in the application env file. The EC2
  instance profile is intended to provide AWS SDK/CLI credentials.

The repository `.env.example` contains placeholders for keys including JWT,
database, Cloudinary, Razorpay, weather, SNS and web-push configuration.
Only configure integrations required by the deployed application. Rotate
values after suspected exposure and validate dependent integrations after
rotation.

## IAM boundaries in the checked-in configuration

### EC2 instance role

The role is attached through an instance profile and includes:

- `AmazonSSMManagedInstanceCore` for Systems Manager managed-instance
  operation.
- ECR authorization-token permission plus image download permissions scoped
  to the configured backend/frontend repository ARNs.
- `secretsmanager:GetSecretValue` scoped to the environment secret ARN.

The ECR authorization token action requires `Resource: "*"`. Keep repository
image actions resource-scoped. The application should use the EC2 role rather
than long-lived access keys.

### GitHub Actions OIDC role

The OIDC trust is restricted to the repository and selected GitHub
Environment subject with the expected STS audience. The role policy includes
ECR push/describe actions scoped to repository ARNs where supported and
`ssm:SendCommand` constrained to the target instance and
`AWS-RunShellScript` document. `ssm:GetCommandInvocation` uses `Resource:
"*"` because that action does not support resource-level authorization.

The policy includes `ec2:DescribeTags` for the environment identity check.
AWS does not support resource-level authorization for this listing action,
so its statement uses `Resource: "*"` and limits the request to the configured
AWS region with `aws:RequestedRegion`. This remains broader than a
single-instance resource policy for tag visibility within that region; keep
the role trust restricted to the repository and GitHub Environment, and do
not add unrelated EC2 permissions.

### Resource and environment controls

- The security group restricts inbound HTTP/HTTPS to configured CIDR lists.
  The Terraform development example defaults to no ingress; add only
  owner-approved CIDRs in a private variable file.
- EC2 requires IMDSv2 and uses an encrypted gp3 root volume.
- ECR repositories are encrypted, scan on push and enforce immutable tags.
  Terraform configures no lifecycle expiration policy, preventing
  Terraform-managed automatic expiry of rollback images at the cost of
  accumulating storage. Existing repositories may retain an already-applied
  policy until an approved Terraform apply changes it.
- GitHub Actions has `id-token: write` and `contents: read`; production
  approval/branch restrictions must be configured on the GitHub Environment.
- The EC2 `Environment` tags use `development`/`production`, matching the
  workflow identity check. Other resource naming/tagging may still use the
  short `dev`/`prod` names.
- GitHub environment-level variables must not be shared across dev and prod
  if they refer to different targets.
- Both Terraform roots require an explicit OIDC provider ownership choice.
  Designate exactly one provider-creating root per AWS account; set other
  roots in that account to look up the existing provider.

## Operational monitoring and data safety

The repository provides container health checks and deployment-time
readiness checks, but does not implement a monitoring/alerting service,
database backup scheduler, managed database, automated database restore, or
tested disaster recovery. Assign owners and define these controls before
production operation.

The AWS Compose deployment uses externally hosted/configured MongoDB via
`DATABASE_URL`; the local MongoDB named volume is not a production backup.
The deployment rollback restores application images/configuration only and
does not undo database migrations. Backward-compatible migrations and a
separate database recovery plan are required.

Before production operation, the owner must decide who provides and monitors
database backups, retention, restore testing and recovery objectives; how
database network access and credentials are operated; and what host/service
availability, monitoring, alerting and incident-response objectives apply.
The current single-EC2 design has no configured high-availability or
automated backup resources. These are explicit readiness blockers, not
features supplied by this Terraform.
