# Praktis

## Development

Start the complete development stack from the repository root:

```powershell
docker compose up -d
```

The frontend source is bind-mounted into the container. Next.js hot reload remains
enabled, so normal source-code changes do not require rebuilding the image.

Use a rebuild after changing a Dockerfile or other image-level configuration:

```powershell
docker compose up --build -d
```

Frontend dependencies are checked on container startup and stored in reusable
Docker volumes. Changes to `package.json` or `pnpm-lock.yaml` are synchronized
automatically without recreating the dependency volume. Restart the frontend
after changing either file:

```powershell
docker compose restart frontend
```

Apply backend migrations after the stack is running:

```powershell
docker compose exec backend alembic upgrade head
```

Seed the initial development users when setting up a new database:

```powershell
docker compose exec backend python scripts/seed_users.py
```

Open the application at <http://localhost:8080>.

Useful diagnostics:

```powershell
docker compose ps
docker compose logs -f frontend backend nginx
```
