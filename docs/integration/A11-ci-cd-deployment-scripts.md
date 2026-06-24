# A11. CI/CD Docs / Deployment Scripts

Status: Draft deployment notes ready
Target: 24-Jun-2026

## Branch Model

| Repository | Environment Branches | Notes |
| --- | --- | --- |
| Frontend `vidai-lms` | `dev`, `dev-us`, `main`, `main-us` | Application code should be synced. Deployment-specific workflow/settings files must remain environment-specific. |
| Backend `vidai-lms-services` | `main`, `main-us` | Application code should be synced. Server/env/deployment files must remain environment-specific. |

## Frontend Deployment Checklist

1. Pull the target branch.
2. Confirm environment file values for API base URL and environment-specific settings.
3. Run install/build checks.
4. Deploy built assets through the environment-specific deployment workflow.
5. Validate login, dashboard, leads hub, pipeline, campaigns, and permissions.

Common commands:

```bash
npm install
npm run build
```

## Backend Deployment Checklist

1. Pull the target backend branch.
2. Confirm `.env`/server environment values.
3. Install dependencies if requirements changed.
4. Run migrations.
5. Restart backend service.
6. Validate Swagger/API health, login, leads, campaigns, pipeline, and integration endpoints.

Common commands:

```bash
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check
```

## Environment-Specific Files

Deployment workflow/settings files are intentionally not force-synced between India/Mexico and US environments. Code merges should preserve these deployment differences and only sync application logic unless DevOps explicitly approves workflow changes.

