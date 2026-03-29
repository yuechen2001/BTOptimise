output "registry_url" {
  description = "Base URL for Docker images in Artifact Registry"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
}

output "backend_sa_email" {
  value = google_service_account.backend.email
}

output "frontend_sa_email" {
  value = google_service_account.frontend.email
}
