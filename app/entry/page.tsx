"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Save, Receipt, RotateCcw, Send } from "lucide-react";
import { saveSlip, getAgents, Agent } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { LotteryItem } from "@/lib/mockData";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentDraw, getDrawById } from "@/lib/draw";
import { logActivity } from "@/lib/activity-log";

export default function EntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [slipNumber, setSlipNumber] = useState("");
  const [items, setItems] = useState<LotteryItem[]>([]);
  const [activeTab, setActiveTab] = useState("3straight");
  const [gameType, setGameType] = useState<"3ตัว" | "2ตัว" | "เลขวิ่ง">("3ตัว"); // Main game type selection
  
  // Add new states for running types
  const [numberRunningTop, setNumberRunningTop] = useState("");
  const [amountRunningTop, setAmountRunningTop] = useState("");
  const [numberRunningBottom, setNumberRunningBottom] = useState("");
  const [amountRunningBottom, setAmountRunningBottom] = useState("");
  
  // Add state for 2 ตัวกลับ
  const [number2Reverse, setNumber2Reverse] = useState("");
  const [amount2Reverse, setAmount2Reverse] = useState("");
  
  // Add state for 3 ตัวกลับ (separate from straight reverse)
  const [number3Reverse, setNumber3Reverse] = useState("");
  const [amount3Reverse, setAmount3Reverse] = useState("");
  
  // Add state for 2 กลับ in 3 ตัว section
  const [number2ReverseIn3, setNumber2ReverseIn3] = useState("");
  const [amount2ReverseIn3, setAmount2ReverseIn3] = useState("");
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentDraw, setCurrentDraw] = useState<any>(null);

  // Check authentication and current draw on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
      // Check if there's an open draw
      const draw = getCurrentDraw();
      if (!draw || draw.status !== "open") {
        toast({
          variant: "destructive",
          title: "ไม่สามารถคีย์หวยได้",
          description: "กรุณาเปิดงวดก่อนคีย์หวย",
          duration: 5000,
        });
        setTimeout(() => {
          router.push("/draws");
        }, 2000);
      } else {
        setCurrentDraw(draw);
        // Load agents
        const loadedAgents = getAgents();
        setAgents(loadedAgents);
      }
    }
  }, [router, toast]);

  // Current input states
  const [number2Top, setNumber2Top] = useState("");
  const [amount2Top, setAmount2Top] = useState("");
  const [reverse2TopManual, setReverse2TopManual] = useState(false);
  const [number2Bottom, setNumber2Bottom] = useState("");
  const [amount2Bottom, setAmount2Bottom] = useState("");
  const [reverse2BottomManual, setReverse2BottomManual] = useState(false);
  
  
  const [number3Straight, setNumber3Straight] = useState("");
  const [amount3Straight, setAmount3Straight] = useState("");
  const [amount3StraightQuick, setAmount3StraightQuick] = useState(""); // Quick entry amount
  const [reverseStraight, setReverseStraight] = useState<"ไม่กลับ" | "3 กลับ" | "6 กลับ">("ไม่กลับ"); // กลับ
  const [quickEntry3Straight, setQuickEntry3Straight] = useState(""); // Quick entry
  const [quickEntry2Top, setQuickEntry2Top] = useState("");
  const [quickEntry2Bottom, setQuickEntry2Bottom] = useState("");
  const [quickEntry3Tod, setQuickEntry3Tod] = useState("");
  const [quickEntrySet, setQuickEntrySet] = useState("");
  const [quickEntryRunning, setQuickEntryRunning] = useState("");
  const [number3Tod, setNumber3Tod] = useState("");
  const [amount3Tod, setAmount3Tod] = useState("");
  const [reverseTod, setReverseTod] = useState(false); // กลับ
  const [numberSet, setNumberSet] = useState("");
  const [amountSet, setAmountSet] = useState("");
  const [reverseSet, setReverseSet] = useState(false);
  const [numberRunning, setNumberRunning] = useState("");
  const [amountRunning, setAmountRunning] = useState("");

  // Helper function to reverse a number string
  const reverseNumber = (num: string): string => {
    return num.split("").reverse().join("");
  };


  // Helper function to generate all permutations of 3 digits (6 combinations)
  const generatePermutations = (num: string): string[] => {
    if (num.length !== 3) return [num];
    
    const digits = num.split("");
    const permutations: string[] = [];
    const used: boolean[] = [false, false, false];
    
    const backtrack = (current: string[]) => {
      if (current.length === 3) {
        const perm = current.join("");
        if (!permutations.includes(perm)) {
          permutations.push(perm);
        }
        return;
      }
      
      for (let i = 0; i < 3; i++) {
        if (!used[i]) {
          used[i] = true;
          current.push(digits[i]);
          backtrack(current);
          current.pop();
          used[i] = false;
        }
      }
    };
    
    backtrack([]);
    return permutations;
  };

  // Helper function to generate 2-digit reverse from 3-digit number
  // "2 กลับ" หมายถึง เลข 2 ตัว แต่กลับ 2 ครั้งในเลข 3 ตัว
  // กลับ 1 ครั้ง: 35 -> 53, 36 -> 63, 56 -> 65
  // กลับ 2 ครั้ง: 53 -> 35 (กลับมาเหมือนเดิม)
  // ดังนั้น "2 กลับ 2 ครั้ง" = เลือก 2 หลักจาก 3 หลัก (เลขเดิม)
  // Example: 356 -> เลือก (3,5), (3,6), (5,6) -> 35, 36, 56
  const generate2ReverseFrom3Digits = (num: string): string[] => {
    if (num.length !== 3) return [];
    
    const digits = num.split("");
    const pairs: string[] = [];
    
    // Generate all 2-digit pairs from 3 digits: (0,1), (0,2), (1,2)
    // "2 กลับ 2 ครั้ง" = เลือก 2 หลักจาก 3 หลัก (เลขเดิม)
    // เพราะกลับ 2 ครั้ง = กลับมาเหมือนเดิม
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        // เลือกคู่ 2 หลัก: เช่น 35 จาก 356
        const pair = digits[i] + digits[j];
        
        // เพิ่มเลขเดิมเท่านั้น (เพราะกลับ 2 ครั้ง = กลับมาเหมือนเดิม)
        if (!pairs.includes(pair)) {
          pairs.push(pair);
        }
      }
    }
    
    return pairs;
  };

  // Parse quick entry format: "445 50x50x50 เท่ากลับ 3 กลับ"
  const parseQuickEntry = (input: string): {
    number: string;
    amounts: number[];
    reverseCount: number;
  } | null => {
    const trimmed = input.trim();
    
    // Pattern: number amountPattern "เท่ากลับ" reverseCount "กลับ"
    // Example: "445 50x50x50 เท่ากลับ 3 กลับ"
    const match = trimmed.match(/^(\d+)\s+([\dxX]+)\s+เท่ากลับ\s+(\d+)\s+กลับ$/);
    if (match) {
      const number = match[1];
      const amountPattern = match[2];
      const reverseCount = parseInt(match[3]);
      
      // Parse amounts: "50x50x50" or "50X50X50" -> [50, 50, 50]
      const amounts = amountPattern.split(/[xX]/).map(a => parseFloat(a.trim())).filter(a => !isNaN(a));
      
      if (amounts.length > 0 && reverseCount > 0 && reverseCount <= 6) {
        return { number, amounts, reverseCount };
      }
    }
    
    // Pattern: number amountPattern (simpler version)
    // Example: "445 50x50x50"
    const simpleMatch = trimmed.match(/^(\d+)\s+([\dxX]+)$/);
    if (simpleMatch) {
      const number = simpleMatch[1];
      const amountPattern = simpleMatch[2];
      const amounts = amountPattern.split(/[xX]/).map(a => parseFloat(a.trim())).filter(a => !isNaN(a));
      
      if (amounts.length > 0) {
        return { number, amounts, reverseCount: amounts.length };
      }
    }
    
    return null;
  };

  const addItem = (
    type: string, 
    number: string, 
    amount: string, 
    reverse: boolean = false,
    quickEntryInput?: string // New parameter for quick entry
  ) => {
    // Check for quick entry format first
    if (quickEntryInput) {
      const parsed = parseQuickEntry(quickEntryInput);
      if (parsed) {
        const { number: parsedNumber, amounts, reverseCount } = parsed;
        
        // Generate permutations
        let numbersToAdd: string[] = [];
        if (parsedNumber.length === 3) {
          const permutations = generatePermutations(parsedNumber);
          numbersToAdd = [...new Set(permutations)].slice(0, reverseCount);
        } else if (parsedNumber.length === 2) {
          numbersToAdd = [parsedNumber];
          const reversed = reverseNumber(parsedNumber);
          if (reversed !== parsedNumber && numbersToAdd.length < reverseCount) {
            numbersToAdd.push(reversed);
          }
        } else {
          numbersToAdd = [parsedNumber];
        }
        
        // Create items with individual amounts
        const newItems: LotteryItem[] = numbersToAdd.map((num, index) => ({
          id: `${Date.now()}-${index}`,
          type,
          number: num,
          amount: amounts[index] || amounts[amounts.length - 1] || parseFloat(amount) || 0,
        }));
        
        setItems([...items, ...newItems]);
        toast({
          variant: "success",
          title: "เพิ่มสำเร็จ",
          description: `เพิ่มเลข ${numbersToAdd.length} หมายเลข (${numbersToAdd.join(", ")})`,
        });
        
        // Reset inputs
        setNumber3Straight("");
        setAmount3Straight("");
        setReverseStraight("ไม่กลับ");
        return;
      }
    }
    
    if (!number || !amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกเลขและจำนวนเงิน",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    let numbersToAdd: string[] = [number];

    // Handle reverse option for 3 straight (3 กลับ or 6 กลับ)
    // This is passed as reverseCount parameter
    if (typeof reverse === 'object' && reverse !== null && 'reverseCount' in reverse) {
      const reverseCount = (reverse as any).reverseCount;
      if (number.length === 3 && reverseCount > 0) {
        const permutations = generatePermutations(number);
        numbersToAdd = [...new Set(permutations)].slice(0, reverseCount);
      }
    } else if (reverse) {
      // Handle reverse - generate all permutations but max 6 (legacy support)
      if (number.length === 3) {
        // For 3-digit numbers, generate all permutations (max 6)
        const permutations = generatePermutations(number);
        numbersToAdd = [...new Set(permutations)].slice(0, 6); // Max 6 patterns
      } else if (number.length === 2) {
        // For 2-digit numbers, just reverse
        const reversed = reverseNumber(number);
        if (reversed !== number) {
          numbersToAdd.push(reversed);
        }
      }
    }

    // Create items for each number (each number gets the same amount)
    const newItems: LotteryItem[] = numbersToAdd.map((num, index) => ({
      id: `${Date.now()}-${index}`,
      type,
      number: num,
      amount: amountValue, // Each number gets the full amount
    }));

    setItems([...items, ...newItems]);

    // Show success message
    if (numbersToAdd.length > 1) {
      toast({
        variant: "success",
        title: "เพิ่มสำเร็จ",
        description: `เพิ่มเลข ${numbersToAdd.length} หมายเลข`,
      });
    }

    // Reset inputs based on type
    switch (type) {
      case "2 ตัวบน":
        setNumber2Top("");
        setAmount2Top("");
        setReverse2TopManual(false);
        break;
      case "2 ตัวล่าง":
        setNumber2Bottom("");
        setAmount2Bottom("");
        setReverse2BottomManual(false);
        break;
      case "3 ตัวตรง":
        setNumber3Straight("");
        setAmount3Straight("");
        setReverseStraight("ไม่กลับ");
        break;
      case "3 กลับ":
        setNumber3Reverse("");
        setAmount3Reverse("");
        break;
      case "3 ตัวโต๊ด":
        setNumber3Tod("");
        setAmount3Tod("");
        setReverseTod(false);
        break;
      case "2 กลับ (3 ตัว)":
        // Already reset in onClick handler
        break;
      case "ชุด":
        setNumberSet("");
        setAmountSet("");
        setReverseSet(false);
        break;
      case "วิ่ง":
        setNumberRunning("");
        setAmountRunning("");
        break;
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };


  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Check if number is banned
  const checkBannedNumber = (item: LotteryItem, draw: any): boolean => {
    if (!draw?.bannedNumbers) return false;
    
    const banned = draw.bannedNumbers;
    const number = item.number;
    
    switch (item.type) {
      case "2 ตัวบน":
        if (banned["2 ตัวบน"]?.includes(number.padStart(2, "0"))) {
          return true;
        }
        break;
      case "2 ตัวล่าง":
        if (banned["2 ตัวล่าง"]?.includes(number.padStart(2, "0"))) {
          return true;
        }
        break;
      case "3 ตัวตรง":
      case "3 ตัวบน":
      case "3 กลับ":
        if (banned["3 ตัวตรง"]?.includes(number.padStart(3, "0"))) {
          return true;
        }
        break;
      case "3 ตัวโต๊ด":
      case "ชุด":
        if (banned["3 ตัวโต๊ด"]?.includes(number.padStart(3, "0"))) {
          return true;
        }
        break;
      case "วิ่ง":
      case "วิ่งบน":
      case "วิ่งล่าง":
        if (banned["วิ่ง"]?.includes(number)) {
          return true;
        }
        break;
    }
    
    return false;
  };

  const handleSave = () => {
    if (!customerName.trim()) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกชื่อลูกค้า",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณาเพิ่มเลขหวยอย่างน้อย 1 รายการ",
      });
      return;
    }

    // Check for banned numbers from draw
    if (currentDraw) {
      const bannedItems = items.filter(item => checkBannedNumber(item, currentDraw));
      if (bannedItems.length > 0) {
        toast({
          variant: "destructive",
          title: "มีเลขอั้น",
          description: `เลข ${bannedItems.map(i => `${i.type} ${i.number}`).join(", ")} เป็นเลขอั้นของงวดนี้ ไม่สามารถบันทึกได้`,
        });
        return;
      }
    }

    // Check for banned numbers from agent
    if (selectedAgentId) {
      const selectedAgent = agents.find(a => a.id === selectedAgentId);
      if (selectedAgent?.bannedNumbers) {
        const agentBannedItems: LotteryItem[] = [];
        items.forEach(item => {
          const number = item.number;
          let bannedList: string[] | undefined;
          
          // Match banned numbers based on item type
          switch (item.type) {
            case "2 ตัวบน":
            case "2 ตัวล่าง":
            case "2 ตัวกลับ":
            case "2 กลับ (3 ตัว)":
              bannedList = item.type === "2 ตัวบน" 
                ? selectedAgent.bannedNumbers["2 ตัวบน"]
                : item.type === "2 ตัวล่าง"
                ? selectedAgent.bannedNumbers["2 ตัวล่าง"]
                : selectedAgent.bannedNumbers["2 ตัวบน"] || selectedAgent.bannedNumbers["2 ตัวล่าง"];
              if (bannedList) {
                const normalizedNumber = number.padStart(2, "0");
                const normalizedBanned = bannedList.map(n => n.padStart(2, "0"));
                if (normalizedBanned.includes(normalizedNumber)) {
                  agentBannedItems.push(item);
                }
              }
              break;
            case "3 ตัวตรง":
            case "3 ตัวบน":
            case "3 กลับ":
              bannedList = selectedAgent.bannedNumbers["3 ตัวตรง"];
              if (bannedList) {
                const normalizedNumber = number.padStart(3, "0");
                const normalizedBanned = bannedList.map(n => n.padStart(3, "0"));
                if (normalizedBanned.includes(normalizedNumber)) {
                  agentBannedItems.push(item);
                }
              }
              break;
            case "3 ตัวโต๊ด":
            case "ชุด":
              bannedList = selectedAgent.bannedNumbers["3 ตัวโต๊ด"];
              if (bannedList) {
                const normalizedNumber = number.padStart(3, "0");
                const normalizedBanned = bannedList.map(n => n.padStart(3, "0"));
                if (normalizedBanned.includes(normalizedNumber)) {
                  agentBannedItems.push(item);
                }
              }
              break;
            case "วิ่ง":
            case "วิ่งบน":
            case "วิ่งล่าง":
              bannedList = selectedAgent.bannedNumbers["วิ่ง"];
              if (bannedList && bannedList.includes(number)) {
                agentBannedItems.push(item);
              }
              break;
          }
        });
        
        if (agentBannedItems.length > 0) {
          toast({
            variant: "destructive",
            title: "มีเลขอั้นของเจ้ามือ",
            description: `เลข ${agentBannedItems.map(i => `${i.type} ${i.number}`).join(", ")} เป็นเลขอั้นของเจ้ามือ ${selectedAgent.name} ไม่สามารถบันทึกได้`,
          });
          return;
        }
      }
    }

    // Generate slip number if not provided
    const finalSlipNumber = slipNumber || `LP${Date.now().toString().slice(-6)}`;
    const slipId = `s${Date.now()}`;

    // Find selected agent info
    const selectedAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) : null;

    // Create slip object
    const newSlip = {
      id: slipId,
      createdAtISO: new Date().toISOString(),
      customerName: customerName.trim(),
      slipNumber: finalSlipNumber,
      totalAmount: totalAmount,
      status: "รอผล" as const,
      items: items, // Store lottery items details
      agentId: selectedAgentId || undefined,
      agentName: selectedAgent?.name || undefined,
      drawId: currentDraw?.id || undefined, // Link to current draw
    };

    // Save to localStorage
    saveSlip(newSlip);

    // Log activity
    logActivity(
      "CREATE_SLIP",
      `สร้างโพยใหม่: ${finalSlipNumber} - ${customerName.trim()}`,
      { slipId: slipId, slipNumber: finalSlipNumber, totalAmount: totalAmount }
    );

    // Trigger storage event for other tabs/windows and dashboard
    window.dispatchEvent(new Event("storage"));

    toast({
      variant: "success",
      title: "บันทึกสำเร็จ",
      description: `บันทึกโพย ${finalSlipNumber} สำเร็จ! กำลังไปยังแดชบอร์ด...`,
      duration: 1500,
    });

    // Redirect to dashboard immediately after saving
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh(); // Force refresh to load latest data
    }, 500);
  };

  const typeLabels: Record<string, string> = {
    "2top": "2 ตัวบน",
    "2bottom": "2 ตัวล่าง",
    "3straight": "3 ตัวตรง",
    "3tod": "3 ตัวโต๊ด",
    "set": "ชุด",
    "running": "วิ่ง",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50/70 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 pt-16 lg:pt-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-red-700">คีย์หวย</h1>
                <p className="text-gray-600">
                  {currentDraw ? currentDraw.label : "บันทึกโพยหวยใหม่"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  บันทึกโพย
                </Button>
              </div>
            </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Input Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card className="border border-slate-200 shadow-md bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-700">ข้อมูลลูกค้า</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">ชื่อลูกค้า</Label>
                  <Input
                    id="customer-name"
                    placeholder="กรอกชื่อลูกค้า"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slip-number">เลขที่โพย</Label>
                  <Input
                    id="slip-number"
                    placeholder="ว่างไว้เพื่อสร้างอัตโนมัติ"
                    value={slipNumber}
                    onChange={(e) => setSlipNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-select">ส่งให้เจ้ามือ (ไม่บังคับ)</Label>
                  <Select value={selectedAgentId || undefined} onValueChange={(value) => setSelectedAgentId(value)}>
                    <SelectTrigger id="agent-select">
                      <SelectValue placeholder="เลือกเจ้ามือ (ไม่บังคับ)" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.length === 0 ? (
                        <SelectItem value="no-agents" disabled>
                          ยังไม่มีเจ้ามือ
                        </SelectItem>
                      ) : (
                        agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedAgentId && agents.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        จะส่งให้: {agents.find(a => a.id === selectedAgentId)?.name}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSelectedAgentId("")}
                      >
                        <X className="h-3 w-3 mr-1" />
                        ยกเลิก
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lottery Entry */}
            <Card className="border border-slate-200 shadow-md bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-700 text-center">เลือกประเภทที่ต้องการเล่น</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Game Type Selection */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant={gameType === "3ตัว" ? "default" : "outline"}
                    size="default"
                    className={`flex-1 max-w-[150px] h-10 text-base font-semibold rounded-lg ${
                      gameType === "3ตัว" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setGameType("3ตัว");
                      setActiveTab("3straight");
                    }}
                  >
                    3 ตัว
                  </Button>
                  <Button
                    variant={gameType === "2ตัว" ? "default" : "outline"}
                    size="default"
                    className={`flex-1 max-w-[150px] h-10 text-base font-semibold rounded-lg ${
                      gameType === "2ตัว" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setGameType("2ตัว");
                      setActiveTab("2top");
                    }}
                  >
                    2 ตัว
                  </Button>
                  <Button
                    variant={gameType === "เลขวิ่ง" ? "default" : "outline"}
                    size="default"
                    className={`flex-1 max-w-[150px] h-10 text-base font-semibold rounded-lg ${
                      gameType === "เลขวิ่ง" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setGameType("เลขวิ่ง");
                      setActiveTab("runningtop");
                    }}
                  >
                    เลขวิ่ง
                  </Button>
                </div>

                {/* Sub Options Based on Game Type */}
                {gameType === "3ตัว" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {/* 3 ตัวบน (3 ตัวตรง) */}
                      <button
                        onClick={() => setActiveTab("3straight")}
                        className={`flex items-center justify-center rounded-lg border-2 p-2.5 transition-all ${
                          activeTab === "3straight"
                            ? "border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-semibold text-sm ${activeTab === "3straight" ? "text-white" : "text-gray-700"}`}>
                          บน (3ตัวตรง)
                        </div>
                      </button>

                      {/* 3 ตัวโต๊ด */}
                      <button
                        onClick={() => setActiveTab("3tod")}
                        className={`flex items-center justify-center rounded-lg border-2 p-2.5 transition-all ${
                          activeTab === "3tod"
                            ? "border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-semibold text-sm ${activeTab === "3tod" ? "text-white" : "text-gray-700"}`}>
                          3 ตัวโต๊ด
                        </div>
                      </button>

                      {/* 3 กลับ */}
                      <button
                        onClick={() => setActiveTab("3reverse")}
                        className={`flex items-center justify-center rounded-lg border-2 p-2.5 transition-all ${
                          activeTab === "3reverse"
                            ? "border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-semibold text-sm ${activeTab === "3reverse" ? "text-white" : "text-gray-700"}`}>
                          3 กลับ
                        </div>
                      </button>

                    </div>
                  </div>
                )}

                {gameType === "2ตัว" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {/* 2 ตัวบน */}
                      <button
                        onClick={() => setActiveTab("2top")}
                        className={`flex items-center justify-center rounded-lg border-2 p-2.5 transition-all ${
                          activeTab === "2top"
                            ? "border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-semibold text-sm ${activeTab === "2top" ? "text-white" : "text-gray-700"}`}>
                          2 ตัวบน
                        </div>
                      </button>

                      {/* 2 ตัวล่าง */}
                      <button
                        onClick={() => setActiveTab("2bottom")}
                        className={`flex items-center justify-center rounded-lg border-2 p-2.5 transition-all ${
                          activeTab === "2bottom"
                            ? "border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-semibold text-sm ${activeTab === "2bottom" ? "text-white" : "text-gray-700"}`}>
                          2 ตัวล่าง
                        </div>
                      </button>

                      {/* 2 ตัวกลับ */}
                      <button
                        onClick={() => setActiveTab("2reverse")}
                        className={`flex items-center justify-center rounded-lg border-2 p-2.5 transition-all ${
                          activeTab === "2reverse"
                            ? "border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-semibold text-sm ${activeTab === "2reverse" ? "text-white" : "text-gray-700"}`}>
                          2 ตัวกลับ
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {gameType === "เลขวิ่ง" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-xl mx-auto">
                      {/* วิ่งบน */}
                      <button
                        onClick={() => setActiveTab("runningtop")}
                        className={`flex items-center justify-center rounded-lg border-2 p-2.5 transition-all ${
                          activeTab === "runningtop"
                            ? "border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-semibold text-sm ${activeTab === "runningtop" ? "text-white" : "text-gray-700"}`}>
                          วิ่งบน
                        </div>
                      </button>

                      {/* วิ่งล่าง */}
                      <button
                        onClick={() => setActiveTab("runningbottom")}
                        className={`flex items-center justify-center rounded-lg border-2 p-2.5 transition-all ${
                          activeTab === "runningbottom"
                            ? "border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-semibold text-sm ${activeTab === "runningbottom" ? "text-white" : "text-gray-700"}`}>
                          วิ่งล่าง
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Entry Form Based on Active Tab */}
                <div className="mt-4 space-y-3">
                  {/* 3 ตัวบน (3 ตัวตรง) */}
                  {activeTab === "3straight" && (
                    <div className="space-y-2">
                      <div className="flex gap-2 mb-2">
                        <Button
                          variant={reverseStraight === "ไม่กลับ" ? "default" : "outline"}
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => setReverseStraight("ไม่กลับ")}
                        >
                          ไม่กลับ
                        </Button>
                        <Button
                          variant={reverseStraight === "3 กลับ" ? "default" : "outline"}
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => setReverseStraight("3 กลับ")}
                        >
                          3 กลับ
                        </Button>
                        <Button
                          variant={reverseStraight === "6 กลับ" ? "default" : "outline"}
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => setReverseStraight("6 กลับ")}
                        >
                          6 กลับ
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-sm">เลข 3 ตัว</Label>
                          <Input
                            placeholder="000-999"
                            maxLength={3}
                            value={number3Straight}
                            onChange={(e) => setNumber3Straight(e.target.value.replace(/\D/g, ""))}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number3Straight.length === 3 && amount3Straight && parseFloat(amount3Straight) > 0) {
                                e.preventDefault();
                                const reverseOption = reverseStraight === "3 กลับ" ? { reverseCount: 3 } : 
                                                     reverseStraight === "6 กลับ" ? { reverseCount: 6 } : false;
                                addItem("3 ตัวตรง", number3Straight, amount3Straight, reverseOption);
                                setNumber3Straight("");
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">จำนวนเงิน (บาท)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amount3Straight}
                            onChange={(e) => setAmount3Straight(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number3Straight.length === 3 && amount3Straight && parseFloat(amount3Straight) > 0) {
                                e.preventDefault();
                                const reverseOption = reverseStraight === "3 กลับ" ? { reverseCount: 3 } : 
                                                     reverseStraight === "6 กลับ" ? { reverseCount: 6 } : false;
                                addItem("3 ตัวตรง", number3Straight, amount3Straight, reverseOption);
                                setNumber3Straight("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full h-9"
                            size="sm"
                            onClick={() => {
                              if (number3Straight && number3Straight.length === 3 && amount3Straight && parseFloat(amount3Straight) > 0) {
                                const reverseOption = reverseStraight === "3 กลับ" ? { reverseCount: 3 } : 
                                                     reverseStraight === "6 กลับ" ? { reverseCount: 6 } : false;
                                addItem("3 ตัวตรง", number3Straight, amount3Straight, reverseOption);
                                setNumber3Straight("");
                              }
                            }}
                            disabled={!number3Straight || number3Straight.length !== 3 || !amount3Straight || parseFloat(amount3Straight) <= 0}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3 ตัวโต๊ด */}
                  {activeTab === "3tod" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-sm">เลข 3 ตัวโต๊ด</Label>
                          <Input
                            placeholder="เช่น 123, 456"
                            value={number3Tod}
                            onChange={(e) => setNumber3Tod(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number3Tod.trim() && amount3Tod && parseFloat(amount3Tod) > 0) {
                                e.preventDefault();
                                if (number3Tod.includes(",")) {
                                  const numbers = number3Tod.split(",").map(n => n.trim()).filter(n => n.length === 3);
                                  numbers.forEach(num => {
                                    addItem("3 ตัวโต๊ด", num, amount3Tod, false);
                                  });
                                } else {
                                  addItem("3 ตัวโต๊ด", number3Tod, amount3Tod, false);
                                }
                                setNumber3Tod("");
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            คั่นด้วยจุลภาค เช่น 1,2,3
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">จำนวนเงิน (บาท)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amount3Tod}
                            onChange={(e) => setAmount3Tod(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number3Tod.trim() && amount3Tod && parseFloat(amount3Tod) > 0) {
                                e.preventDefault();
                                if (number3Tod.includes(",")) {
                                  const numbers = number3Tod.split(",").map(n => n.trim()).filter(n => n.length === 3);
                                  numbers.forEach(num => {
                                    addItem("3 ตัวโต๊ด", num, amount3Tod, false);
                                  });
                                } else {
                                  addItem("3 ตัวโต๊ด", number3Tod, amount3Tod, false);
                                }
                                setNumber3Tod("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full h-9"
                            size="sm"
                            onClick={() => {
                              if (number3Tod.trim() && amount3Tod && parseFloat(amount3Tod) > 0) {
                                if (number3Tod.includes(",")) {
                                  const numbers = number3Tod.split(",").map(n => n.trim()).filter(n => n.length === 3);
                                  numbers.forEach(num => {
                                    addItem("3 ตัวโต๊ด", num, amount3Tod, false);
                                  });
                                } else {
                                  addItem("3 ตัวโต๊ด", number3Tod, amount3Tod, false);
                                }
                                setNumber3Tod("");
                              }
                            }}
                            disabled={!number3Tod.trim() || !amount3Tod || parseFloat(amount3Tod) <= 0}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3 กลับ */}
                  {activeTab === "3reverse" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-sm">เลข 3 ตัว</Label>
                          <Input
                            placeholder="000-999"
                            maxLength={3}
                            value={number3Reverse}
                            onChange={(e) => setNumber3Reverse(e.target.value.replace(/\D/g, ""))}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number3Reverse.length === 3 && amount3Reverse && parseFloat(amount3Reverse) > 0) {
                                e.preventDefault();
                                addItem("3 กลับ", number3Reverse, amount3Reverse, true);
                                setNumber3Reverse("");
                                setAmount3Reverse("");
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            เช่น 445 จะได้ 445, 454, 544 (ทุกการสลับตำแหน่ง)
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">จำนวนเงิน (บาท)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amount3Reverse}
                            onChange={(e) => setAmount3Reverse(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number3Reverse.length === 3 && amount3Reverse && parseFloat(amount3Reverse) > 0) {
                                e.preventDefault();
                                addItem("3 กลับ", number3Reverse, amount3Reverse, true);
                                setNumber3Reverse("");
                                setAmount3Reverse("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full h-9"
                            size="sm"
                            onClick={() => {
                              if (number3Reverse && number3Reverse.length === 3 && amount3Reverse && parseFloat(amount3Reverse) > 0) {
                                addItem("3 กลับ", number3Reverse, amount3Reverse, true);
                                setNumber3Reverse("");
                                setAmount3Reverse("");
                              }
                            }}
                            disabled={!number3Reverse || number3Reverse.length !== 3 || !amount3Reverse || parseFloat(amount3Reverse) <= 0}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2 ตัวบน */}
                  {activeTab === "2top" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-sm">เลข 2 ตัวบน</Label>
                          <Input
                            placeholder="00-99"
                            maxLength={2}
                            value={number2Top}
                            onChange={(e) => setNumber2Top(e.target.value.replace(/\D/g, ""))}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number2Top.length === 2 && amount2Top && parseFloat(amount2Top) > 0) {
                                e.preventDefault();
                                addItem("2 ตัวบน", number2Top, amount2Top, false);
                                setNumber2Top("");
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">จำนวนเงิน (บาท)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amount2Top}
                            onChange={(e) => setAmount2Top(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number2Top.length === 2 && amount2Top && parseFloat(amount2Top) > 0) {
                                e.preventDefault();
                                addItem("2 ตัวบน", number2Top, amount2Top, false);
                                setNumber2Top("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full h-9"
                            size="sm"
                            onClick={() => {
                              if (number2Top && number2Top.length === 2 && amount2Top && parseFloat(amount2Top) > 0) {
                                addItem("2 ตัวบน", number2Top, amount2Top, false);
                                setNumber2Top("");
                              }
                            }}
                            disabled={!number2Top || number2Top.length !== 2 || !amount2Top || parseFloat(amount2Top) <= 0}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2 ตัวล่าง */}
                  {activeTab === "2bottom" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-sm">เลข 2 ตัวล่าง</Label>
                          <Input
                            placeholder="00-99"
                            maxLength={2}
                            value={number2Bottom}
                            onChange={(e) => setNumber2Bottom(e.target.value.replace(/\D/g, ""))}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number2Bottom.length === 2 && amount2Bottom && parseFloat(amount2Bottom) > 0) {
                                e.preventDefault();
                                addItem("2 ตัวล่าง", number2Bottom, amount2Bottom, false);
                                setNumber2Bottom("");
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">จำนวนเงิน (บาท)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amount2Bottom}
                            onChange={(e) => setAmount2Bottom(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number2Bottom.length === 2 && amount2Bottom && parseFloat(amount2Bottom) > 0) {
                                e.preventDefault();
                                addItem("2 ตัวล่าง", number2Bottom, amount2Bottom, false);
                                setNumber2Bottom("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full h-9"
                            size="sm"
                            onClick={() => {
                              if (number2Bottom && number2Bottom.length === 2 && amount2Bottom && parseFloat(amount2Bottom) > 0) {
                                addItem("2 ตัวล่าง", number2Bottom, amount2Bottom, false);
                                setNumber2Bottom("");
                              }
                            }}
                            disabled={!number2Bottom || number2Bottom.length !== 2 || !amount2Bottom || parseFloat(amount2Bottom) <= 0}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2 ตัวกลับ */}
                  {activeTab === "2reverse" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-sm">เลข 2 ตัว</Label>
                          <Input
                            placeholder="00-99"
                            maxLength={2}
                            value={number2Reverse}
                            onChange={(e) => setNumber2Reverse(e.target.value.replace(/\D/g, ""))}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number2Reverse.length === 2 && amount2Reverse && parseFloat(amount2Reverse) > 0) {
                                e.preventDefault();
                                addItem("2 ตัวบน", number2Reverse, amount2Reverse, true);
                                setNumber2Reverse("");
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">จำนวนเงิน (บาท)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amount2Reverse}
                            onChange={(e) => setAmount2Reverse(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && number2Reverse.length === 2 && amount2Reverse && parseFloat(amount2Reverse) > 0) {
                                e.preventDefault();
                                addItem("2 ตัวบน", number2Reverse, amount2Reverse, true);
                                setNumber2Reverse("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full h-9"
                            size="sm"
                            onClick={() => {
                              if (number2Reverse && number2Reverse.length === 2 && amount2Reverse && parseFloat(amount2Reverse) > 0) {
                                addItem("2 ตัวบน", number2Reverse, amount2Reverse, true);
                                setNumber2Reverse("");
                              }
                            }}
                            disabled={!number2Reverse || number2Reverse.length !== 2 || !amount2Reverse || parseFloat(amount2Reverse) <= 0}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* วิ่งบน */}
                  {activeTab === "runningtop" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-sm">เลขวิ่งบน</Label>
                          <Input
                            placeholder="0-9"
                            maxLength={1}
                            value={numberRunningTop}
                            onChange={(e) => setNumberRunningTop(e.target.value.replace(/\D/g, ""))}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && numberRunningTop.trim() && amountRunningTop && parseFloat(amountRunningTop) > 0) {
                                e.preventDefault();
                                addItem("วิ่ง", numberRunningTop, amountRunningTop);
                                setNumberRunningTop("");
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">จำนวนเงิน (บาท)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amountRunningTop}
                            onChange={(e) => setAmountRunningTop(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && numberRunningTop.trim() && amountRunningTop && parseFloat(amountRunningTop) > 0) {
                                e.preventDefault();
                                addItem("วิ่ง", numberRunningTop, amountRunningTop);
                                setNumberRunningTop("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full h-9"
                            size="sm"
                            onClick={() => {
                              if (numberRunningTop.trim() && amountRunningTop && parseFloat(amountRunningTop) > 0) {
                                addItem("วิ่ง", numberRunningTop, amountRunningTop);
                                setNumberRunningTop("");
                              }
                            }}
                            disabled={!numberRunningTop.trim() || !amountRunningTop || parseFloat(amountRunningTop) <= 0}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* วิ่งล่าง */}
                  {activeTab === "runningbottom" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-sm">เลขวิ่งล่าง</Label>
                          <Input
                            placeholder="0-9"
                            maxLength={1}
                            value={numberRunningBottom}
                            onChange={(e) => setNumberRunningBottom(e.target.value.replace(/\D/g, ""))}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && numberRunningBottom.trim() && amountRunningBottom && parseFloat(amountRunningBottom) > 0) {
                                e.preventDefault();
                                addItem("วิ่ง", numberRunningBottom, amountRunningBottom);
                                setNumberRunningBottom("");
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">จำนวนเงิน (บาท)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amountRunningBottom}
                            onChange={(e) => setAmountRunningBottom(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && numberRunningBottom.trim() && amountRunningBottom && parseFloat(amountRunningBottom) > 0) {
                                e.preventDefault();
                                addItem("วิ่ง", numberRunningBottom, amountRunningBottom);
                                setNumberRunningBottom("");
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            className="w-full h-9"
                            size="sm"
                            onClick={() => {
                              if (numberRunningBottom.trim() && amountRunningBottom && parseFloat(amountRunningBottom) > 0) {
                                addItem("วิ่ง", numberRunningBottom, amountRunningBottom);
                                setNumberRunningBottom("");
                              }
                            }}
                            disabled={!numberRunningBottom.trim() || !amountRunningBottom || parseFloat(amountRunningBottom) <= 0}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary */}
          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-md bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-700">สรุปโพย</CardTitle>
                <CardDescription className="text-gray-600">รายการเลขหวยที่เพิ่มแล้ว</CardDescription>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>ยังไม่มีรายการ</p>
                    <p className="text-xs">เลือกประเภทและเพิ่มเลขหวย</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.type}</Badge>
                            <span className="font-mono font-semibold">{item.number}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Separator />
                    <div className="space-y-2">
                      {selectedAgentId && agents.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            ส่งให้เจ้ามือ:
                          </span>
                          <span className="font-medium">
                            {agents.find(a => a.id === selectedAgentId)?.name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between font-bold text-lg">
                        <span>ยอดรวม</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-slate-200 shadow-md bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-700">การดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setItems([]);
                    setCustomerName("");
                    setSlipNumber("");
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  ล้างฟอร์ม
                </Button>
                <Button className="w-full" onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  บันทึกโพย
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}
