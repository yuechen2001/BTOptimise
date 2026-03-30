# Deployment & Developer Guide

## Architecture

BTOptimise runs as two public Cloud Run services on GCP (region: `asia-southeast1`). Cloud Run is serverless — there are no VMs to manage. Google handles the underlying infrastructure, spinning containers up on incoming requests and back down when idle. Both services scale to zero when unused, meaning no cost when idle.

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
5. Deploys the frontend with the backend URL injected as an environment variable.

To trigger a deploy, run `gcloud builds submit` from the repo root with the current git SHA as a substitution. No GCP console interaction is required after initial setup.

### Deploying via GitHub Actions

Team members without GCP access can trigger a deploy directly from GitHub. Go to **Actions → Deploy to Cloud Run → Run workflow**. This submits the same Cloud Build pipeline under the hood using a service account key stored in repository secrets (`GCP_SA_KEY`). No local GCP setup required.

## Initial Setup (one-time)

Before the first deploy, a human must run the bootstrap script (`infra/bootstrap.sh`) to enable GCP APIs and create the Terraform state bucket. Then `terraform apply` inside `infra/` provisions the remaining infrastructure. The MongoDB secret value must also be stored in Secret Manager manually.

After the first successful deploy (which creates the Cloud Run services), run `terraform apply` once more — this sets the public `allUsers` IAM bindings on both services, which Terraform manages but can only apply once the services exist.

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
