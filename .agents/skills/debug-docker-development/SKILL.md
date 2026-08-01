---
name: debug-docker-development
description: Diagnose Praktis local Docker Compose, Nginx routing, service health, build, migration, and hot-reload problems using non-destructive inspection. Do not delete volumes or reset data.
---

# Debug Docker Development

1. Read `docs/ARCHITECTURE.md` and `docs/DEVELOPMENT.md`.
2. Inspect with non-destructive commands:
   - `docker compose config`
   - `docker compose ps`
   - targeted `docker compose logs`
   - `docker compose exec` for read-only file/config inspection
3. Confirm Nginx is reached at `http://localhost:8080`.
4. Confirm frontend uses the `dev` target and bind mount from `./frontend` to `/app`.
5. Confirm backend uses the `dev` target and bind mount from `./backend` to `/app`.
6. Confirm browser API paths begin with `/api/` and Nginx forwards them to backend root paths.
7. Confirm backend internal service endpoints use Docker service names:
   - database: `db`
   - MinIO: `storage:9000`
   - Redis: `cache:6379`
8. When hot reload fails, compare the host file with the file visible inside the container before clearing caches.
9. Rebuild only the affected service when Dockerfile, lockfile, requirements, or Compose build configuration changed.
10. Never run `docker compose down -v`, `docker volume prune`, database reset, or storage deletion without explicit owner confirmation.
11. Document the observed cause and the smallest safe fix.
