variable "aws_region" {
  description = "AWS region for the development server."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Short name used to tag and name development resources."
  type        = string
  default     = "kaindra"
}

variable "instance_type" {
  description = "EC2 instance type. t3.small is a modest starting point for development."
  type        = string
  default     = "t3.small"
}

variable "root_volume_size" {
  description = "Encrypted root volume size in GiB."
  type        = number
  default     = 30

  validation {
    condition     = var.root_volume_size >= 20
    error_message = "root_volume_size must be at least 20 GiB."
  }
}

variable "http_ingress_cidrs" {
  description = "IPv4 CIDR blocks allowed to access the development website over HTTP. Empty disables public web access."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to resources."
  type        = map(string)
  default     = {}
}

variable "https_ingress_cidrs" {
  description = "IPv4 CIDR blocks allowed to access the development website over HTTPS."
  type        = list(string)
  default     = []
}

variable "create_github_oidc_provider" {
  description = "Whether this configuration owns creation of the account's GitHub OIDC provider. Coordinate with other environment roots in the same AWS account."
  type        = bool
}