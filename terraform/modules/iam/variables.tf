variable "project_name" {
  description = "Project name used for IAM resource names."
  type        = string
}

variable "environment" {
  description = "Environment name, such as dev or prod."
  type        = string
}

variable "tags" {
  description = "Additional tags to apply to IAM resources."
  type        = map(string)
  default     = {}
}

variable "secrets_manager_secret_arns" {
  description = "Secrets Manager secret ARNs that the EC2 role may read."
  type        = list(string)
  default     = []
}

variable "ecr_repository_arns" {
  description = "ECR repository ARNs that the EC2 role may pull images from."
  type        = list(string)
  default     = []
}