export interface Draw {
  id: string;
  label: string;
  closeTimeISO: string;
}

export interface LotteryItem {
  id: string;
  type: string;
  number: string;
  amount: number;
}

export interface Slip {
  id: string;
  createdAtISO: string;
  customerName: string;
  slipNumber: string;
  totalAmount: number;
  status: "รอผล" | "ถูกรางวัล" | "ไม่ถูกรางวัล" | "จ่ายแล้ว" | "ค้างจ่าย";
  items?: LotteryItem[];
  agentId?: string; // ID of the agent to send to
  agentName?: string; // Name of the agent
  drawId?: string; // ID of the draw/period this slip belongs to
}

export interface BreakdownRow {
  typeLabel: string;
  salesAmount: number;
  payoutAmount?: number;
}

export interface HotNumber {
  number: string;
  amount: number;
}

export interface EditLog {
  timeISO: string;
  slipId: string;
  note: string;
}

export interface Alerts {
  closeCountdownText: string;
  overLimitNumbers: HotNumber[];
  edits: EditLog[];
}

// Mock data
export const mockDraws: Draw[] = [
  {
    id: "1",
    label: "งวดวันที่ 1 ก.พ. 67",
    closeTimeISO: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    label: "งวดวันที่ 16 ก.พ. 67",
    closeTimeISO: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    label: "งวดวันที่ 1 มี.ค. 67",
    closeTimeISO: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockSlips: Slip[] = [
  {
    id: "s1",
    createdAtISO: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    customerName: "สมชาย ใจดี",
    slipNumber: "LP001234",
    totalAmount: 5000,
    status: "รอผล",
  },
  {
    id: "s2",
    createdAtISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    customerName: "สมหญิง รวยดี",
    slipNumber: "LP001235",
    totalAmount: 12000,
    status: "ค้างจ่าย",
  },
  {
    id: "s3",
    createdAtISO: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    customerName: "วิชัย ชนะทุก",
    slipNumber: "LP001236",
    totalAmount: 8500,
    status: "ถูกรางวัล",
  },
  {
    id: "s4",
    createdAtISO: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    customerName: "มานะ ขยันดี",
    slipNumber: "LP001237",
    totalAmount: 3000,
    status: "จ่ายแล้ว",
  },
  {
    id: "s5",
    createdAtISO: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    customerName: "ประยุทธ์ เก่งดี",
    slipNumber: "LP001238",
    totalAmount: 6500,
    status: "ไม่ถูกรางวัล",
  },
  {
    id: "s6",
    createdAtISO: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "สุดา สวยงาม",
    slipNumber: "LP001239",
    totalAmount: 15000,
    status: "ค้างจ่าย",
  },
  {
    id: "s7",
    createdAtISO: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "ปรีชา ฉลาดดี",
    slipNumber: "LP001240",
    totalAmount: 4500,
    status: "รอผล",
  },
];

export const mockBreakdown: BreakdownRow[] = [
  {
    typeLabel: "2 ตัวบน",
    salesAmount: 125000,
    payoutAmount: 75000,
  },
  {
    typeLabel: "2 ตัวล่าง",
    salesAmount: 98000,
    payoutAmount: 62000,
  },
  {
    typeLabel: "3 ตัวตรง",
    salesAmount: 145000,
    payoutAmount: 135000,
  },
  {
    typeLabel: "3 ตัวโต๊ด",
    salesAmount: 112000,
    payoutAmount: 85000,
  },
  {
    typeLabel: "ชุด",
    salesAmount: 87000,
    payoutAmount: 45000,
  },
  {
    typeLabel: "วิ่ง",
    salesAmount: 56000,
    payoutAmount: 32000,
  },
];

export const mockHotNumbers2Top: HotNumber[] = [
  { number: "28", amount: 45000 },
  { number: "35", amount: 38000 },
  { number: "42", amount: 32000 },
  { number: "17", amount: 29000 },
  { number: "89", amount: 26000 },
  { number: "56", amount: 24000 },
  { number: "73", amount: 22000 },
  { number: "14", amount: 20000 },
  { number: "91", amount: 18000 },
  { number: "67", amount: 16000 },
];

export const mockHotNumbers2Bottom: HotNumber[] = [
  { number: "05", amount: 52000 },
  { number: "12", amount: 41000 },
  { number: "38", amount: 35000 },
  { number: "46", amount: 31000 },
  { number: "79", amount: 28000 },
  { number: "23", amount: 25000 },
  { number: "61", amount: 23000 },
  { number: "84", amount: 21000 },
  { number: "97", amount: 19000 },
  { number: "15", amount: 17000 },
];

export const mockHotNumbers3: HotNumber[] = [
  { number: "123", amount: 65000 },
  { number: "456", amount: 58000 },
  { number: "789", amount: 52000 },
  { number: "234", amount: 48000 },
  { number: "567", amount: 44000 },
  { number: "890", amount: 40000 },
  { number: "345", amount: 36000 },
  { number: "678", amount: 33000 },
  { number: "901", amount: 30000 },
  { number: "135", amount: 28000 },
];

export const mockAlerts: Alerts = {
  closeCountdownText: "2 ชั่วโมง 15 นาที",
  overLimitNumbers: [
    { number: "28", amount: 150000 },
    { number: "123", amount: 180000 },
    { number: "05", amount: 140000 },
  ],
  edits: [
    {
      timeISO: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      slipId: "LP001234",
      note: "แก้ไขจำนวนเงิน",
    },
    {
      timeISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      slipId: "LP001235",
      note: "เพิ่มเลข",
    },
    {
      timeISO: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      slipId: "LP001236",
      note: "ลบเลข",
    },
  ],
};
