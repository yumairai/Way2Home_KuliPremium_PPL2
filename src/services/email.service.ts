/**
 * email.service.ts
 *
 * Layanan pengiriman email transaksional menggunakan Brevo (Sendinblue) API v3.
 * Menggunakan direct fetch REST API tanpa dependensi eksternal tambahan.
 */

export type EmailRecipient = {
  email: string;
  name?: string;
};

export type EmailDetailRow = {
  label: string;
  value: string;
};

export type EmailTemplateOptions = {
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeType?: "info" | "warning" | "success" | "danger";
  customerName?: string;
  message: string;
  details?: EmailDetailRow[];
  actionUrl?: string;
  actionText?: string;
};

export type SendEmailParams = {
  to: EmailRecipient;
  subject: string;
  htmlContent: string;
  textContent?: string;
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

const DEFAULT_SENDER_NAME = "Way2Home";
const DEFAULT_SENDER_EMAIL = "notifications@way2home.id";

/**
 * Kirim email via Brevo REST API v3
 */
export async function sendEmailViaBrevo(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME;

  if (!apiKey) {
    console.warn(
      `[email.service] BREVO_API_KEY belum dikonfigurasi di .env.local. Email "${params.subject}" untuk <${params.to.email}> tidak dikirimkan ke Brevo.`,
    );
    return {
      success: false,
      error: "BREVO_API_KEY is not configured",
    };
  }

  try {
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: params.to.email,
          name: params.to.name || "Pelanggan Way2Home",
        },
      ],
      subject: params.subject,
      htmlContent: params.htmlContent,
      ...(params.textContent ? { textContent: params.textContent } : {}),
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as {
      messageId?: string;
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      const errorMsg = data.message || `Brevo API error ${response.status}`;
      console.error(
        `[email.service] Gagal mengirim email via Brevo ke ${params.to.email}:`,
        errorMsg,
      );
      return {
        success: false,
        error: errorMsg,
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    console.error(
      `[email.service] Exception saat mengirim email via Brevo ke ${params.to.email}:`,
      errorMsg,
    );
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Buat template HTML email yang rapi, modern, dan konsisten dengan UI Way2Home.
 */
export function buildWay2HomeEmailHtml(options: EmailTemplateOptions): string {
  const badgeColors: Record<string, { bg: string; text: string }> = {
    info: { bg: "#eaf1f8", text: "#184970" },
    warning: { bg: "#fff7e6", text: "#9a6c28" },
    success: { bg: "#eef8f1", text: "#2b7040" },
    danger: { bg: "#fdeded", text: "#a32d2d" },
  };

  const badge = options.badgeType
    ? badgeColors[options.badgeType]
    : badgeColors.info;

  const detailsRows = (options.details || [])
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 38%;">
            ${escapeHtml(item.label)}
          </td>
          <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
            ${escapeHtml(item.value)}
          </td>
        </tr>
      `,
    )
    .join("");

  const detailsTable =
    options.details && options.details.length > 0
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 22px 0; border: 1px solid #e2e8f0; border-radius: 12px; border-collapse: separate; overflow: hidden; background-color: #fafbfd;">
          <tbody>
            ${detailsRows}
          </tbody>
        </table>
      `
      : "";

  const actionButton =
    options.actionUrl && options.actionText
      ? `
        <div style="text-align: center; margin: 32px 0 16px 0;">
          <a href="${options.actionUrl}" target="_blank" style="display: inline-block; background-color: #183047; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(24, 48, 71, 0.15);">
            ${escapeHtml(options.actionText)} &rarr;
          </a>
        </div>
      `
      : "";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7fb; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e5eaf0; overflow: hidden; box-shadow: 0 10px 30px rgba(12, 27, 43, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #183047; padding: 30px 36px; text-align: left;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Way<span style="color: #f59e0b;">2</span>Home</span>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-top: 4px;">Konstruksi & Hunian Modern</span>
                  </td>
                  ${
                    options.badgeText
                      ? `
                    <td align="right">
                      <span style="display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${badge.bg}; color: ${badge.text};">
                        ${escapeHtml(options.badgeText)}
                      </span>
                    </td>
                    `
                      : ""
                  }
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #183047; line-height: 1.35;">
                ${escapeHtml(options.title)}
              </h1>
              ${
                options.subtitle
                  ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">${escapeHtml(options.subtitle)}</p>`
                  : ""
              }
              
              <div style="font-size: 14px; line-height: 1.65; color: #334155; margin-top: 14px;">
                ${
                  options.customerName
                    ? `<p style="margin-top: 0; font-weight: 600;">Halo ${escapeHtml(options.customerName)},</p>`
                    : ""
                }
                <p style="margin: 12px 0;">${escapeHtml(options.message)}</p>
              </div>

              ${detailsTable}

              ${actionButton}

              <div style="border-top: 1px solid #edf2f7; margin-top: 30px; padding-top: 18px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Jika Anda memiliki pertanyaan mengenai proyek ini, Anda dapat menghubungi tim pengawas lapangan atau membalas pesan melalui dashboard proyek Anda di Way2Home.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 36px; text-align: center; border-top: 1px solid #eef2f7; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} PT Way2Home Konstruksi Indonesia. Seluruh hak cipta dilindungi.</p>
              <p style="margin: 0;">Email ini dikirim otomatis terkait status proyek pembangunan rumah Anda.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
