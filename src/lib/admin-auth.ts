import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const passwordInput = process.env.ADMIN_PASSWORD;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!passwordHash && !passwordInput) {
    throw new Error("ADMIN_PASSWORD_HASH or ADMIN_PASSWORD must be set");
  }

  return { username, passwordInput, passwordHash };
}
