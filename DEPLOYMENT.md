# Deployment & Developer Guide

## Architecture

BTOptimise runs as two public Cloud Run services on GCP (region: `asia-southeast1`):

- **Frontend** — React/Vite app served by nginx. All `/api/*` requests are proxied at runtime to the backend service URL via an nginx reverse proxy, so the frontend image is backend-URL-agnostic at build time.
- **Backend** — Express/Node.js API on port 5050. Reads `MONGO_URI` from GCP Secret Manager at startup.
- **Database** — MongoDB Atlas (external, not on GCP).

Docker images are stored in **Artifact Registry**. Infrastructure (registry, IAM, secret, service accounts) is managed by **Terraform** with state in a GCS bucket (`btoptimise-tfstate`).

## Deploying

Deployments are triggered manually via **Cloud Build**. On each deploy, Cloud Build:

1. Builds the backend and frontend Docker images in parallel.
2. Pushes both images to Artifact Registry.
3. Deploys the backend Cloud Run service with the MongoDB secret injected.
4. Resolves the backend's live URL, then deploys the frontend with that URL set as an environment variable (used by nginx to proxy API calls).
5. Grants public (`allUsers`) invoker access to both services.

To trigger a deploy, run `gcloud builds submit` from the repo root with the current git SHA as a substitution. No GCP console interaction is required after initial setup.

## Initial Setup (one-time)

Before the first deploy, a human must run the bootstrap script (`infra/bootstrap.sh`) to enable GCP APIs and create the Terraform state bucket. Then `terraform apply` inside `infra/` provisions the remaining infrastructure. The MongoDB secret value must also be stored in Secret Manager manually.

Connecting a GitHub trigger for automatic deploys on push requires a one-time OAuth step in the GCP console to authorise repository access.

## Developer Guide

### Monorepo structure

The repo is a pnpm/npm hybrid monorepo. The **frontend** uses pnpm; the **backend** and root use npm. Do not mix package managers within a workspace.

### Local development

Run the backend and frontend independently in dev mode — no Docker needed locally. The backend connects directly to MongoDB Atlas using the `MONGO_URI` in `.env`. The frontend dev server proxies API calls to `localhost:5050` by default (configured in `src/services/api.ts`).

### Making changes

- **Backend changes** — edit TypeScript source under `backend/src/`. The backend is compiled before the Docker image is built, so type errors will fail the build.
- **Frontend changes** — edit source under `frontend/src/`. `VITE_API_URL` is baked in as `/api` at image build time; do not hardcode backend URLs in frontend code.
- **Infrastructure changes** — edit files under `infra/` and run `terraform apply` before deploying. Terraform manages Artifact Registry, Secret Manager, IAM, and service accounts only — Cloud Run services are managed by Cloud Build.

### Secrets

Never commit `.env` or any credentials. The only secret in production is `MONGO_URI`, stored in GCP Secret Manager and mounted into the backend container automatically at deploy time.
