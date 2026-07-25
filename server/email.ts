import { execFile } from "child_process";
import { promisify } from "util";
import { accessSync, mkdtempSync, writeFileSync, constants } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execFileAsync = promisify(execFile);

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || "587";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || "noreply@teambase.app";

function himalayaPath(): string {
  const home = process.env.HOME || "/tmp";
  const candidates = [
    join(home, ".local", "bin", "himalaya"),
    "/usr/local/bin/himalaya",
    "/usr/bin/himalaya",
  ];
  for (const p of candidates) {
    try {
      accessSync(p, constants.X_OK);
      return p;
    } catch {}
  }
  return "himalaya";
}

function tomlStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildConfig(tmpDir: string): string {
  const pwFile = join(tmpDir, "password");
  writeFileSync(pwFile, SMTP_PASSWORD || "");
  return [
    `[accounts.teambase]`,
    `default = true`,
    `display-name = "TeamBase"`,
    `email = "${tomlStr(FROM_EMAIL)}"`,
    `sender = "${tomlStr(FROM_EMAIL)}"`,
    ``,
    `[accounts.teambase.smtp]`,
    `host = "${tomlStr(SMTP_HOST || "")}"`,
    `port = ${SMTP_PORT}`,
    `starttls = true`,
    `login = "${tomlStr(SMTP_USER || "")}"`,
    `password.command = ["cat", "${tomlStr(pwFile)}"]`,
  ].join("\n");
}

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.log("[email] Skipping - SMTP_HOST, SMTP_USER, or SMTP_PASSWORD not configured");
    console.log(`[email] Would send to ${to}: ${subject}`);
    return false;
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "teambase-himalaya-"));
  writeFileSync(join(tmpDir, "config.toml"), buildConfig(tmpDir));

  const rawMessage = [
    `From: TeamBase <${FROM_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ];

  try {
    await execFileAsync(himalayaPath(), [
      "--config", join(tmpDir, "config.toml"),
      "message", "send",
      ...rawMessage,
    ]);
    console.log("[email] Sent successfully to", to);
    return true;
  } catch (err: any) {
    console.error("[email] Error:", err.stderr || err.message);
    return false;
  }
}

export function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return sendEmail(
    email,
    "Welcome to TeamBase – ZRF Rugby",
    `Hi ${name},

Welcome to TeamBase, the Zanzibar Rugby Federation community app!

You can now log in at https://teambase-dw8d.onrender.com using your email and password.

Complete your profile to unlock all features — join clubs, check in to events, track your XP, and more.

See you on the pitch!
TeamBase`,
  );
}
