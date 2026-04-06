import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const fromName = process.env.RESEND_FROM_NAME || 'GRC Openings';
  const fromAddress = process.env.RESEND_FROM_ADDRESS || 'onboarding@resend.dev';

  await resend.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject: 'Verify your GRC Openings account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#0b1120;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1120;padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#141c2f;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,0.12);">
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(148,163,184,0.08);">
                      <div style="width:56px;height:56px;background:rgba(0,196,164,0.12);border:1.5px solid rgba(0,196,164,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                        <span style="font-size:24px;">&#9993;</span>
                      </div>
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.02em;">Verify your email</h1>
                      <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;line-height:1.5;">Enter the code below in the GRC Openings app</p>
                    </td>
                  </tr>
                  <!-- OTP -->
                  <tr>
                    <td style="padding:32px 40px;text-align:center;">
                      <p style="margin:0 0 16px;font-size:13px;font-weight:600;letter-spacing:0.08em;color:#64748b;text-transform:uppercase;">Your verification code</p>
                      <div style="display:inline-block;background:rgba(0,196,164,0.08);border:1.5px solid rgba(0,196,164,0.25);border-radius:12px;padding:16px 32px;">
                        <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#00D4B2;">${otp}</span>
                      </div>
                      <p style="margin:20px 0 0;font-size:13px;color:#64748b;">This code expires in <strong style="color:#94a3b8;">10 minutes</strong>.</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid rgba(148,163,184,0.08);">
                      <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                        If you didn't create a GRC Openings account, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const fromName = process.env.RESEND_FROM_NAME || 'GRC Openings';
  const fromAddress = process.env.RESEND_FROM_ADDRESS || 'onboarding@resend.dev';

  await resend.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject: 'Reset your GRC Openings password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#0b1120;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1120;padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#141c2f;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,0.12);">
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(148,163,184,0.08);">
                      <div style="width:56px;height:56px;background:rgba(0,196,164,0.12);border:1.5px solid rgba(0,196,164,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                        <span style="font-size:24px;">&#128274;</span>
                      </div>
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.02em;">Reset your password</h1>
                      <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;line-height:1.5;">Click the button below to choose a new password</p>
                    </td>
                  </tr>
                  <!-- CTA -->
                  <tr>
                    <td style="padding:32px 40px;text-align:center;">
                      <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;">This link expires in <strong style="color:#94a3b8;">1 hour</strong> and can only be used once.</p>
                      <a href="${resetLink}" style="display:inline-block;background:#00D4B2;color:#03120f;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;padding:14px 32px;letter-spacing:0.01em;">Reset Password</a>
                      <p style="margin:24px 0 0;font-size:12px;color:#475569;">Or copy this link into your browser:<br/><span style="color:#64748b;word-break:break-all;">${resetLink}</span></p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid rgba(148,163,184,0.08);">
                      <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                        If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
