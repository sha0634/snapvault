terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "snapvault_bucket" {
  bucket = "snapvault-photos-akank"
}

# AWS blocks public access by default. We must explicitly disable it to allow our public policy.
resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.snapvault_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "snapvault_policy" {
  bucket     = aws_s3_bucket.snapvault_bucket.id
  depends_on = [aws_s3_bucket_public_access_block.public_access]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.snapvault_bucket.arn}/*"
      }
    ]
  })
}
