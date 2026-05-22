terraform {
  required_providers {
    minio = {
      source  = "aminueza/minio"
      version = ">= 3.0.0"
    }
  }
}

provider "minio" {
  minio_server   = "minio:9000"
  minio_user     = "snapvault-admin"
  minio_password = "snapvault-secure-s3-pass"
  minio_ssl      = false
}

resource "minio_s3_bucket" "snapvault_bucket" {
  bucket = "snapvault-photos"
  acl    = "public"
}

resource "minio_s3_bucket_policy" "snapvault_policy" {
  bucket = minio_s3_bucket.snapvault_bucket.bucket
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = ["arn:aws:s3:::snapvault-photos/*"]
      }
    ]
  })
}
