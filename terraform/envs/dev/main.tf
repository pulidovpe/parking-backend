data "aws_caller_identity" "current" {}

module "ec2_backend" {
  source = "../../modules/ec2"

  Project      = var.project
  Environment  = var.environment
  name_prefix  = "parking-api"

  create_iam_profile        = true
  iam_instance_profile_name = var.iam_instance_profile_name
  
  vpc_id               = var.vpc_id
  subnet_ids           = var.subnet_ids
  security_group_ids   = [aws_security_group.api.id]
  enable_public_ip     = true

  instance_type        = var.instance_type
  instance_count       = 1
  os                   = "ubuntu22"
  existing_key_name    = var.key_name

  user_data_text = templatefile("${path.module}/user_data.sh.tpl", {
    account_id         = data.aws_caller_identity.current.account_id
    region             = var.aws_region
    db_user            = var.db_user
    db_password        = var.db_password
    db_name            = var.db_name
    jwt_secret         = var.jwt_secret
    jwt_refresh_secret = var.jwt_refresh_secret
    encryption_key     = var.encryption_key
    smtp_host          = var.smtp_host
    smtp_port          = var.smtp_port
    smtp_user          = var.smtp_user
    smtp_pass          = var.smtp_pass
    smtp_from          = var.smtp_from
  })

  tags = {
    Tier = "backend"
  }
}
