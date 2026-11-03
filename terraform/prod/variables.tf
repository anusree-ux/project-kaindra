variable "aws_region" {
  description = "AWS region for the production server."
  type        = string
}

variable "project_name" {
  description = "Short name used to name production resources."
  type        = string
  default     = "kaindra"
}

variable "instance_type" {
  description = "Production EC2 instance type selected by the service owner."
  type        = string
}

variable "root_volume_size" {
  description = "Encrypted root volume size in GiB selected for production."
  type        = number

  validation {
    condition     = var.root_volume_size >= 20
    error_message = "root_volume_size must be at least 20 GiB."
  }
}

variable "vpc_cidr" {
  description = "Non-overlapping VPC CIDR block approved for this AWS account."
  type        = string
}

variable "public_subnet_cidr" {
  description = "Public subnet CIDR contained within vpc_cidr."
  type        = string
}

variable "http_ingress_cidrs" {
  description = "Approved IPv4 CIDRs allowed to access HTTP."
  type        = list(string)
}

variable "https_ingress_cidrs" {
  description = "Approved IPv4 CIDRs allowed to access HTTPS."
  type        = list(string)
}

variable "create_github_oidc_provider" {
  description = "Whether this configuration owns creation of the account's GitHub OIDC provider. Coordinate with other environment roots in the same AWS account."
  type        = bool
}

variable "tags" {
  description = "Additional tags to apply to production resources."
  type        = map(string)
  default     = {}
}
