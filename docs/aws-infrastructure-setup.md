# AWS Infrastructure Setup

This project uses Terraform to describe its AWS infrastructure. AWS resources
can incur costs and affect a live service, so only proceed with approval from
the person responsible for the AWS account. This is a short orientation guide;
the detailed, authoritative procedure is in the
[Terraform operations guide](../terraform/README.md).

## What Terraform sets up

The `terraform/dev` and `terraform/prod` configurations create a VPC and
public subnet, network rules, an EC2 server with an Elastic IP, IAM roles,
ECR repositories for the application images, and GitHub Actions OIDC access.
They also create a Secrets Manager secret **container**, but do not add its
value.

Terraform does not set up MongoDB, DNS, application secret values, backups, or
monitoring. These need to be arranged separately before a production service
can operate safely.

## Before you begin

Ask the infrastructure owner to confirm:

- The AWS account, region, access role, and whether this is dev or prod.
- The approved network ranges, server size, ingress access, and budget.
- The organization-approved S3 bucket for Terraform state. The bucket must
  already exist; Terraform does not create it.
- Which Terraform root in the AWS account owns creation of the GitHub OIDC
  provider.

You also need Terraform 1.10 or later and AWS CLI credentials for the approved
account. Never put AWS access keys or application secrets in Terraform files.

## Plan changes safely

Each environment has its own Terraform root and remote state. Use only its
matching backend configuration. For development, from the project root:

```powershell
Set-Location terraform/dev
Copy-Item backend.hcl.example backend.hcl
Copy-Item terraform.tfvars.example terraform.tfvars
```

Ask the owner for the correct S3 bucket and bucket region, then update
`backend.hcl`. Update `terraform.tfvars` only with approved values. Production
has no example variables file; its required values must come from the owner.

Initialize and inspect the proposed changes:

```powershell
terraform init -backend-config=backend.hcl
terraform validate
terraform plan -out=review.tfplan
terraform show review.tfplan
```

Have an authorized reviewer confirm the account, environment, state, network
access, costs, and every planned change. Apply only the reviewed plan, with
explicit approval:

```powershell
terraform apply review.tfplan
```

If Terraform reports a state migration, unexpected empty state, or surprising
resource deletion/replacement, stop and ask the infrastructure owner. Do not
run `terraform destroy` as a cleanup step.

After provisioning, GitHub Actions and the application still need separate
deployment configuration. See the [deployment guide](../terraform/DEPLOYMENT.md)
for the complete setup and required GitHub environment values.