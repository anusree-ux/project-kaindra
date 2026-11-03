output "backend_env_secret_name" {
  description = "Name of the backend environment secret."
  value       = aws_secretsmanager_secret.backend_env.name
}

output "backend_env_secret_arn" {
  description = "ARN of the backend environment secret."
  value       = aws_secretsmanager_secret.backend_env.arn
}