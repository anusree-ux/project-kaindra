variable "project_name" {
  description = "Project name used for resource names and tags."
  type        = string
}

variable "environment" {
  description = "Environment name, such as dev or prod."
  type        = string
}

variable "ami_id" {
  description = "AMI ID to use for the EC2 instance."
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID where the EC2 instance will be created."
  type        = string
}

variable "security_group_ids" {
  description = "Security groups to attach to the EC2 instance."
  type        = list(string)
}

variable "instance_profile_name" {
  description = "IAM instance profile attached to the EC2 instance."
  type        = string
}

variable "root_volume_size" {
  description = "Encrypted root volume size in GiB."
  type        = number

  validation {
    condition     = var.root_volume_size >= 20
    error_message = "root_volume_size must be at least 20 GiB."
  }
}

variable "associate_public_ip_address" {
  description = "Whether the instance should receive a public IPv4 address."
  type        = bool
  default     = true
}

variable "user_data" {
  description = "Cloud-init/user-data script for the EC2 instance."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags to apply to the EC2 instance."
  type        = map(string)
  default     = {}
}