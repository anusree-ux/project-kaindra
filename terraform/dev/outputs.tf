output "instance_id" {
  description = "EC2 instance ID."
  value       = module.ec2.instance_id
}

output "elastic_ip" {
  description = "Stable Elastic IPv4 address for the development server."
  value       = module.ec2.elastic_ip
}

output "development_url" {
  description = "HTTP URL for the development server."
  value       = "http://${module.ec2.elastic_ip}"
}

output "ssm_start_session_command" {
  description = "AWS CLI command to open a shell through Systems Manager Session Manager."
  value       = "aws ssm start-session --target ${module.ec2.instance_id} --region ${var.aws_region}"
}

output "github_actions_role_arn" {
  description = "Role ARN to configure as the GitHub Actions AWS_ROLE_ARN variable."
  value       = module.github_oidc.role_arn
}

output "ecr_registry" {
  description = "ECR registry hostname used by GitHub Actions."
  value       = split("/", module.ecr.repository_urls["backend"])[0]
}

output "backend_ecr_repository" {
  description = "Backend ECR repository name used by GitHub Actions."
  value       = split("/", module.ecr.repository_urls["backend"])[1]
}

output "frontend_ecr_repository" {
  description = "Frontend ECR repository name used by GitHub Actions."
  value       = split("/", module.ecr.repository_urls["frontend"])[1]
}

output "backend_secret_name" {
  description = "Secrets Manager secret name for backend environment variables."
  value       = module.secrets_manager.backend_env_secret_name
}