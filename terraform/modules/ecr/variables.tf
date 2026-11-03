variable "project_name" {
  description = "Project name used for ECR repository names."
  type        = string
}

variable "environment" {
  description = "Environment name, such as dev or prod."
  type        = string
}

variable "repository_names" {
  description = "Names of the container images to store in ECR."
  type        = list(string)
}

variable "tags" {
  description = "Additional tags to apply to ECR repositories."
  type        = map(string)
  default     = {}
}