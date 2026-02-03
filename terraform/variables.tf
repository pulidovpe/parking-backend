variable "instance_name" {
  description = "Nombre de la instancia EC2"
  type        = string
  default     = "parking-backend-prod"
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.small" # t3.small recomendado para Node+Postgres+Redis.
}

variable "key_name" {
  description = "Nombre del Key Pair para SSH"
  type        = string
  default     = "devops-tmp"
}