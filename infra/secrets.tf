resource "google_secret_manager_secret" "mongo_uri" {
  secret_id = "mongo-uri"

  replication {
    auto {}
  }
}
