terraform {
  required_version = ">= 1.9.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.75"
    }
  }
  backend "s3" {
    bucket         = "nexuscore-terraform-state-prod"
    key            = "infrastructure/nexuscore.tfstate"
    region         = "us-east-1"
    dynamodb_table = "nexuscore-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "NexusCore-Enterprise"
      ManagedBy   = "Terraform"
    }
  }
}

variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

# Multi-AZ VPC Networking
resource "aws_vpc" "nexus_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "nexuscore-vpc-prod"
  }
}

# AWS EKS Kubernetes Cluster
resource "aws_eks_cluster" "nexus_eks" {
  name     = "nexuscore-eks-cluster"
  role_arn = "arn:aws:iam::123456789012:role/NexusEKSClusterRole"
  version  = "1.30"

  vpc_config {
    subnet_ids              = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    endpoint_private_access = true
    endpoint_public_access  = false
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.nexus_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.nexus_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
}
