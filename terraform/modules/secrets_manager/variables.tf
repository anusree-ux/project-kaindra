variable "project_name" {
  description = "Project name used for the secret name."
  type        = string
}

variable "environment" {
  description = "Environment name, such as dev or prod."
  type        = string
}

variable "tags" {
  description = "Additional tags to apply to the secret."
  type        = map(string)
  default     = {}
}