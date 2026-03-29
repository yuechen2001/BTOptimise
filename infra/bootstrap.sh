#!/usr/bin/env bash
# Run this ONCE from your terminal before the first terraform apply.
# Prerequisites: gcloud CLI installed and authenticated (gcloud auth login)
set -euo pipefail

PROJECT_ID="btoptimise"
PROJECT_NUMBER="119271118270"
REGION="asia-southeast1"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "==> Setting active project"
gcloud config set project "$PROJECT_ID"

echo "==> Enabling required APIs (this may take a minute)"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com

echo "==> Creating Terraform state bucket"
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${PROJECT_ID}-tfstate" 2>/dev/null \
  || echo "  Bucket already exists, skipping"
gsutil versioning set on "gs://${PROJECT_ID}-tfstate"

echo "==> Granting Cloud Build service account the permissions Terraform will also set"
echo "    (needed for the very first 'gcloud builds submit' before terraform apply)"
for ROLE in \
  "roles/run.admin" \
  "roles/artifactregistry.writer" \
  "roles/iam.serviceAccountUser" \
  "roles/secretmanager.viewer" \
  "roles/storage.admin"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUDBUILD_SA}" \
    --role="$ROLE" \
    --quiet
done

echo ""
echo "==> Bootstrap complete!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Store the MongoDB connection string as a GCP secret:"
echo "     printf 'mongodb+srv://...' | gcloud secrets create mongo-uri --data-file=-"
echo "     (if the secret already exists from terraform apply, use 'versions add' instead)"
echo ""
echo "  2. Provision infrastructure:"
echo "     cd infra"
echo "     terraform init"
echo "     terraform apply"
echo ""
echo "  3. Trigger the first build & deploy:"
echo "     Go to Actions → Deploy to Cloud Run → Run workflow in GitHub."
