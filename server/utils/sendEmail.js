import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const hasPlaceholderEmailConfig = () => {
  const emailUser = process.env.EMAIL_USER || ''
  const emailPass = process.env.EMAIL_PASS || ''

  return (
    !emailUser ||
    !emailPass ||
    emailUser === 'your_gmail@gmail.com' ||
    emailPass === 'your_gmail_app_password'
  )
}

export const sendEmail = async ({ to, subject, html }) => {
  if (hasPlaceholderEmailConfig()) {
    const message = 'Email service is not configured. Update EMAIL_USER and EMAIL_PASS in server/.env with real Gmail SMTP credentials.'
    console.error('Email error:', message)
    throw new Error(message)
  }

  try {
    await transporter.sendMail({
      from: `"HostelLife" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    })
    console.log('Email sent to:', to)
  } catch (err) {
    console.error('Email error:', err.message)
    throw new Error('Failed to send email: ' + err.message)
  }
}

export const emailTemplate = (content) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F0E17;padding:20px;border-radius:12px">
  <div style="background:linear-gradient(135deg,#6C63FF,#FF6584);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
    <h1 style="color:white;margin:0;font-size:24px">🏠 HostelLife</h1>
  </div>
  <div style="background:#1C1B29;padding:24px;border-radius:12px;color:#FFFFFE;line-height:1.6">
    ${content}
  </div>
  <p style="text-align:center;color:#A7A9BE;font-size:12px;margin-top:16px">HostelLife — Manage hostel life smarter</p>
</div>`

export const sendOTPEmail = async ({ to, otp, name }) => {
  await sendEmail({
    to,
    subject: 'HostelLife — Verify Your Email',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F0E17;padding:20px;border-radius:12px">
        <div style="background:linear-gradient(135deg,#6C63FF,#FF6584);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
          <h1 style="color:white;margin:0;font-size:24px">🏠 HostelLife</h1>
        </div>
        <div style="background:#1C1B29;padding:24px;border-radius:12px;color:#FFFFFE">
          <h2 style="margin-bottom:8px">Hi ${name}! 👋</h2>
          <p style="color:#A7A9BE;margin-bottom:24px">Please verify your email address using the OTP below:</p>
          <div style="background:#252436;padding:20px;border-radius:12px;text-align:center;margin-bottom:24px">
            <p style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#6C63FF;margin:0">${otp}</p>
          </div>
          <p style="color:#A7A9BE;font-size:13px">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    `
  })
}

export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
  await sendEmail({
    to,
    subject: 'HostelLife — Reset Your Password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F0E17;padding:20px;border-radius:12px">
        <div style="background:linear-gradient(135deg,#6C63FF,#FF6584);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
          <h1 style="color:white;margin:0;font-size:24px">🏠 HostelLife</h1>
        </div>
        <div style="background:#1C1B29;padding:24px;border-radius:12px;color:#FFFFFE">
          <h2 style="margin-bottom:8px">Hi ${name}! 👋</h2>
          <p style="color:#A7A9BE;margin-bottom:24px">You requested to reset your password. Click the button below:</p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${resetURL}" style="background:linear-gradient(135deg,#6C63FF,#FF6584);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">Reset Password</a>
          </div>
          <p style="color:#A7A9BE;font-size:13px">This link expires in 15 minutes. If you did not request this ignore this email.</p>
        </div>
      </div>
    `
  })
}
