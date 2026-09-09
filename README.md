
# project-kaindra

----

## Containerized Development Testing
Docker is provided to test the complete application in a consistent, containerized environment.

### Prerequisites
- Docker Desktop

Make sure Docker Desktop is running.

**Start the containerized development environment:**

```powershell
.\docker\dev-test.ps1 start
```
**Stop:**
```powershell
.\docker\dev-test.ps1 stop
```

**Restart:**
```powershell
.\docker\dev-test.ps1 restart
```
**Check the Status:**
```powershell
.\docker\dev-test.ps1 status
```

**See Logs:**
```powershell
.\docker\dev-test.ps1 logs
```

**Access**

Frontend: http://localhost:5173

Backend: http://localhost:5000

### Production

Production configuration:

```powershell
docker compose -f docker/docker-compose.prod.yml up -d --build
```

**Stop production:**

```powershell
docker compose -f docker/docker-compose.prod.yml down
``` 

Access : http://localhost

test