output "repository_urls" {
  description = "Map of repository names to ECR repository URLs."
  value = {
    for name, repository in aws_ecr_repository.this :
    name => repository.repository_url
  }
}

output "repository_arns" {
  description = "Map of repository names to ECR repository ARNs."
  value = {
    for name, repository in aws_ecr_repository.this :
    name => repository.arn
  }
}