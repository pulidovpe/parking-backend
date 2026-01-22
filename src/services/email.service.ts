import { createTransporter } from '../config/mailer';

export const emailService = {
  
  // 1. Email de Bienvenida (Al registrarse)
  async sendWelcomeEmail(to: string, name: string) {
    const { transporter } = await createTransporter();

    const info = await transporter.sendMail({
      from: '"Parking App 🚗" <no-reply@parkingapp.com>',
      to,
      subject: "¡Bienvenido a Parking App! 🎉",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #2c3e50;">Hola, ${name} 👋</h1>
          <p>Tu cuenta ha sido creada exitosamente.</p>
          <p>Ya puedes empezar a reservar estacionamientos de forma inteligente.</p>
        </div>
      `,
    });

    console.log("📧 [EMAIL] Welcome enviado: %s", info.messageId);
    // IMPORTANTE: Esta URL te permitirá ver el correo en tu navegador
    console.log("🔗 [PREVIEW] Ver correo: %s", require('nodemailer').getTestMessageUrl(info));
  },

  // 2. Email de Confirmación (Al crear reserva)
  async sendReservationConfirmation(to: string, parkingName: string, date: Date, total: number) {
    const { transporter } = await createTransporter();

    const info = await transporter.sendMail({
      from: '"Parking App 🚗" <reservas@parkingapp.com>',
      to,
      subject: "Reserva Confirmada ✅",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #27ae60;">¡Tu espacio está reservado!</h2>
          <p>Detalles de tu reserva en <strong>${parkingName}</strong>:</p>
          <ul>
            <li>📅 Fecha: ${date.toLocaleString()}</li>
            <li>💰 Costo Estimado: $${total}</li>
          </ul>
        </div>
      `,
    });
    
    console.log("📧 [EMAIL] Reserva enviada: %s", info.messageId);
    console.log("🔗 [PREVIEW] Ver correo: %s", require('nodemailer').getTestMessageUrl(info));
  }
};