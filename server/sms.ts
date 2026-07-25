const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;
const AT_SENDER_ID = process.env.AT_SENDER_ID || "TeamBase";

function formatPhone(phone: string): string {
  return phone.startsWith("+") ? phone.substring(1) : phone;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!AT_USERNAME || !AT_API_KEY) {
    console.log("[sms] Skipping SMS - AT_USERNAME or AT_API_KEY not configured");
    console.log(`[sms] Would send to ${to}: ${message}`);
    return false;
  }

  try {
    const params = new URLSearchParams({
      username: AT_USERNAME,
      to: formatPhone(to),
      message,
    });
    if (AT_SENDER_ID) params.append("from", AT_SENDER_ID);

    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("[sms] Failed:", res.status, text);
      return false;
    }

    console.log("[sms] Sent successfully to", to);
    return true;
  } catch (err) {
    console.error("[sms] Error:", err);
    return false;
  }
}

export function sendTempPassword(phone: string, name: string, password: string): Promise<boolean> {
  const message = `Welcome to TeamBase, ${name}! Your temporary password is: ${password}. Login at https://teambase-dw8d.onrender.com and change your password in Profile settings.`;
  return sendSMS(phone, message);
}
