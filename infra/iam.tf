locals {
  cloudbuild_sa      = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
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

# ── Cloud Build: deploy Cloud Run ─────────────────────────────────────────────

resource "google_project_iam_member" "cloudbuild_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = local.cloudbuild_sa
}

resource "google_project_iam_member" "cloudbuild_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = local.cloudbuild_sa
}

# Cloud Build must be able to act as the Cloud Run service accounts
resource "google_service_account_iam_member" "cloudbuild_act_as_backend" {
  service_account_id = google_service_account.backend.name
  role               = "roles/iam.serviceAccountUser"
  member             = local.cloudbuild_sa
}

resource "google_service_account_iam_member" "cloudbuild_act_as_frontend" {
  service_account_id = google_service_account.frontend.name
  role               = "roles/iam.serviceAccountUser"
  member             = local.cloudbuild_sa
}

# ── Compute Engine default SA (Cloud Build's actual runtime SA since 2024) ───

resource "google_project_iam_member" "compute_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = local.compute_default_sa
}

resource "google_project_iam_member" "compute_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = local.compute_default_sa
}
