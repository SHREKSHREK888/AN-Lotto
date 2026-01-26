import { Slip, LotteryItem } from "./mockData";
import { Agent, BannedNumberLimit } from "./storage";
import { Draw } from "./draw";

// Check if a lottery item wins based on result
export function checkItemWin(item: LotteryItem, result: Draw["result"]): boolean {
  if (!result || !item) return false;

  const number = item.number;
  let isWin = false;

  switch (item.type) {
    case "2 ตัวบน":
      // Match with result2Top
      if (result.result2Top) {
        if (number.padStart(2, "0") === result.result2Top.padStart(2, "0")) {
          isWin = true;
        }
      }
      break;
    case "2 ตัวล่าง":
      // Match with result2Bottom
      if (result.result2Bottom) {
        if (number.padStart(2, "0") === result.result2Bottom.padStart(2, "0")) {
          isWin = true;
        }
      }
      break;
    case "3 ตัวตรง":
    case "3 ตัวบน":
      if (number.padStart(3, "0") === result.result3Straight) {
        isWin = true;
      }
      break;
    case "3 กลับ":
      // 3 กลับ means reverse of 3 ตัวตรง
      if (number.padStart(3, "0") === result.result3Straight.split("").reverse().join("")) {
        isWin = true;
      }
      break;
    case "3 ตัวโต๊ด":
    case "ชุด":
      // Check if all 3 digits of the number match any permutation of result3Tod
      if (number.length === 3) {
        const digits = number.split("").map(d => d.trim()).filter(d => d);
        const resultDigits = result.result3Tod.map(d => d.trim()).filter(d => d);
        
        if (digits.length === 3 && resultDigits.length === 3) {
          const allDigitsMatch = digits.every(d => resultDigits.includes(d));
          const countsMatch = digits.every(d => {
            const countInNumber = digits.filter(x => x === d).length;
            const countInResult = resultDigits.filter(x => x === d).length;
            return countInNumber <= countInResult;
          });
          if (allDigitsMatch && countsMatch) {
            isWin = true;
          }
        }
      }
      break;
    case "2 ตัวกลับ":
    case "2 กลับ (3 ตัว)":
      // 2 ตัวกลับ means reverse of last 2 digits
      if (result.result3Straight.length >= 2) {
        const last2 = result.result3Straight.slice(-2);
        const reversed = last2.split("").reverse().join("");
        if (number.padStart(2, "0") === reversed) {
          isWin = true;
        }
      }
      break;
    case "วิ่ง":
    case "วิ่งบน":
    case "วิ่งล่าง":
      // Check if any digit in the number appears in any result
      if (number.length >= 1) {
        const allResults = [
          result.result2Top,
          result.result2Bottom,
          result.result3Straight,
          ...result.result3Tod,
        ].join("");
        const numberDigits = number.split("");
        if (numberDigits.some(d => allResults.includes(d))) {
          isWin = true;
        }
      }
      break;
  }

  return isWin;
}

/**
 * Calculate payout for a single item considering banned numbers
 * 
 * Rules:
 * - Normal numbers: use baseRate (full rate)
 * - Banned numbers: use baseRate * (payoutPercent / 100)
 * - payoutPercent comes from limits
 * - Must normalize numbers before comparison
 * 
 * Example:
 * - 2 ตัวบน baseRate = 70
 * - Banned number 50%
 * - Bet amount = 100
 * → finalRate = 70 * (50 / 100) = 35
 * → payout = 100 * 35 = 3500
 */
export function calculateItemPayout(
  item: LotteryItem,
  result: Draw["result"],
  agent: Agent | null,
  draw: Draw | null
): number {
  if (!result || !checkItemWin(item, result)) return 0;

  let baseRate = 0;

  // Step 1: Get base rate (Priority: 1. Draw payout rates, 2. Agent payout rates, 3. Default)
  if (draw?.payoutRates) {
    switch (item.type) {
      case "2 ตัวบน":
        baseRate = draw.payoutRates["2 ตัวบน"] || agent?.payout2Digit || 70;
        break;
      case "2 ตัวล่าง":
        baseRate = draw.payoutRates["2 ตัวล่าง"] || agent?.payout2Digit || 70;
        break;
      case "2 ตัวกลับ":
      case "2 กลับ (3 ตัว)":
        baseRate = draw.payoutRates["2 ตัวกลับ"] || agent?.payout2Digit || 70;
        break;
      case "3 ตัวตรง":
      case "3 ตัวบน":
        baseRate = draw.payoutRates["3 ตัวตรง"] || agent?.payout3Straight || 800;
        break;
      case "3 กลับ":
        baseRate = draw.payoutRates["3 กลับ"] || agent?.payout3Straight || 800;
        break;
      case "3 ตัวโต๊ด":
        baseRate = draw.payoutRates["3 ตัวโต๊ด"] || agent?.payout3Tod || 130;
        break;
      case "ชุด":
        baseRate = draw.payoutRates["ชุด"] || agent?.payout3Tod || 130;
        break;
      case "วิ่ง":
      case "วิ่งบน":
      case "วิ่งล่าง":
        baseRate = draw.payoutRates["วิ่ง"] || 3;
        break;
      default:
        baseRate = 0;
    }
  } else {
    // Fallback to agent or default rates
    switch (item.type) {
      case "2 ตัวบน":
      case "2 ตัวล่าง":
      case "2 ตัวกลับ":
      case "2 กลับ (3 ตัว)":
        baseRate = agent?.payout2Digit || 70;
        break;
      case "3 ตัวตรง":
      case "3 ตัวบน":
      case "3 กลับ":
        baseRate = agent?.payout3Straight || 800;
        break;
      case "3 ตัวโต๊ด":
      case "ชุด":
        baseRate = agent?.payout3Tod || 130;
        break;
      case "วิ่ง":
      case "วิ่งบน":
      case "วิ่งล่าง":
        baseRate = 3;
        break;
      default:
        baseRate = 0;
    }
  }

  // Step 2: Apply banned number adjustment if applicable
  let finalRate = baseRate;

  // Check if number is banned and has payout percent limit
  if (agent && agent.bannedNumbers) {
    let limits: BannedNumberLimit[] | undefined;
    const checkNumber = item.number;

    // Map item type to banned category
    switch (item.type) {
      case "2 ตัวบน":
        limits = agent.bannedNumbers["2 ตัวบน"];
        break;
      case "2 ตัวล่าง":
        limits = agent.bannedNumbers["2 ตัวล่าง"];
        break;
      case "3 ตัวตรง":
      case "3 ตัวบน":
      case "3 กลับ":
        limits = agent.bannedNumbers["3 ตัวตรง"];
        break;
      case "3 ตัวโต๊ด":
      case "ชุด":
        limits = agent.bannedNumbers["3 ตัวโต๊ด"];
        break;
      case "วิ่ง":
      case "วิ่งบน":
      case "วิ่งล่าง":
        limits = agent.bannedNumbers["วิ่ง"];
        break;
    }

    if (limits && Array.isArray(limits)) {
      for (const limit of limits) {
        if (limit.numbers) {
          // Normalize numbers for comparison (CRITICAL: must match normalization logic)
          let normalizedCheckNumber: string;
          let normalizedBannedNumbers: string[];
          
          // Normalize based on item type
          switch (item.type) {
            case "2 ตัวบน":
            case "2 ตัวล่าง":
            case "2 ตัวกลับ":
            case "2 กลับ (3 ตัว)":
              normalizedCheckNumber = checkNumber.padStart(2, "0");
              normalizedBannedNumbers = limit.numbers.map(n => n.padStart(2, "0"));
              break;
            case "3 ตัวตรง":
            case "3 ตัวบน":
            case "3 กลับ":
            case "3 ตัวโต๊ด":
            case "ชุด":
              normalizedCheckNumber = checkNumber.padStart(3, "0");
              normalizedBannedNumbers = limit.numbers.map(n => n.padStart(3, "0"));
              break;
            case "วิ่ง":
            case "วิ่งบน":
            case "วิ่งล่าง":
              // For running numbers, compare as-is
              normalizedCheckNumber = checkNumber;
              normalizedBannedNumbers = limit.numbers;
              break;
            default:
              normalizedCheckNumber = checkNumber;
              normalizedBannedNumbers = limit.numbers;
          }
          
          // Check if this number matches a banned number
          if (normalizedBannedNumbers.includes(normalizedCheckNumber)) {
            if (limit.payoutPercent !== undefined) {
              // Apply banned number adjustment: baseRate * (payoutPercent / 100)
              // Example: baseRate = 70, payoutPercent = 50 → finalRate = 70 * (50 / 100) = 35
              finalRate = baseRate * (limit.payoutPercent / 100);
            }
            break; // Found matching banned number, stop searching
          }
        }
      }
    }
  }

  // Step 3: Calculate final payout = amount * finalRate
  return item.amount * finalRate;
}

// Calculate total payout for a slip
export function calculateSlipPayout(
  slip: Slip,
  result: Draw["result"],
  agent: Agent | null,
  draw: Draw | null
): number {
  if (!slip.items || !result) return 0;

  let totalPayout = 0;
  slip.items.forEach((item) => {
    totalPayout += calculateItemPayout(item, result, agent, draw);
  });

  return totalPayout;
}
