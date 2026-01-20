export interface ActivityLog {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  description: string;
  details?: any;
  timestamp: string;
  ipAddress?: string;
}

const ACTIVITY_LOG_KEY = "lotto_activity_logs";

export function logActivity(
  action: string,
  description: string,
  details?: any,
  userId?: string,
  username?: string
): void {
  if (typeof window === "undefined") return;

  const authData = localStorage.getItem("auth");
  let currentUserId = userId;
  let currentUsername = username;

  if (!currentUserId || !currentUsername) {
    try {
      const auth = JSON.parse(authData || "{}");
      currentUserId = auth.userId || "unknown";
      currentUsername = auth.username || "unknown";
    } catch {
      currentUserId = "unknown";
      currentUsername = "unknown";
    }
  }

  const log: ActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: currentUserId,
    username: currentUsername,
    action,
    description,
    details,
    timestamp: new Date().toISOString(),
  };

  const existingLogs = getActivityLogs();
  existingLogs.unshift(log); // Add to beginning

  // Keep only last 1000 logs
  const logsToKeep = existingLogs.slice(0, 1000);
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logsToKeep));
}

export function getActivityLogs(): ActivityLog[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(ACTIVITY_LOG_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function clearActivityLogs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVITY_LOG_KEY);
}
