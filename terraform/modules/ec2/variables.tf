# ==================== modules/ec2/variables.tf ====================

variable "Project"           { type = string }
variable "Environment"       { type = string }

variable "vpc_id"            { type = string }
variable "subnet_ids"        { type = list(string) }
variable "name_prefix"       { type = string }
variable "instance_count"    {
  type = number
  default = 1
}
variable "instance_type"     {
  type = string
  default = "t3.micro"
}
variable "os" {
  type    = string
  default = "ubuntu22"
  validation {
    condition     = contains(["amazon2", "ubuntu22", "ubuntu24", "rhel9", "windows2022"], var.os)
    error_message = "SO soportado: amazon2, ubuntu22, ubuntu24, rhel9, windows2022"
  }
}
variable "existing_key_name" { type = string }
variable "user_data_file"       {
  type = string
  default = null
}
variable "user_data_text" {
  type        = string
  default     = null
}
variable "enable_public_ip"     {
  type = bool
  default = true
}

# SGs que ya existen (público del network)
variable "security_group_ids" {
  type        = list(string)
  description = "Lista de Security Groups existentes (ej: public_sg del módulo network)"
}
variable "root_volume_size_gb"  {
  type = number
  default = 20
}
variable "tags"                 {
  type = map(string)
  default = {}
}

variable "create_iam_profile" {
  type        = bool
  description = "Si es true, el módulo creará un IAM Role y Instance Profile con acceso a ECR"
  default     = false
}

variable "iam_instance_profile_name" {
  type        = string
  description = "Nombre del IAM Instance Profile para que la EC2 acceda a ECR (opcional)"
  default     = null
}