---
name: debug-docker-development
description: Diagnose Praktis local Docker Compose, Nginx routing and body limits, host exposure, service health, builds, migrations, and hot reload through non-destructive inspection. Never delete volumes, storage, or data.
---

# Debug Docker Development

1. Read `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, relevant security constraints, and `docs/API_CONTRACT_STATUS.md` when the symptom may be contract-related.
2. Inspect with `docker compose config`, `docker compose ps`, targeted logs, and read-only container commands.
3. Reach the application through `http://localhost:8080`; verify browser APIs use `/api/` and Nginx forwards to backend root paths.
4. Verify dev targets and bind mounts: `./frontend:/app` and `./backend:/app`.
5. Verify internal service names: database `db`, MinIO `storage:9000`, Redis `cache:6379`.
6. Distinguish internal service routing from current host-published PostgreSQL/MinIO ports.
7. For upload failures, compare Nginx location body limits with backend policy: module PUTs use `/praktis-modules/`; imports use `/api/`.
8. For hot-reload failures, compare host and container files before clearing caches or rebuilding.
9. Rebuild only the affected service after Dockerfile, lockfile, requirements, or build-configuration changes.
10. Do not print `.env` secrets or credentials.
11. Never run volume deletion, database reset/truncate/drop, migration downgrade, or storage deletion without explicit owner confirmation.
12. Report the observed cause, evidence, smallest safe fix, any production-versus-local distinction, and whether contract readiness changed. Do not edit backend or Superadmin frontend files without explicit reassignment.
