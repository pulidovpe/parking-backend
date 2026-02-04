output "api_url" {
  value = "http://${module.ec2_backend.public_ips[0]}"
}
