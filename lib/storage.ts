import { Slip } from "./mockData";

const STORAGE_KEY = "lotto_slips";
const AGENTS_KEY = "agents";

export interface Agent {
  id: string;
  name: string;
  commissionPercent: number;
  payout2Digit?: number; // 2 ตัวจ่ายกี่บาท
  payout3Straight?: number; // 3 ตัวตรงจ่ายกี่บาท
  payout3Tod?: number; // 3 ตัวโต๊ดจ่ายกี่บาท
  createdAt: string;
  // เลขอั้นสำหรับเจ้ามือนี้
  bannedNumbers?: {
    "2 ตัวบน"?: string[];
    "2 ตัวล่าง"?: string[];
    "3 ตัวตรง"?: string[];
    "3 ตัวโต๊ด"?: string[];
    "วิ่ง"?: string[];
  };
}

export function getAgents(): Agent[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(AGENTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveSlip(slip: Slip): void {
  const existingSlips = getSlips();
  // Check if slip with same ID exists, update it, otherwise add new
  const index = existingSlips.findIndex((s) => s.id === slip.id);
  if (index >= 0) {
    existingSlips[index] = slip;
  } else {
    existingSlips.push(slip);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSlips));
}

export function getSlips(): Slip[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getSlipById(slipId: string): Slip | null {
  const storedSlips = getSlips();
  return storedSlips.find((s) => s.id === slipId) || null;
}

export function deleteSlip(slipId: string): void {
  const existingSlips = getSlips();
  const filtered = existingSlips.filter((s) => s.id !== slipId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function updateSlipStatus(slipId: string, status: Slip["status"]): void {
  const existingSlips = getSlips();
  const slip = existingSlips.find((s) => s.id === slipId);
  if (slip) {
    slip.status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSlips));
  }
}

export function updateSlipAgent(slipId: string, agentId?: string, agentName?: string): void {
  const existingSlips = getSlips();
  const slip = existingSlips.find((s) => s.id === slipId);
  if (slip) {
    slip.agentId = agentId;
    slip.agentName = agentName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSlips));
  }
}
