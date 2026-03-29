#!/usr/bin/env bash
# Run this ONCE from your terminal before the first terraform apply.
# Prerequisites: gcloud CLI installed and authenticated (gcloud auth login)
set -euo pipefail

PROJECT_ID="btoptimise"
REGION="asia-southeast1"

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
