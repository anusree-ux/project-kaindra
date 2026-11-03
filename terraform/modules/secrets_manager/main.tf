locals {
  name = "${var.project_name}-${var.environment}"

  tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  })
}

resource "aws_secretsmanager_secret" "backend_env" {
  name                    = "${local.name}/backend-env"
  description             = "Backend environment variables for ${local.name}."
  recovery_window_in_days = 7

  tags = local.tags
}