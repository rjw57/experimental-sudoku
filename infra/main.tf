# main.tf specifies top-level resources used by the configuration

# Enable firebase functionality in the given project.
resource "google_firebase_project" "default" {
  provider = google-beta
}

# Default location for firebase resources.
resource "google_firebase_project_location" "default" {
  location_id = local.default_region

  provider = google-beta
  depends_on = [
    google_firebase_project.default
  ]
}

# A webapp in the firebase project
resource "google_firebase_web_app" "default" {
  display_name = "Experiments"

  provider = google-beta
  depends_on = [
    google_firebase_project_location.default,
  ]
}

# App config for the default webapp
data "google_firebase_web_app_config" "default" {
  web_app_id = google_firebase_web_app.default.app_id
  provider   = google-beta
}

# App config in frontend/ directory
resource "local_file" "app_config" {
  filename = "${path.module}/../frontend/firebaseAppConfig.json"

  content = jsonencode({
    appId             = google_firebase_web_app.default.app_id
    apiKey            = data.google_firebase_web_app_config.default.api_key
    authDomain        = data.google_firebase_web_app_config.default.auth_domain
    databaseURL       = lookup(data.google_firebase_web_app_config.default, "database_url", "")
    storageBucket     = lookup(data.google_firebase_web_app_config.default, "storage_bucket", "")
    messagingSenderId = lookup(data.google_firebase_web_app_config.default, "messaging_sender_id", "")
    measurementId     = lookup(data.google_firebase_web_app_config.default, "measurement_id", "")
    projectId         = google_firebase_web_app.default.project
  })
}

# Firebase CLI configuration
resource "local_file" "firebase_cli_config" {
  filename = "${path.module}/../.firebaserc"

  content = jsonencode({
    projects = {
      default = google_firebase_web_app.default.project
    }
  })
}
