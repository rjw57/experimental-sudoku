# backend.tf specifies the state backend
terraform {
  backend "gcs" {
    bucket = "state-48d988af3aa726"
    prefix = "terraform/sudoku"
  }
}
