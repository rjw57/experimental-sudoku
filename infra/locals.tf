# locals.tf sets local variables used by the configuration.

locals {
  # Default region for resources
  default_region = "europe-west2"

  # Services which need to be enabled
  enabled_services = toset([
    "cloudfunctions.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "storage.googleapis.com",
  ])
}
