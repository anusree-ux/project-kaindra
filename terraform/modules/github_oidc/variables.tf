variable "project_name" {
  description = "Project name used for IAM resource names."
  type        = string
}

variable "environment" {
  description = "Environment name, such as dev or prod."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in owner/repository format."
  type        = string
}

variable "aws_region" {
  description = "AWS region containing the deployment target."
  type        = string
}

variable "github_branch" {
  description = "GitHub branch allowed to assume the deployment role."
  type        = string
  default     = "main"
}

variable "github_environment" {
  description = "GitHub Environment allowed to assume the deployment role. When set, configure that environment to allow only github_branch."
  type        = string
  default     = ""
}

variable "create_oidc_provider" {
  description = "Whether this configuration creates the account's GitHub OIDC provider."
  type        = bool
  default     = true
}

variable "ecr_repository_arns" {
  description = "ECR repository ARNs that GitHub Actions may push to."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to IAM resources."
  type        = map(string)
  default     = {}
}

variable "ec2_instance_arn" {
  description = "ARN of the EC2 instance that GitHub Actions may deploy to through SSM."
  type        = string
}