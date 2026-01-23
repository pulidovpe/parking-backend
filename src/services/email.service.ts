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
  },

  // Recibo de Pago
  async sendPaymentReceipt(to: string, userName: string, amount: number, currency: string, reference: string) {
    const { transporter } = await createTransporter();

    const info = await transporter.sendMail({
      from: '"Parking App 🚗" <pagos@parkingapp.com>',
      to,
      subject: "Pago Recibido Exitosamente 💸",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #27ae60;">¡Pago Procesado!</h2>
          <p>Hola ${userName}, hemos recibido tu pago correctamente.</p>
          <hr>
          <p><strong>Detalles de la transacción:</strong></p>
          <ul>
            <li>💰 Monto: ${amount} ${currency}</li>
            <li>🔖 Referencia: ${reference}</li>
            <li>✅ Estado: VERIFIED</li>
          </ul>
          <p>Gracias por usar Parking App.</p>
        </div>
      `,
    });

    console.log("📧 [EMAIL] Pago enviado: %s", info.messageId);
    console.log("🔗 [PREVIEW] Ver correo: %s", require('nodemailer').getTestMessageUrl(info));
  },

  // Recordatorio de Reserva (30 min antes)
  async sendReminderEmail(to: string, userName: string, parkingName: string, startTime: Date) {
    const { transporter } = await createTransporter();

    const info = await transporter.sendMail({
      from: '"Parking App 🚗" <alertas@parkingapp.com>',
      to,
      subject: "⏳ Tu reserva comienza en 30 minutos",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border-left: 4px solid #f39c12;">
          <h2 style="color: #e67e22;">Recordatorio de Reserva</h2>
          <p>Hola ${userName}, te recordamos que tu reserva en <strong>${parkingName}</strong> está próxima.</p>
          <p><strong>Hora de inicio:</strong> ${startTime.toLocaleTimeString()}</p>
          <p>Por favor, llega a tiempo para asegurar tu espacio.</p>
        </div>
      `,
    });

    console.log("📧 [EMAIL] Recordatorio enviado: %s", info.messageId);
    console.log("🔗 [PREVIEW] Ver correo: %s", require('nodemailer').getTestMessageUrl(info));
  },

  // Alerta de Tiempo por Vencer (15 min antes de salir)
  async sendExpirationWarning(to: string, userName: string, parkingName: string, endTime: Date) {
    const { transporter } = await createTransporter();

    const info = await transporter.sendMail({
      from: '"Parking App 🚗" <alertas@parkingapp.com>',
      to,
      subject: "⚠️ Tu tiempo está por terminar",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border-left: 4px solid #e74c3c;">
          <h2 style="color: #c0392b;">Tu reserva finaliza pronto</h2>
          <p>Hola ${userName}, tu tiempo en <strong>${parkingName}</strong> termina en 15 minutos.</p>
          <p><strong>Hora límite:</strong> ${endTime.toLocaleTimeString()}</p>
          <p>Por favor, dirígete a tu vehículo para evitar cargos adicionales.</p>
        </div>
      `,
    });

    console.log("📧 [EMAIL] Alerta de vencimiento enviada: %s", info.messageId);
    console.log("🔗 [PREVIEW] Ver correo: %s", require('nodemailer').getTestMessageUrl(info));
  },

  // Correo de Verificación
  async sendVerificationEmail(to: string, name: string, token: string) {
    const { transporter } = await createTransporter();
    
    // En producción, esto sería el dominio real (ej: https://parkingapp.com/verify?token=...)
    // Para desarrollo local usaremos localhost
    const verificationLink = `http://localhost:3000/api/auth/verify?token=${token}`;

    const info = await transporter.sendMail({
      from: '"Parking App 🚗" <security@parkingapp.com>',
      to,
      subject: "Verifica tu cuenta 🔐",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hola ${name}, bienvenido.</h2>
          <p>Para activar tu cuenta, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
          <a href="${verificationLink}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar Email</a>
          <p>O copia este enlace: ${verificationLink}</p>
          <p>Este enlace es válido por 24 horas.</p>
        </div>
      `,
    });

    console.log("📧 [EMAIL] Verificación enviada: %s", info.messageId);
    console.log("🔗 [PREVIEW] Ver correo: %s", require('nodemailer').getTestMessageUrl(info));
  },

  // Email de Recuperación de Contraseña
  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const { transporter } = await createTransporter();
    
    // En la app, esto apuntaría a una pantalla del Frontend (ej: parkingapp.com/reset-password?token=...)
    // Por ahora usamos una URL simulada
    const resetLink = `http://localhost:3000/api/auth/reset-password-form?token=${token}`;

    const info = await transporter.sendMail({
      from: '"Parking App 🔒" <security@parkingapp.com>',
      to,
      subject: "Recupera tu contraseña 🔑",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hola ${name},</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Usa el siguiente token o haz clic en el enlace:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 20px; letter-spacing: 2px;">
            <strong>${token}</strong>
          </div>
          <p><a href="${resetLink}">Restablecer contraseña</a></p>
          <p>Este enlace expira en 1 hora.</p>
          <p>Si no fuiste tú, ignora este correo.</p>
        </div>
      `,
    });

    console.log("📧 [EMAIL] Reset Password enviado: %s", info.messageId);
    console.log("🔗 [PREVIEW] Ver correo: %s", require('nodemailer').getTestMessageUrl(info));
  }
};