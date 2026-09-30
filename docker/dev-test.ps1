param (
    [string]$Action
)

switch ($Action) {
    "start" {
        Write-Host "Starting..."
        docker compose -f docker/docker-compose.yml up --build -d
    }

    "stop" {
        Write-Host "Stopping..."
        docker compose -f docker/docker-compose.yml down
    }

    "restart" {
        Write-Host "Restarting..."
        docker compose -f docker/docker-compose.yml down
        docker compose -f docker/docker-compose.yml up --build -d
    }

    "status" {
        Write-Host "Status:"
        docker compose -f docker/docker-compose.yml ps
    }

    "logs" {
        Write-Host "Showing  logs..."
        docker compose -f docker/docker-compose.yml logs -f
    }

    default {
        Write-Host "Usage: .\docker\dev-test.ps1 {start|stop|restart|status|logs}"
        exit 1
    }
}