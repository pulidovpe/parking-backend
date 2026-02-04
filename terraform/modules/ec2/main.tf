# ==================== modules/ec2/main.tf ====================

data "aws_caller_identity" "current" {}

locals {
  unique_id = substr(md5("${var.Project}-${var.Environment}-${data.aws_caller_identity.current.account_id}"), 0, 6)

  ami_patterns = {
    amazon2     = ["amzn2-ami-hvm-*-x86_64-gp2"]
    ubuntu22    = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
    ubuntu24    = ["ubuntu/images/hvm-ssd/ubuntu-noble-24.04-amd64-server-*"]
    rhel9       = ["RHEL-9.*_HVM-*-x86_64-*"]
    windows2022 = ["Windows_Server-2022-English-Full-Base-*"]
  }

  user_data_b64 = var.user_data_file != null ? filebase64("${path.module}/${var.user_data_file}") : null
  user_data_txt = var.user_data_text != null ? var.user_data_text : null
}

# --- RECURSOS DE IAM (Opcionales) ---
resource "aws_iam_role" "this" {
  count = var.create_iam_profile ? 1 : 0
  name  = "${var.name_prefix}-${var.Environment}-ec2-role-${local.unique_id}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_readonly" {
  count      = var.create_iam_profile ? 1 : 0
  role       = aws_iam_role.this[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "this" {
  count = var.create_iam_profile ? 1 : 0
  name  = "${var.name_prefix}-${var.Environment}-profile-${local.unique_id}"
  role  = aws_iam_role.this[0].name
}

# AMI automática
data "aws_ami" "this" {
  most_recent = true
  owners = (
    var.os == "windows2022" ? ["amazon"] : 
    (startswith(var.os, "ubuntu") ? ["099720109477"] : ["amazon", "679593333241"])
  )

  filter {
    name   = "name"
    values = local.ami_patterns[var.os]
  }
  filter {
    name = "virtualization-type"
    values = ["hvm"]
  }
  filter {
    name = "root-device-type"
    values = ["ebs"]
  }
  filter {
    name = "architecture"
    values = ["x86_64"]
  }
}

# Instancias – SIN SG PROPIO
resource "aws_instance" "this" {
  count                       = var.instance_count
  ami                         = data.aws_ami.this.id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_ids[count.index % length(var.subnet_ids)]
  key_name                    = var.existing_key_name
  associate_public_ip_address = var.enable_public_ip

  # Lógica: Si creamos el perfil, usamos el nuevo. Si no, usamos el nombre pasado por variable.
  iam_instance_profile = var.create_iam_profile ? aws_iam_instance_profile.this[0].name : var.iam_instance_profile_name

  # Usar los SGs recibidos
  vpc_security_group_ids      = var.security_group_ids

  user_data_base64            = local.user_data_b64 != null ? local.user_data_b64 : null
  user_data                   = local.user_data_txt != null ? local.user_data_txt : null
  monitoring                  = false

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_size = var.root_volume_size_gb
    encrypted   = true
  }

  tags = merge({
    Name        = "${var.name_prefix}-${var.Environment}-${format("%02d", count.index + 1)}"
    Environment = var.Environment
    Project     = var.Project
    OS          = var.os
  }, var.tags)
}