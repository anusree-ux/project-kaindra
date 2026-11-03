data "aws_ssm_parameter" "ubuntu_ami" {
  name = "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id"
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "network" {
  source = "../modules/network"

  project_name       = var.project_name
  environment        = "dev"
  vpc_cidr           = "10.42.0.0/16"
  public_subnet_cidr = "10.42.1.0/24"
  availability_zone  = data.aws_availability_zones.available.names[0]

  tags = var.tags
}

module "security_group" {
  source = "../modules/security_group"

  project_name = var.project_name
  environment  = "dev"

  vpc_id = module.network.vpc_id

  http_ingress_cidrs  = var.http_ingress_cidrs
  https_ingress_cidrs = var.https_ingress_cidrs

  tags = var.tags
}

module "iam" {
  source = "../modules/iam"

  project_name = var.project_name
  environment  = "dev"

  secrets_manager_secret_arns = [
    module.secrets_manager.backend_env_secret_arn
  ]

  ecr_repository_arns = [
    module.ecr.repository_arns["backend"],
    module.ecr.repository_arns["frontend"],
  ]

  tags = var.tags
}

module "ecr" {
  source = "../modules/ecr"

  project_name = var.project_name
  environment  = "dev"

  repository_names = [
    "backend",
    "frontend",
  ]

  tags = var.tags
}

module "secrets_manager" {
  source = "../modules/secrets_manager"

  project_name = var.project_name
  environment  = "dev"

  tags = var.tags
}

module "github_oidc" {
  source = "../modules/github_oidc"

  project_name = var.project_name
  environment  = "dev"

  aws_region           = var.aws_region
  github_repository    = "anusree-ux/project-kaindra"
  github_branch        = "main"
  github_environment   = "development"
  create_oidc_provider = var.create_github_oidc_provider

  ec2_instance_arn = module.ec2.instance_arn

  ecr_repository_arns = [
    module.ecr.repository_arns["backend"],
    module.ecr.repository_arns["frontend"],
  ]

  tags = var.tags
}

module "ec2" {
  source = "../modules/ec2"

  project_name = var.project_name
  environment  = "development"

  ami_id                = data.aws_ssm_parameter.ubuntu_ami.value
  instance_type         = var.instance_type
  subnet_id             = module.network.public_subnet_id
  security_group_ids    = [module.security_group.security_group_id]
  instance_profile_name = module.iam.instance_profile_name
  root_volume_size      = var.root_volume_size

  associate_public_ip_address = true

  user_data = <<-USERDATA
  #!/bin/bash
  set -euxo pipefail

  apt-get update

  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    docker.io \
    docker-compose-v2 \
    curl \
    unzip

  systemctl enable --now docker
  usermod -aG docker ubuntu

  curl -fsSL \
    "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
    -o /tmp/awscliv2.zip

  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install

  rm -rf /tmp/aws /tmp/awscliv2.zip
USERDATA

  tags = var.tags
}

locals {
  name = "${var.project_name}-dev"

  tags = merge(var.tags, {
    Project     = var.project_name
    Environment = "development"
    ManagedBy   = "Terraform"
  })
}
