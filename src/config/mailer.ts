import nodemailer from 'nodemailer';

// Configuración para entorno de pruebas (Ethereal)
export const createTransporter = async () => {
  // Genera una cuenta de prueba temporal si no tienes credenciales reales
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass, 
    },
  });

  return { transporter, testAccount };
};