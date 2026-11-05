# Local Development Setup

Welcome to Kaindra! This guide explains how to get the project running on your
computer, where to find the main parts of the code, and what to try when
something does not work.

Kaindra has three parts:

- **Frontend**: the React website, built with Vite.
- **Backend**: the Node.js and Express API, including real-time features.
- **Database**: MongoDB, which stores application data.

For the quickest setup, use Docker Compose. It starts all three parts together.

## What you need

For the Docker setup:

- Git
- Docker Desktop with Docker Compose enabled

For the manual setup, you also need:

- Node.js 24 and npm
- MongoDB running locally, or a MongoDB connection string you can use

Check your Node.js and npm versions from a terminal:

```powershell
node --version
npm --version
```

## 1. Get the project

If you have not already cloned the repository, open a terminal and run:

```powershell
git clone <repository-url>
cd project-kaindra
```

Replace `<repository-url>` with the clone URL provided by your team. If you
already have the project, open a terminal at the project folder instead.

## 2. Configure local environment variables

The backend reads its environment variables from the `.env` file in the
repository root. Create it from the checked-in example:

```powershell
Copy-Item .env.example .env
```

Open `.env` in your editor. For Docker Compose, set the database URL to:

```dotenv
DATABASE_URL=mongodb://mongodb:27017/kaindra
```

`mongodb` is the name of the database service inside Docker Compose. Do not
replace it with `localhost` when using the Docker setup.

The example file uses placeholder values. You do not need to configure every
third-party integration just to start the application, but features such as
Google sign-in, maps, payments, email, or media uploads may need their own
credentials. Ask your project maintainer for access and setup instructions
when working on one of those features.

Never commit `.env` files or real credentials. The repository ignores local
environment files; keep credentials private and use test credentials for local
work.

## Option A: Run everything with Docker Compose

From the repository root, start the services:

```powershell
.\docker\dev-test.ps1 start
```

The first run may take a few minutes while Docker downloads images and builds
the application. When it finishes, open:

- Website: <http://localhost:5173>
- Backend readiness check: <http://localhost:5000/ready>

Check whether the containers are running:

```powershell
.\docker\dev-test.ps1 status
```

View service logs while developing:

```powershell
.\docker\dev-test.ps1 logs
```

Press `Ctrl+C` to stop viewing logs; this does not stop the containers. To
rebuild and restart after changing dependencies or Docker configuration:

```powershell
.\docker\dev-test.ps1 restart
```

Stop the containers when you are finished:

```powershell
.\docker\dev-test.ps1 stop
```

The MongoDB data is stored in a Docker volume, so stopping the containers does
not normally delete your local database.

## Option B: Run the services directly

This option is useful if you want to run the frontend and backend in separate
terminals or already have MongoDB installed. Make sure MongoDB is running and
set the root `.env` database URL to your local instance:

```dotenv
DATABASE_URL=mongodb://localhost:27017/kaindra
```

Open a terminal at the repository root, then install and start the backend:

```powershell
Set-Location backend
npm ci
npm run dev
```

Leave that terminal open. The API listens on port `5000` by default.

Open a second terminal at the repository root, then install and start the
frontend:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. Vite forwards API and Socket.IO requests to the
backend at `http://localhost:5000` by default. If you change the backend port,
update the Vite proxy target in `frontend/vite.config.js` as well.

To stop either service, press `Ctrl+C` in its terminal.

## Where to find things

| Path | What it contains |
|---|---|
| `frontend/src/pages/` | Website pages and screens |
| `frontend/src/components/` | Reusable interface components |
| `frontend/src/services/` | Frontend API and integration code |
| `frontend/src/pages/brands/MotoTribe/` | MotoTribe riding and community features |
| `frontend/src/pages/brands/ModaSphere/` | ModaSphere commerce and content features |
| `backend/server.js` | Backend startup |
| `backend/src/app.js` | Express application and API setup |
| `backend/src/routes/` | API route definitions |
| `backend/src/controllers/` | Request handling |
| `backend/src/models/` | MongoDB/Mongoose data models |
| `backend/src/services/` | Backend business logic and integrations |
| `backend/tests/` | Backend automated tests |
| `docker/docker-compose.yml` | Local container services and configuration |

When adding a feature, look for a similar existing page, route, controller, or
service and follow its pattern. Frontend and backend functionality often work
together, so check both sides when changing an API feature.

## Useful development commands

Run the backend tests from the repository root:

```powershell
Set-Location backend
npm test
```

Build the frontend to check that it compiles:

```powershell
Set-Location frontend
npm run build
```

Run the frontend linter:

```powershell
Set-Location frontend
npm run lint
```

## Troubleshooting

- **The website does not load:** Check `.\docker\dev-test.ps1 status` and
  `.\docker\dev-test.ps1 logs`. Confirm that port `5173` is not already in use.
- **The backend cannot connect to MongoDB in Docker:** Check that the root
  `.env` uses `mongodb://mongodb:27017/kaindra`, then check the logs. The
  database container must be healthy before the backend can start.
- **The backend cannot connect to MongoDB when running directly:** Confirm
  MongoDB is running and that `DATABASE_URL` in the root `.env` points to the
  correct host and database.
- **A feature reports a missing API key or integration setting:** Check the
  feature's required environment variables and ask your project maintainer
  about test credentials. Do not put real credentials in source files or
  commit them.
- **Changes do not appear after a dependency or Dockerfile change:** Restart
  the development stack with `.\docker\dev-test.ps1 restart`.
- **A port is already in use:** Stop the other process using that port, or
  coordinate with your team before changing the service port.

For infrastructure and deployment details, see the
[Terraform and operations guide](../terraform/README.md).