# Environment Configuration

Environment variables configure local services and optional integrations
without putting settings or secrets in application code.

## Which `.env` file should I edit?

- **Backend:** Reads `.env` from the repository root. Start with the root
  `.env.example`; use [`backend/.env.example`](../backend/.env.example) as a
  reference for additional backend and integration settings.
- **Frontend:** Optional. Copy [`frontend/.env.example`](../frontend/.env.example)
  to `frontend/.env` when you need frontend settings such as Google sign-in or
  Maps.

For Docker Compose, the backend gets its settings from the root `.env`. The
Compose configuration also sets the frontend's API proxy automatically. When
running services directly, the Vite proxy defaults to the backend at
`http://localhost:5000`.

## Quick setup

From the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
```

For Docker Compose, edit `.env` and set:

```dotenv
DATABASE_URL=mongodb://mongodb:27017/kaindra
```

For services running directly on your computer, use your local MongoDB URL
instead, for example `mongodb://localhost:27017/kaindra`.

Only add integration credentials when you need that feature. Production
requires valid database, JWT, Razorpay, and Cloudinary settings; placeholder
values are not accepted.

## Keep secrets safe

- Never commit `.env` files, passwords, private API keys, or production
  credentials.
- Use test credentials for local development and ask your project maintainer
  how to obtain them.
- Frontend variables must start with `VITE_` to be available to the browser.
  Treat them as public: do not put secrets in frontend variables.
- After changing frontend environment variables, restart the Vite server.

For the full startup steps, see
[Local Development Setup](./local-development-setup.md).