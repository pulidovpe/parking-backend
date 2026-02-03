# Buscamos la última imagen de Ubuntu 22.04
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.parking_sg.id]

  # Script de inicio (Instala Docker y AWS CLI)
  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y ca-certificates curl gnupg lsb-release unzip

              # Instalar Docker
              mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
              $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

              # Instalar AWS CLI v2
              curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              unzip awscliv2.zip
              ./aws/install

              # Permisos Docker para el usuario ubuntu
              usermod -aG docker ubuntu
              EOF

  tags = {
    Name = var.instance_name
  }
}

# IP Elástica (Fija)
resource "aws_eip" "lb" {
  instance = aws_instance.app_server.id
}

output "public_ip" {
  value = aws_eip.lb.public_ip
}