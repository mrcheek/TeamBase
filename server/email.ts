const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("[email] Skipping - RESEND_API_KEY not configured");
    console.log(`[email] Would send to ${to}: ${subject}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TeamBase <noreply@teambase.app>",
        to,
        subject,
        text: body,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("[email] Failed:", res.status, text);
      return false;
    }

    console.log("[email] Sent successfully to", to);
    return true;
  } catch (err) {
    console.error("[email] Error:", err);
    return false;
  }
}

export function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return sendEmail(
    email,
    "Welcome to TeamBase – ZRF Rugby",
    `Hi ${name},\n\nWelcome to TeamBase, the Zanzibar Rugby Federation community app!\n\nYou can now log in at https://teambase-dw8d.onrender.com using your email and password.\n\nComplete your profile to unlock all features — join clubs, check in to events, track your XP, and more.\n\nSee you on the pitch!\nTeamBase`,
  );
}
