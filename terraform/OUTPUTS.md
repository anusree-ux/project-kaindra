# Terraform outputs

Outputs are obtained from the selected root's state. They can identify
deployment targets and populate environment-scoped GitHub variables. Output
values such as IP addresses and role ARNs are not passwords, but should still
be shared only with authorized operators.

Run from the environment root after state has been initialized and populated:

```sh
terraform output
terraform output -raw instance_id
```

`terraform output -raw` prints the requested value to the terminal. Do not
capture outputs in public logs or commit them into workflow files.

## Development root outputs

| Output | Purpose |
|---|---|
| `instance_id` | EC2 target ID; used for `EC2_INSTANCE_ID` in the development GitHub Environment and SSM target. |
| `elastic_ip` | Stable public IPv4 address associated with the development EC2 instance; use when configuring approved DNS. |
| `development_url` | Convenience HTTP URL built from `elastic_ip`; it is not an HTTPS hostname. |
| `ssm_start_session_command` | Suggested AWS CLI Session Manager command for authorized host access. |
| `github_actions_role_arn` | OIDC role ARN for `AWS_ROLE_ARN`. |
| `ecr_registry` | Registry host for `ECR_REGISTRY`. |
| `backend_ecr_repository` | Backend repository name for `ECR_BACKEND_REPOSITORY`. |
| `frontend_ecr_repository` | Frontend repository name for `ECR_FRONTEND_REPOSITORY`. |
| `backend_secret_name` | Secrets Manager secret name for `SECRET_NAME`; the output is metadata only, not the secret value. |

## Production root outputs

| Output | Purpose |
|---|---|
| `instance_id` | EC2 target ID for `EC2_INSTANCE_ID`. |
| `elastic_ip` | Stable public IPv4 address for approved production DNS configuration. |
| `ssm_start_session_command` | Suggested Session Manager command for authorized host access. |
| `github_actions_role_arn` | OIDC role ARN for `AWS_ROLE_ARN`. |
| `ecr_registry` | Registry host for `ECR_REGISTRY`. |
| `backend_ecr_repository` | Backend repository name for `ECR_BACKEND_REPOSITORY`. |
| `frontend_ecr_repository` | Frontend repository name for `ECR_FRONTEND_REPOSITORY`. |
| `backend_secret_name` | Secrets Manager metadata name for `SECRET_NAME`; not a secret value. |

The production root does not currently export a `production_url`; the owner
must choose and configure the production domain and DNS separately.

## Module outputs

Most module outputs are consumed by the root and are not directly exposed as
root outputs.

| Module | Outputs |
|---|---|
| `network` | `vpc_id`, `public_subnet_id`, `public_subnet_cidr` |
| `security_group` | `security_group_id`, `security_group_name` |
| `ec2` | `instance_id`, `public_ip`, `private_ip`, `instance_arn`, `elastic_ip` |
| `ecr` | `repository_urls` (map keyed by configured repository names), `repository_arns` (same keys) |
| `iam` | `role_name`, `role_arn`, `instance_profile_name` |
| `secrets_manager` | `backend_env_secret_name`, `backend_env_secret_arn` |
| `github_oidc` | `role_name`, `role_arn`, `oidc_provider_arn` |

Do not treat an output as proof that the corresponding service is healthy,
reachable, backed up, or properly configured. Validate DNS, IAM, secrets,
database connectivity and application health independently.
