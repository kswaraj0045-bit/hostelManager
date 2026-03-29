import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"HostelLife" <${process.env.EMAIL_USER}>`,
      to, subject, html
    })
    console.log('Email sent to:', to)
  } catch (err) {
    console.error('Email error:', err.message)
    throw new Error('Failed to send email: ' + err.message)
  }
}

export const sendOTPEmail = async ({ to, otp, name }) => {
  await sendEmail({
    to,
    subject: 'HostelLife — Verify Your Email',
    html: `<div style="font-family:Arial,sans-serif;padding:20px;background:#f9f9f9">
      <div style="background:linear-gradient(135deg,#6C63FF,#FF6584);padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
        <h1 style="color:white;margin:0">🏠 HostelLife</h1>
      </div>
      <h2 style="color:#6C63FF">Hi ${name}! 👋</h2>
      <p>Your verification OTP is:</p>
      <h1 style="letter-spacing:8px;color:#6C63FF;background:#f0f0f0;padding:16px;border-radius:8px;text-align:center">${otp}</h1>
      <p style="color:#666;font-size:13px">Expires in 10 minutes. Do not share with anyone.</p>
    </div>`
  })
}

export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
  await sendEmail({
    to,
    subject: 'HostelLife — Reset Your Password',
    html: `<div style="font-family:Arial,sans-serif;padding:20px;background:#f9f9f9">
      <div style="background:linear-gradient(135deg,#6C63FF,#FF6584);padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
        <h1 style="color:white;margin:0">🏠 HostelLife</h1>
      </div>
      <h2 style="color:#6C63FF">Hi ${name}!</h2>
      <p>Click below to reset your password:</p>
      <a href="${resetURL}" style="display:inline-block;background:#6C63FF;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
      <p style="color:#666;font-size:13px;margin-top:16px">Expires in 15 minutes.</p>
    </div>`
  })
}