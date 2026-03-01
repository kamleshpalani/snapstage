// ─── Shared layout wrapper ────────────────────────────────────────────────────
function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SnapStage</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="display:inline-block;background:#18181b;border-radius:10px;padding:10px 20px;">
                <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">SnapStage</span>
              </div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">
                &copy; ${new Date().getFullYear()} SnapStage &bull; AI-powered real estate staging<br />
                You received this email because you have an account at snapstage.app
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Button helper ────────────────────────────────────────────────────────────
function button(href: string, label: string, color = "#18181b") {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;padding:13px 30px;">${label}</a>
  </div>
  <p style="text-align:center;margin:0 0 8px 0;color:#71717a;font-size:12px;">
    Button not working? Copy this link:<br/>
    <a href="${href}" style="color:#3b82f6;word-break:break-all;">${href}</a>
  </p>`;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function welcomeTemplate(opts: {
  name: string;
  baseUrl: string;
}): string {
  return layout(`
    <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#18181b;">Welcome, ${opts.name}! 👋</h1>
    <p style="margin:0 0 20px 0;color:#52525b;font-size:15px;line-height:1.7;">
      You're all set! SnapStage uses cutting-edge AI to transform your empty room photos
      into beautifully staged interiors — in seconds.
    </p>
    <div style="background:#f4f4f5;border-radius:8px;padding:20px 24px;margin:0 0 24px 0;">
      <p style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:#18181b;">You start with 3 free credits:</p>
      <p style="margin:0;color:#52525b;font-size:14px;line-height:1.8;">
        ✅ Upload any room photo<br/>
        ✅ Choose a design style (Modern, Luxury, Coastal &amp; more)<br/>
        ✅ Download your staged result in seconds
      </p>
    </div>
    ${button(`${opts.baseUrl}/dashboard/new`, "Stage your first room →")}
  `);
}

export function stagingCompletedTemplate(opts: {
  name: string;
  projectName: string;
  projectUrl: string;
}): string {
  return layout(`
    <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#18181b;">Your room is staged! ✨</h1>
    <p style="margin:0 0 8px 0;color:#52525b;font-size:15px;line-height:1.7;">
      Hi ${opts.name}, your project <strong>${opts.projectName}</strong> is ready to view.
    </p>
    <p style="margin:0 0 24px 0;color:#52525b;font-size:15px;line-height:1.7;">
      Click below to see your before &amp; after comparison, download the staged image,
      and share it with clients.
    </p>
    ${button(opts.projectUrl, "View staged result →", "#2563eb")}
  `);
}

export function resetPasswordTemplate(opts: {
  name: string;
  resetUrl: string;
}): string {
  return layout(`
    <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#18181b;">Reset your password</h1>
    <p style="margin:0 0 8px 0;color:#52525b;font-size:15px;line-height:1.7;">
      Hi ${opts.name}, we received a request to reset your SnapStage password.
    </p>
    <p style="margin:0 0 24px 0;color:#52525b;font-size:15px;line-height:1.7;">
      This link expires in <strong>60 minutes</strong> and can only be used once.
    </p>
    ${button(opts.resetUrl, "Reset password →", "#dc2626")}
    <p style="margin:16px 0 0 0;color:#71717a;font-size:13px;text-align:center;">
      If you didn't request this, you can safely ignore this email.<br/>
      Your password won't change until you click the link above.
    </p>
  `);
}

export function adminNewProjectTemplate(opts: {
  userEmail: string;
  projectName: string;
  projectId: string;
  style: string;
  adminUrl: string;
}): string {
  return layout(`
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#18181b;">🏠 New project submitted</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 24px 0;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;font-size:14px;">
      <tr style="background:#f4f4f5;">
        <td style="padding:10px 16px;font-weight:600;color:#18181b;width:40%;">User</td>
        <td style="padding:10px 16px;color:#52525b;">${opts.userEmail}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-weight:600;color:#18181b;">Project</td>
        <td style="padding:10px 16px;color:#52525b;">${opts.projectName}</td>
      </tr>
      <tr style="background:#f4f4f5;">
        <td style="padding:10px 16px;font-weight:600;color:#18181b;">Style</td>
        <td style="padding:10px 16px;color:#52525b;">${opts.style}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-weight:600;color:#18181b;">Project ID</td>
        <td style="padding:10px 16px;color:#52525b;font-family:monospace;">${opts.projectId}</td>
      </tr>
    </table>
    ${button(opts.adminUrl, "View in admin panel →")}
  `);
}
