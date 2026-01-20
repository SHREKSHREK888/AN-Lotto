export interface Draw {
  id: string;
  label: string; // เช่น "งวดวันที่ 1 ก.พ. 2569"
  status: "open" | "closed";
  openedAt: string; // ISO string
  closedAt?: string; // ISO string (เมื่อปิดผลแล้ว)
  result?: {
    result2Top: string;
    result2Bottom: string;
    result3Straight: string;
    result3Tod: string[];
    closedAt: string;
  };
  // เลขอั้นสำหรับแต่ละงวด
  bannedNumbers?: {
    "2 ตัวบน"?: string[]; // เลขที่ห้ามเล่น 2 ตัวบน
    "2 ตัวล่าง"?: string[]; // เลขที่ห้ามเล่น 2 ตัวล่าง
    "3 ตัวตรง"?: string[]; // เลขที่ห้ามเล่น 3 ตัวตรง
    "3 ตัวโต๊ด"?: string[]; // เลขที่ห้ามเล่น 3 ตัวโต๊ด
    "วิ่ง"?: string[]; // เลขที่ห้ามเล่นวิ่ง
  };
  // เปอร์เซ็นต์การจ่ายสำหรับแต่ละประเภท (เป็นเปอร์เซ็นต์ เช่น 70 = 70%)
  payoutRates?: {
    "2 ตัวบน"?: number; // เปอร์เซ็นต์จ่าย 2 ตัวบน (default 70)
    "2 ตัวล่าง"?: number; // เปอร์เซ็นต์จ่าย 2 ตัวล่าง (default 70)
    "2 ตัวกลับ"?: number; // เปอร์เซ็นต์จ่าย 2 ตัวกลับ (default 70)
    "3 ตัวตรง"?: number; // เปอร์เซ็นต์จ่าย 3 ตัวตรง (default 800)
    "3 กลับ"?: number; // เปอร์เซ็นต์จ่าย 3 กลับ (default 800)
    "3 ตัวโต๊ด"?: number; // เปอร์เซ็นต์จ่าย 3 ตัวโต๊ด (default 130)
    "ชุด"?: number; // เปอร์เซ็นต์จ่ายชุด (default 130)
    "วิ่ง"?: number; // เปอร์เซ็นต์จ่ายวิ่ง (default 3)
  };
}

const CURRENT_DRAW_KEY = "current_draw_id";
const DRAWS_KEY = "lotto_draws";

export function getCurrentDrawId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_DRAW_KEY);
}

export function setCurrentDrawId(drawId: string | null): void {
  if (typeof window === "undefined") return;
  if (drawId) {
    localStorage.setItem(CURRENT_DRAW_KEY, drawId);
  } else {
    localStorage.removeItem(CURRENT_DRAW_KEY);
  }
}

export function getDraws(): Draw[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(DRAWS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveDraw(draw: Draw): void {
  const draws = getDraws();
  const index = draws.findIndex((d) => d.id === draw.id);
  if (index >= 0) {
    draws[index] = draw;
  } else {
    draws.push(draw);
  }
  localStorage.setItem(DRAWS_KEY, JSON.stringify(draws));
}

export function getDrawById(drawId: string): Draw | null {
  const draws = getDraws();
  return draws.find((d) => d.id === drawId) || null;
}

export function getCurrentDraw(): Draw | null {
  const currentId = getCurrentDrawId();
  if (!currentId) return null;
  return getDrawById(currentId);
}
