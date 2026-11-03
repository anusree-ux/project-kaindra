# Terraform input variables

This reference describes variables declared by the two root modules and the
shared modules. Defaults and required inputs below reflect the checked-in
Terraform source. Production values must be supplied by the owner; examples
are placeholders only.

## Development root: `terraform/dev`

| Variable | Type | Default | Description / guidance |
|---|---|---|---|
| `aws_region` | `string` | `"ap-south-1"` | AWS region for development resources. Confirm the selected account and region before planning. |
| `project_name` | `string` | `"kaindra"` | Resource naming and tagging prefix. |
| `instance_type` | `string` | `"t3.small"` | EC2 instance size. Confirm workload and cost suitability. |
| `root_volume_size` | `number` | `30` | Encrypted root volume size in GiB; must be at least 20. |
| `http_ingress_cidrs` | `list(string)` | `[]` | IPv4 sources allowed to reach port 80. Empty disables HTTP ingress. |
| `https_ingress_cidrs` | `list(string)` | `[]` | IPv4 sources allowed to reach port 443. Empty disables HTTPS ingress. |
| `create_github_oidc_provider` | `bool` | Required | Set true only for the one root designated to create the account's GitHub OIDC provider; other roots in that account must set false. |
| `tags` | `map(string)` | `{}` | Additional AWS resource tags. |

`dev/terraform.tfvars.example` leaves HTTP and HTTPS ingress empty. Add only
owner-approved CIDRs to a private, ignored `terraform.tfvars` file if the
development server needs web access.

## Production root: `terraform/prod`

| Variable | Type | Default | Description / guidance |
|---|---|---|---|
| `aws_region` | `string` | Required | AWS region selected by the service owner. |
| `project_name` | `string` | `"kaindra"` | Resource naming prefix. |
| `instance_type` | `string` | Required | Production EC2 sizing selected by the owner. |
| `root_volume_size` | `number` | Required | Encrypted root disk in GiB; must be at least 20. |
| `vpc_cidr` | `string` | Required | Approved, non-overlapping VPC CIDR. |
| `public_subnet_cidr` | `string` | Required | Public subnet CIDR inside `vpc_cidr`. |
| `http_ingress_cidrs` | `list(string)` | Required | Approved IPv4 sources for port 80. |
| `https_ingress_cidrs` | `list(string)` | Required | Approved IPv4 sources for port 443. |
| `create_github_oidc_provider` | `bool` | Required | Set true only for the one root designated to create the account's GitHub OIDC provider; other roots in that account must set false. |
| `tags` | `map(string)` | `{}` | Additional tags. |

No production values are committed. Create an ignored local input file only
after the owner approves every value. See [Deployment](./DEPLOYMENT.md).

## Shared module inputs

These are module interfaces. Root modules provide most of the values
directly; they are not all root variables that operators must set.

| Module | Inputs (type; default if any) |
|---|---|
| `network` | `project_name` (`string`), `environment` (`string`), `vpc_cidr` (`string`), `public_subnet_cidr` (`string`), `availability_zone` (`string`), `tags` (`map(string)`, `{}`) |
| `security_group` | `project_name` (`string`), `environment` (`string`), `vpc_id` (`string`), `http_ingress_cidrs` (`list(string)`, `[]`), `https_ingress_cidrs` (`list(string)`, `[]`), `tags` (`map(string)`, `{}`) |
| `ec2` | `project_name` (`string`), `environment` (`string`), `ami_id` (`string`), `instance_type` (`string`), `subnet_id` (`string`), `security_group_ids` (`list(string)`), `instance_profile_name` (`string`), `root_volume_size` (`number`, minimum 20), `associate_public_ip_address` (`bool`, `true`), `user_data` (`string`, `""`), `tags` (`map(string)`, `{}`) |
| `ecr` | `project_name` (`string`), `environment` (`string`), `repository_names` (`list(string)`), `tags` (`map(string)`, `{}`) |
| `iam` | `project_name` (`string`), `environment` (`string`), `secrets_manager_secret_arns` (`list(string)`, `[]`), `ecr_repository_arns` (`list(string)`, `[]`), `tags` (`map(string)`, `{}`) |
| `secrets_manager` | `project_name` (`string`), `environment` (`string`), `tags` (`map(string)`, `{}`) |
| `github_oidc` | `project_name` (`string`), `environment` (`string`), `github_repository` (`string`), `aws_region` (`string`), `github_branch` (`string`, `"main"`), `github_environment` (`string`, `""`), `create_oidc_provider` (`bool`, `true`), `ecr_repository_arns` (`list(string)`, `[]`), `ec2_instance_arn` (`string`), `tags` (`map(string)`, `{}`) |

The GitHub OIDC module uses `github_environment` for the trust subject when
non-empty; otherwise it trusts the configured branch ref. When using
environment-based trust, GitHub Environment branch restrictions and
approvals are important complementary controls.

## Example input shape

Development has a committed example file. Keep its values reviewed:

```sh
cp terraform.tfvars.example terraform.tfvars
```

Production has no committed `terraform.tfvars.example`. An operator-created
file may follow this shape, with placeholders replaced by approved values:

```hcl
aws_region        = "OWNER_APPROVED_REGION"
instance_type     = "OWNER_APPROVED_INSTANCE_TYPE"
root_volume_size  = 30
vpc_cidr          = "OWNER_APPROVED_VPC_CIDR"
public_subnet_cidr = "OWNER_APPROVED_SUBNET_CIDR"
http_ingress_cidrs  = ["OWNER_APPROVED_IPV4_CIDR"]
https_ingress_cidrs = ["OWNER_APPROVED_IPV4_CIDR"]
create_github_oidc_provider = false
```

Set `create_github_oidc_provider` according to the ownership decision for
the target AWS account (see above). Do not use the literal placeholders as
production values. Keep all `.tfvars` files private and free of secret
material. The root variables do not require application secret values.
