# providers.tf configures providers used by the configuration.

# Google providers which use project admin service account credentials.

provider "google" {
  project = google_project.default.project_id
  region  = local.default_region

  credentials = google_service_account_key.project_owner.private_key
}

provider "google-beta" {
  project = google_project.default.project_id
  region  = local.default_region

  credentials = base64decode(google_service_account_key.project_owner.private_key)
}

# Google providers which use the default credentials

provider "google" {
  alias  = "app-default"
  region = local.default_region
}

provider "google-beta" {
  alias  = "app-default"
  region = local.default_region
}

# Google providers which use the default credentials and created project

provider "google" {
  alias   = "app-default-and-project"
  project = google_project.default.project_id
  region  = local.default_region
}

provider "google-beta" {
  alias   = "app-default-and-project"
  project = google_project.default.project_id
  region  = local.default_region
}
