# Kaindra infrastructure and operations

This directory contains Terraform roots for the AWS development and
production environments, reusable AWS modules, and operator documentation.

## Start here

| Document | Purpose |
|---|---|
| [Architecture](./ARCHITECTURE.md) | Resources and their relationships |
| [Variables](./VARIABLES.md) | Root and module input variables |
| [Outputs](./OUTPUTS.md) | Root outputs and their consumers |
| [Deployment](./DEPLOYMENT.md) | State prerequisites, Terraform workflow, GitHub setup, and safe application deployment |
| [State and security](./STATE-AND-SECURITY.md) | State protection, IAM boundaries, secrets and recovery |
| [Troubleshooting](./TROUBLESHOOTING.md) | Safe diagnostics and common recovery paths |
| [Handover](./HANDOVER.md) | Practical transfer checklist and outstanding owner decisions |

## Directory layout

```text
terraform/
  dev/                  Development root configuration and safe variable example
  prod/                 Production root configuration and backend example
  modules/              Shared network, security group, EC2, IAM, ECR,
                        Secrets Manager, and GitHub OIDC modules
```

`dev/` and `prod/` are separate Terraform root modules and use distinct S3
state keys in their backend examples. Both roots require Terraform 1.10 or
later, AWS provider 5.x, TLS provider 4.x, and the AWS CLI credential chain
for the selected account and role. The production root deliberately has
required networking and sizing inputs; use only approved values, not copied
guesses from dev.

The EC2 `Environment` tags are `development` and `production`, matching the
GitHub deployment workflow. Resource naming and other module tags continue
to use the short `dev` and `prod` identifiers.

## What this Terraform currently describes

Each root composes a public VPC/subnet, internet gateway and route, security
group, one EC2 instance with an Elastic IP, IAM instance profile, ECR
repositories, a Secrets Manager secret container, and a GitHub Actions OIDC
role. EC2 user data installs Docker Compose v2 and the AWS CLI. See
[Architecture](./ARCHITECTURE.md) for relationships and limitations.

Terraform does **not** create a MongoDB service/database, DNS records,
monitoring or alerting stack, backup schedule, or S3 backend bucket. It does
not populate the application secret value. The AWS application deployment
Compose file contains backend, frontend and Caddy only. Terraform no longer
configures automatic ECR lifecycle expiration, protecting rollback images
from a Terraform-managed count-based expiry. An already-provisioned repository
may retain its existing lifecycle policy until this configuration is
deliberately applied. Owners must monitor storage growth and approve any
future retention policy that could expire releases.

Each root requires an explicit `create_github_oidc_provider` value. Exactly
one root per AWS account should own provider creation; other roots in that
account look up the existing provider. In separate accounts, each account
needs one designated owner.

## Prerequisites and safe workflow

Before initialization, the receiving team must identify the AWS account and
region, provision or approve the remote state bucket, enforce its access and
encryption controls, and grant the operator a narrowly scoped Terraform role.
Do not use the example backend until its placeholders are replaced with
approved values. See [Deployment](./DEPLOYMENT.md) and
[State and security](./STATE-AND-SECURITY.md).

For either environment, run commands from its root directory. A normal
review workflow is:

```sh
terraform init -backend-config=backend.hcl
terraform validate
terraform plan -out=review.tfplan
terraform show review.tfplan
```

These commands initialize state, validate configuration, and create/read a
plan; they do not apply infrastructure. A plan may disclose infrastructure
details and must be protected. Apply only after an authorized reviewer
approves the exact plan and the account, environment, state key, CIDRs,
instance sizing and expected changes have been confirmed:

```sh
terraform apply review.tfplan
```

Never apply an unreviewed plan, use another environment's state key, or
respond yes to an unexpected state migration prompt. `terraform destroy` is
not a routine cleanup command; it can remove the server, EIP, repositories,
secrets metadata and networking. Read the plan and follow the organization's
change approval and recovery procedure before any destructive operation.

The checked-in backend examples are:

- Dev key: `kaindra/dev/terraform.tfstate`
- Prod key: `kaindra/prod/terraform.tfstate`

Both use S3 native lock files (`use_lockfile = true`). The bucket itself is
external to these roots and must have versioning, encryption, Block Public
Access, TLS-only access, and tightly scoped IAM permissions configured before
use.
