# Kaindra

Kaindra is a web application for the MotoTribe riding community and ModaSphere
commerce and content experiences. It also includes shared accounts,
communities, careers, and administration features.

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React 19, Vite 6, React Router |
| Backend | Node.js 24, Express 5 |
| Database | MongoDB with Mongoose |
| Local development | Docker Compose |
| Production delivery | Docker, GitHub Actions, AWS (EC2, ECR, SSM), Terraform |

## Documentation

| Guide | What it covers |
|---|---|
| [Local development setup](./docs/local-development-setup.md) | Beginner-friendly setup and project layout |
| [Environment configuration](./docs/environment-configuration.md) | `.env` files and application settings |
| [Docker guide](./docs/docker-guide.md) | Local containers, commands, and data |
| [AWS infrastructure setup](./docs/aws-infrastructure-setup.md) | AWS and Terraform overview |
| [Terraform deployment](./docs/terraform-deployment.md) | Infrastructure and application deployment overview |
| [CI/CD deployment](./docs/cicd-deployment.md) | Automated checks and release workflow |
| [Production handover](./docs/production-handover.md) | Production readiness checklist |
| [Security and secrets](./docs/security-and-secrets.md) | Credentials, access, and sensitive files |
| [Terraform operations](./terraform/README.md) | Detailed infrastructure and operations references |

## Quick local setup

You need Git and Docker Desktop with Docker Compose enabled. From the project
root, create your local environment file:

```powershell
Copy-Item .env.example .env
```

In `.env`, set the database URL for Docker Compose:

```dotenv
DATABASE_URL=mongodb://mongodb:27017/kaindra
```

Start the application:

```powershell
.\docker\dev-test.ps1 start
```

Open the frontend at <http://localhost:5173>. The backend readiness check is
at <http://localhost:5000/ready>. Check services with
`.\docker\dev-test.ps1 status`, view logs with `.\docker\dev-test.ps1 logs`,
and stop the stack with `.\docker\dev-test.ps1 stop`.

The example environment file contains placeholders. Add integration
credentials only when needed; never commit real credentials. See the
[environment configuration guide](./docs/environment-configuration.md) for
details.

## Important production notes

- Production MongoDB is external; the AWS Terraform and deployment Compose
  setup do not create a database.
- Database backups, restore testing, monitoring, DNS, and production
  operations need to be arranged by the service owner.
- Terraform changes can create costs or affect live infrastructure. Review
  and approve plans before applying them; do not run `terraform destroy` as
  routine cleanup.
- Production deployment requires approved GitHub Environment settings,
  populated AWS Secrets Manager configuration, and an authorized review.
- Deployment rollback does not reverse database changes. Only deploy
  backward-compatible database changes under the documented release process.

See the [production handover checklist](./docs/production-handover.md) and
[Terraform operations guide](./terraform/DEPLOYMENT.md) before enabling
production.
