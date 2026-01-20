export interface AuthData {
  username: string;
  originalUsername?: string;
  role?: "admin" | "user";
  memberId?: string;
  isAuthenticated: boolean;
  loginTime: string;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  
  const authData = localStorage.getItem("auth");
  if (!authData) return false;

  try {
    const parsed: AuthData = JSON.parse(authData);
    return parsed.isAuthenticated === true;
  } catch {
    return false;
  }
}

export function getAuthData(): AuthData | null {
  if (typeof window === "undefined") return null;
  
  const authData = localStorage.getItem("auth");
  if (!authData) return null;

  try {
    return JSON.parse(authData) as AuthData;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth");
  window.location.href = "/login";
}
