# project.tf creates the top-level project resource and associated admin service accounts.

# A Google project with a random project id
resource "random_id" "project" {
  prefix      = "sudoku-"
  byte_length = 6
}

# The project itself
resource "google_project" "default" {
  project_id = random_id.project.hex
  name       = "Sudoku"

  provider = google.app-default
}

# Services on the project
resource "google_project_service" "default" {
  for_each = local.enabled_services
  service  = each.key
  provider = google.app-default-and-project
}

# A service account which has "project owner" rights.
resource "google_service_account" "project_owner" {
  account_id   = "terraform-owner"
  display_name = "Terraform project owner"

  provider = google.app-default-and-project
}

resource "google_project_iam_member" "project_owner" {
  role   = "roles/owner"
  member = "serviceAccount:${google_service_account.project_owner.email}"

  provider = google.app-default-and-project
}

# Credentials for said service account.
resource "google_service_account_key" "project_owner" {
  service_account_id = google_service_account.project_owner.account_id

  provider = google.app-default-and-project
}
