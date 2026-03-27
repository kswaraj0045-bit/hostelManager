import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: 'HostelLife <onboarding@resend.dev>',
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
          <p style="color:#A7A9BE;margin-bottom:24px">Please verify your email using the OTP below:</p>
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
          <p style="color:#A7A9BE;margin-bottom:24px">Click the button below to reset your password:</p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${resetURL}" style="background:linear-gradient(135deg,#6C63FF,#FF6584);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">Reset Password</a>
          </div>
          <p style="color:#A7A9BE;font-size:13px">This link expires in 15 minutes.</p>
        </div>
      </div>
    `
  })
}
```

---

## Step 4 — Add to Render Environment Variables
```
RESEND_API_KEY = re_8NVGYo11_2mAffNfz4kb4HjJsgJNjrMA7