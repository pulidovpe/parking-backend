# ==================== envs/test/vars.tf ====================

variable "project"       { type = string }
variable "environment"   { type = string }
variable "aws_region"    { type = string }
variable "vpc_id"        { type = string }
variable "subnet_ids"    { type = list(string) }
variable "key_name"      { type = string }
variable "instance_type" { type = string }
variable "iam_instance_profile_name" {
  type        = string
  description = "Nombre del IAM Instance Profile para que la EC2 acceda a ECR (opcional)"
  default     = null
}

# --- Variables de la App (.env) ---
variable "db_password" {
  type      = string
  sensitive = true
}
variable "jwt_secret" {
  type      = string
  sensitive = true
}
variable "jwt_refresh_secret" {
  type      = string
  sensitive = true
}
variable "encryption_key" {
  type      = string
  sensitive = true
}
variable "db_user" { default = "parking_user" }
variable "db_name" { default = "parking_prod" }
variable "smtp_host" { default = "smtp.ethereal.email" }
variable "smtp_port" { default = "587" }
variable "smtp_user" { default = "dummy" }
variable "smtp_pass" { default = "dummy" }
variable "smtp_from" { default = "noreply@parking.com" }