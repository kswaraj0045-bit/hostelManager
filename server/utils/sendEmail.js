import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"HostelLife" <${process.env.EMAIL_USER}>`,
    to, subject, html
  })
  console.log('Email sent to:', to)
}

export const sendOTPEmail = async ({ to, otp, name }) => {
  await sendEmail({
    to,
    subject: 'HostelLife — Verify Your Email',
    html: `<div style="font-family:Arial,sans-serif;padding:20px">
      <h2 style="color:#6C63FF">Hi ${name}! 👋</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:8px;color:#6C63FF">${otp}</h1>
      <p>Expires in 10 minutes.</p>
    </div>`
  })
}

export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
  await sendEmail({
    to,
    subject: 'HostelLife — Reset Your Password',
    html: `<div style="font-family:Arial,sans-serif;padding:20px">
      <h2 style="color:#6C63FF">Hi ${name}!</h2>
      <p>Click below to reset your password:</p>
      <a href="${resetURL}" style="background:#6C63FF;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">Reset Password</a>
      <p>Expires in 15 minutes.</p>
    </div>`
  })
}
