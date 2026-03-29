resource "google_artifact_registry_repository" "images" {
  location      = var.region
  repository_id = "btoptimise"
  description   = "Docker images for BTOptimise"
  format        = "DOCKER"
}
