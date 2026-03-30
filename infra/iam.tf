locals {
  compute_default_sa = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

# ── Cloud Run service accounts ────────────────────────────────────────────────

resource "google_service_account" "backend" {
  account_id   = "btoptimise-backend"
  display_name = "BTOptimise Backend"
}

resource "google_service_account" "frontend" {
  account_id   = "btoptimise-frontend"
  display_name = "BTOptimise Frontend"
}

# ── Backend: read mongo-uri secret ───────────────────────────────────────────

resource "google_secret_manager_secret_iam_member" "backend_mongo" {
  secret_id = google_secret_manager_secret.mongo_uri.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

# ── Cloud Build (runs as Compute Engine default SA since 2024) ────────────────

resource "google_project_iam_member" "compute_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = local.compute_default_sa
}

resource "google_project_iam_member" "compute_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = local.compute_default_sa
}

# Scoped to only the two Cloud Run SAs Cloud Build needs to deploy as
resource "google_service_account_iam_member" "compute_act_as_backend" {
  service_account_id = google_service_account.backend.name
  role               = "roles/iam.serviceAccountUser"
  member             = local.compute_default_sa
}

resource "google_service_account_iam_member" "compute_act_as_frontend" {
  service_account_id = google_service_account.frontend.name
  role               = "roles/iam.serviceAccountUser"
  member             = local.compute_default_sa
}

# ── Public access to Cloud Run services ──────────────────────────────────────
# Note: run terraform apply after the first Cloud Build deploy creates the services.

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = var.region
  name     = "btoptimise-frontend"
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = var.region
  name     = "btoptimise-backend"
  role     = "roles/run.invoker"
  member   = "allUsers"
}
