import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, message }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: message,
  });

  console.log('Email sent successfully ✅');
};
export default sendEmail;
