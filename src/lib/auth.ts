// Authentication library setup
// This file will house auth-related helper functions

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  activated: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

export async function signIn(email: string, activationCode: string): Promise<LoginResponse> {
  try {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, activationCode }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: "An error occurred during sign in",
    };
  }
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/signout", { method: "POST" });
}
