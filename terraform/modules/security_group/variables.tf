variable "project_name" {
  description = "Project name used for resource names and tags."
  type        = string
}

variable "environment" {
  description = "Environment name, such as dev or prod."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the security group will be created."
  type        = string
}

variable "http_ingress_cidrs" {
  description = "CIDR blocks allowed to access HTTP port 80."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to the security group."
  type        = map(string)
  default     = {}
}

variable "https_ingress_cidrs" {
  description = "CIDR blocks allowed to access HTTPS port 443."
  type        = list(string)
  default     = []
}