# Kaindra

Kaindra is a web application with a React/Vite frontend and a Node.js/Express
API. Its routes and UI cover the MotoTribe riding/community experience,
ModaSphere commerce and content, and shared account, community, career, and
administration features.

This README is the main onboarding entry point. Detailed infrastructure and
operations references are in the [Terraform and operations guide](./terraform/README.md)
and the linked documents below.

## Technology and architecture

| Area | Implemented technology |
|---|---|
| Frontend | React 19, Vite 6, React Router |
| Backend | Node.js 24, Express 5, Mongoose |
| Data | MongoDB (containerized for local development; deployment uses the configured `DATABASE_URL`) |
| Local container stack | Docker Compose: MongoDB, API, Vite dev server |
| Production image stack | Docker images; Nginx serves the frontend image |
| AWS handoff configuration | Terraform roots for dev and prod using EC2, EIP, VPC, security group, IAM, ECR, Secrets Manager metadata, and GitHub OIDC |
| AWS deployment path | GitHub Actions, ECR, SSM Run Command, Docker Compose, Caddy |

## Local development

### Prerequisites

- Git
- Node.js 24 and npm, if running services directly
- Docker Desktop with Docker Compose, for the containerized development stack
- A local `.env` file based on [.env.example](./.env.example)

The checked-in example contains placeholders, not usable credentials. Set
`DATABASE_URL=mongodb://mongodb:27017/kaindra` for the Docker Compose stack,
because the backend connects to the `mongodb` Compose service. For running the
backend directly on the host, use an appropriate local MongoDB URI instead.
Set only the integrations required for the feature being developed.

Start the containerized development environment from the repository root:

```powershell
Copy-Item .env.example .env
# Edit .env and configure local values; set DATABASE_URL for Compose as above.
.\docker\dev-test.ps1 start
```

The script wraps `docker compose -f docker/docker-compose.yml`:

```powershell
.\docker\dev-test.ps1 status
.\docker\dev-test.ps1 logs
.\docker\dev-test.ps1 restart
.\docker\dev-test.ps1 stop
```
