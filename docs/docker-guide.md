# Docker Guide

Docker Compose runs Kaindra's frontend, backend, and MongoDB together in
containers. You do not need to install Node.js or MongoDB on your computer to
use this local setup.

## Before you start

- Install and start Docker Desktop with Docker Compose enabled.
- Open a terminal in the project root.
- Create the root `.env` file if you have not already:

```powershell
Copy-Item .env.example .env
```

In `.env`, use this database URL for Docker:

```dotenv
DATABASE_URL=mongodb://mongodb:27017/kaindra
```

## Start the project

From the project root, run:

```powershell
.\docker\dev-test.ps1 start
```

The first start builds the images and can take a few minutes. Open the app at
<http://localhost:5173>. The backend runs on port `5000`; its readiness check
is at <http://localhost:5000/ready>.

## Everyday commands

Run these from the project root:

```powershell
.\docker\dev-test.ps1 status   # See whether services are running
.\docker\dev-test.ps1 logs     # Follow service logs; Ctrl+C exits log viewing
.\docker\dev-test.ps1 restart  # Rebuild and restart the services
.\docker\dev-test.ps1 stop     # Stop and remove the containers
```

The services are `frontend`, `backend`, and `mongodb`. Their logs can also be
checked individually with `docker compose -f docker/docker-compose.yml logs
backend` (replace `backend` with another service name as needed).

## Data and troubleshooting

MongoDB stores its data in a named Docker volume. The `stop` command preserves
that data, so it remains when you start the project again. To deliberately
remove the database and all its data, run this from the project root:

```powershell
docker compose -f docker/docker-compose.yml down --volumes
```

This deletion cannot be undone. Do not use it if you want to keep your local
database.

If a service does not start, check `status` and `logs`. Common causes include
Docker Desktop not running, a missing root `.env`, an incorrect database URL,
or ports `27017`, `5000`, and `5173` already being in use. After changing
dependencies or Docker configuration, run `restart` to rebuild.

For environment variable details, see
[Environment Configuration](./environment-configuration.md). For setup
without Docker, see [Local Development Setup](./local-development-setup.md).