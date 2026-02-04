# ==================== modules/ec2/outputs.tf ====================

output "public_ips" {
  description = "IPs públicas de las instancias (vacío si no tienen)"
  value       = compact(aws_instance.this[*].public_ip)
}

output "instance_info" {
  description = "Información completa para conectar a las instancias"
  value = {
    instance_ids   = aws_instance.this[*].id
    public_ips     = compact(aws_instance.this[*].public_ip)
    private_ips    = aws_instance.this[*].private_ip
    key_pair_name  = var.existing_key_name
    user           = local.ssh_user
    ssh_command    = length(compact(aws_instance.this[*].public_ip)) > 0 ? "ssh -i ~/.ssh/${var.existing_key_name}.pem ${local.ssh_user}@${aws_instance.this[0].public_ip}" : "NO_IP_PUBLICA"
  }
}

# Usuario correcto según SO
locals {
  ssh_user = {
    amazon2     = "ec2-user"
    amazon2023  = "ec2-user"
    ubuntu22    = "ubuntu"
    ubuntu24    = "ubuntu"
    rhel9       = "ec2-user"
    windows2022 = "Administrator (usa RDP)"
  }[var.os]
}

output "iam_instance_profile_used" {
  description = "El nombre del perfil de IAM asignado a las instancias"
  value       = var.iam_instance_profile_name
}