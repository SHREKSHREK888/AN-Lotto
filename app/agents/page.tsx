"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Edit, Trash2, Send, History, Search, ArrowRight, X } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { getSlips, updateSlipAgent } from "@/lib/storage";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activity-log";

interface Agent {
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

export default function AgentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedSlips, setSelectedSlips] = useState<string[]>([]);
  const [allSlips, setAllSlips] = useState<any[]>([]);
  const [sendHistory, setSendHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentToMove, setAgentToMove] = useState<Agent | null>(null);

  // Form states
  const [agentName, setAgentName] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [payout2Digit, setPayout2Digit] = useState("");
  const [payout3Straight, setPayout3Straight] = useState("");
  const [payout3Tod, setPayout3Tod] = useState("");
  
  // Banned numbers form states - now arrays of strings (each string is a comma-separated list)
  const [banned2Top, setBanned2Top] = useState<string[]>([]);
  const [banned2Bottom, setBanned2Bottom] = useState<string[]>([]);
  const [banned3Straight, setBanned3Straight] = useState<string[]>([]);
  const [banned3Tod, setBanned3Tod] = useState<string[]>([]);
  const [bannedRunning, setBannedRunning] = useState<string[]>([]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
      loadAgents();
      loadSlips();
      loadSendHistory();
    }
  }, [router]);

  const loadAgents = () => {
    const stored = localStorage.getItem("agents");
    if (stored) {
      try {
        setAgents(JSON.parse(stored));
      } catch {
        setAgents([]);
      }
    }
  };

  const loadSlips = () => {
    const slips = getSlips();
    setAllSlips(slips);
  };

  const loadSendHistory = () => {
    const stored = localStorage.getItem("agent_sends");
    if (stored) {
      try {
        const history = JSON.parse(stored);
        setSendHistory(history.sort((a: any, b: any) => 
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        ));
      } catch {
        setSendHistory([]);
      }
    }
  };

  const saveAgents = (newAgents: Agent[]) => {
    localStorage.setItem("agents", JSON.stringify(newAgents));
    setAgents(newAgents);
  };

  // Helper function to parse comma-separated numbers from an array of strings
  const parseNumbersFromSets = (sets: string[]): string[] => {
    const allNumbers: string[] = [];
    sets.forEach(set => {
      if (set.trim()) {
        const numbers = set
          .split(",")
          .map(n => n.trim())
          .filter(n => n.length > 0);
        allNumbers.push(...numbers);
      }
    });
    return allNumbers;
  };

  const handleAddAgent = () => {
    if (!agentName.trim() || !commissionPercent) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
      return;
    }

    const percent = parseFloat(commissionPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0-100",
      });
      return;
    }

    const payout2Value = payout2Digit ? parseFloat(payout2Digit) : undefined;
    const payout3StraightValue = payout3Straight ? parseFloat(payout3Straight) : undefined;
    const payout3TodValue = payout3Tod ? parseFloat(payout3Tod) : undefined;

    // Parse banned numbers from all sets
    const bannedNumbers: Agent["bannedNumbers"] = {};
    const banned2TopList = parseNumbersFromSets(banned2Top);
    const banned2BottomList = parseNumbersFromSets(banned2Bottom);
    const banned3StraightList = parseNumbersFromSets(banned3Straight);
    const banned3TodList = parseNumbersFromSets(banned3Tod);
    const bannedRunningList = parseNumbersFromSets(bannedRunning);

    if (banned2TopList.length > 0) bannedNumbers["2 ตัวบน"] = banned2TopList;
    if (banned2BottomList.length > 0) bannedNumbers["2 ตัวล่าง"] = banned2BottomList;
    if (banned3StraightList.length > 0) bannedNumbers["3 ตัวตรง"] = banned3StraightList;
    if (banned3TodList.length > 0) bannedNumbers["3 ตัวโต๊ด"] = banned3TodList;
    if (bannedRunningList.length > 0) bannedNumbers["วิ่ง"] = bannedRunningList;

    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      name: agentName.trim(),
      commissionPercent: percent,
      payout2Digit: payout2Value,
      payout3Straight: payout3StraightValue,
      payout3Tod: payout3TodValue,
      createdAt: new Date().toISOString(),
      bannedNumbers: Object.keys(bannedNumbers).length > 0 ? bannedNumbers : undefined,
    };

    saveAgents([...agents, newAgent]);
    logActivity(
      "ADD_AGENT",
      `เพิ่มเจ้ามือใหม่: ${newAgent.name}`,
      { agentId: newAgent.id, commissionPercent: newAgent.commissionPercent }
    );
    setShowAddDialog(false);
    setAgentName("");
    setCommissionPercent("");
    setPayout2Digit("");
    setPayout3Straight("");
    setPayout3Tod("");
    setBanned2Top([]);
    setBanned2Bottom([]);
    setBanned3Straight([]);
    setBanned3Tod([]);
    setBannedRunning([]);
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "เพิ่มเจ้ามือเรียบร้อยแล้ว",
    });
  };

  const handleEditAgent = () => {
    if (!selectedAgent || !agentName.trim() || !commissionPercent) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
      return;
    }

    const percent = parseFloat(commissionPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0-100",
      });
      return;
    }

    const payout2Value = payout2Digit ? parseFloat(payout2Digit) : undefined;
    const payout3StraightValue = payout3Straight ? parseFloat(payout3Straight) : undefined;
    const payout3TodValue = payout3Tod ? parseFloat(payout3Tod) : undefined;

    // Parse banned numbers from all sets
    const bannedNumbers: Agent["bannedNumbers"] = {};
    const banned2TopList = parseNumbersFromSets(banned2Top);
    const banned2BottomList = parseNumbersFromSets(banned2Bottom);
    const banned3StraightList = parseNumbersFromSets(banned3Straight);
    const banned3TodList = parseNumbersFromSets(banned3Tod);
    const bannedRunningList = parseNumbersFromSets(bannedRunning);

    if (banned2TopList.length > 0) bannedNumbers["2 ตัวบน"] = banned2TopList;
    if (banned2BottomList.length > 0) bannedNumbers["2 ตัวล่าง"] = banned2BottomList;
    if (banned3StraightList.length > 0) bannedNumbers["3 ตัวตรง"] = banned3StraightList;
    if (banned3TodList.length > 0) bannedNumbers["3 ตัวโต๊ด"] = banned3TodList;
    if (bannedRunningList.length > 0) bannedNumbers["วิ่ง"] = bannedRunningList;

    const updatedAgents = agents.map((agent) =>
      agent.id === selectedAgent.id
        ? {
            ...agent,
            name: agentName.trim(),
            commissionPercent: percent,
            payout2Digit: payout2Value,
            payout3Straight: payout3StraightValue,
            payout3Tod: payout3TodValue,
            bannedNumbers: Object.keys(bannedNumbers).length > 0 ? bannedNumbers : undefined,
          }
        : agent
    );

    saveAgents(updatedAgents);
    logActivity(
      "EDIT_AGENT",
      `แก้ไขเจ้ามือ: ${agentName.trim()}`,
      { agentId: selectedAgent.id, changes: { commissionPercent: percent } }
    );
    setShowEditDialog(false);
    setSelectedAgent(null);
    setAgentName("");
    setCommissionPercent("");
    setPayout2Digit("");
    setPayout3Straight("");
    setPayout3Tod("");
    setBanned2Top([]);
    setBanned2Bottom([]);
    setBanned3Straight([]);
    setBanned3Tod([]);
    setBannedRunning([]);
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "แก้ไขเจ้ามือเรียบร้อยแล้ว",
    });
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgentToDelete(agentId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAgent = () => {
    if (agentToDelete) {
      const agent = agents.find(a => a.id === agentToDelete);
      const updatedAgents = agents.filter((agent) => agent.id !== agentToDelete);
      saveAgents(updatedAgents);
      logActivity(
        "DELETE_AGENT",
        `ลบเจ้ามือ: ${agent?.name || "Unknown"}`,
        { agentId: agentToDelete }
      );
      setShowDeleteDialog(false);
      setAgentToDelete(null);
      toast({
        variant: "success",
        title: "สำเร็จ",
        description: "ลบเจ้ามือเรียบร้อยแล้ว",
      });
    }
  };

  const handleOpenEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentName(agent.name);
    setCommissionPercent(agent.commissionPercent.toString());
    setPayout2Digit(agent.payout2Digit?.toString() || "");
    setPayout3Straight(agent.payout3Straight?.toString() || "");
    setPayout3Tod(agent.payout3Tod?.toString() || "");
    // Convert banned numbers arrays back to input format (split into sets)
    // For now, we'll put all numbers in one set, but user can split them
    const banned2TopArr = agent.bannedNumbers?.["2 ตัวบน"] || [];
    const banned2BottomArr = agent.bannedNumbers?.["2 ตัวล่าง"] || [];
    const banned3StraightArr = agent.bannedNumbers?.["3 ตัวตรง"] || [];
    const banned3TodArr = agent.bannedNumbers?.["3 ตัวโต๊ด"] || [];
    const bannedRunningArr = agent.bannedNumbers?.["วิ่ง"] || [];
    
    setBanned2Top(banned2TopArr.length > 0 ? [banned2TopArr.join(", ")] : []);
    setBanned2Bottom(banned2BottomArr.length > 0 ? [banned2BottomArr.join(", ")] : []);
    setBanned3Straight(banned3StraightArr.length > 0 ? [banned3StraightArr.join(", ")] : []);
    setBanned3Tod(banned3TodArr.length > 0 ? [banned3TodArr.join(", ")] : []);
    setBannedRunning(bannedRunningArr.length > 0 ? [bannedRunningArr.join(", ")] : []);
    setPayout2Digit(agent.payout2Digit?.toString() || "");
    setPayout3Straight(agent.payout3Straight?.toString() || "");
    setPayout3Tod(agent.payout3Tod?.toString() || "");
    setShowEditDialog(true);
  };

  const handleOpenMove = (agent?: Agent) => {
    if (agent) {
      setAgentToMove(agent);
      setSelectedAgent(agent);
    } else {
      setAgentToMove(null);
      setSelectedAgent(null);
    }
    setSelectedSlips([]);
    setSearchQuery("");
    setShowSendDialog(true);
  };

  const handleOpenMoveButton = () => {
    handleOpenMove();
  };

  const handleMoveSlips = () => {
    if (!selectedAgent || selectedSlips.length === 0) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณาเลือกโพยและเจ้ามือที่ต้องการย้าย",
      });
      return;
    }

    // Update agentId and agentName for selected slips
    let movedCount = 0;
    selectedSlips.forEach((slipId) => {
      const slip = allSlips.find((s) => s.id === slipId);
      if (slip) {
        updateSlipAgent(slipId, selectedAgent.id, selectedAgent.name);
        movedCount++;
      }
    });

    // Trigger storage event for dashboard update
    window.dispatchEvent(new Event("storage"));

    // Reload slips to reflect changes
    loadSlips();

    logActivity(
      "MOVE_SLIPS",
      `ย้ายโพย ${movedCount} ใบให้เจ้ามือ: ${selectedAgent.name}`,
      { agentId: selectedAgent.id, slipIds: selectedSlips, count: movedCount }
    );

    toast({
      variant: "success",
      title: "ย้ายโพยสำเร็จ",
      description: `ย้ายโพย ${movedCount} ใบให้ ${selectedAgent.name} เรียบร้อยแล้ว`,
      duration: 3000,
    });

    setShowSendDialog(false);
    setSelectedAgent(null);
    setSelectedSlips([]);
  };

  const handleViewHistory = () => {
    loadSendHistory();
    setShowHistoryDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Filter slips based on search query
  const filteredSlips = allSlips.filter((slip) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      slip.customerName.toLowerCase().includes(query) ||
      slip.slipNumber.toLowerCase().includes(query)
    );
  });

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 pt-16 lg:pt-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">ย้ายโพยหวยให้เจ้ามือ</h1>
                <p className="text-muted-foreground">จัดการเจ้ามือและย้ายโพยหวย</p>
              </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewHistory}>
              <History className="mr-2 h-4 w-4" />
              ประวัติการส่ง
            </Button>
            <Button variant="outline" onClick={handleOpenMoveButton}>
              <Send className="mr-2 h-4 w-4" />
              ย้ายโพยหวย
            </Button>
            <Button
              onClick={() => {
                setAgentName("");
                setCommissionPercent("");
                setPayout2Digit("");
                setPayout3Straight("");
                setPayout3Tod("");
                setShowAddDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มเจ้ามือ
            </Button>
          </div>
        </div>

        {/* Agents List */}
        <Card>
          <CardHeader>
            <CardTitle>รายชื่อเจ้ามือ</CardTitle>
            <CardDescription>จัดการข้อมูลเจ้ามือและเปอร์เซ็นต์</CardDescription>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>ยังไม่มีเจ้ามือ</p>
                <p className="text-sm mt-2">คลิกปุ่ม "เพิ่มเจ้ามือ" เพื่อเพิ่มรายการ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อเจ้ามือ</TableHead>
                      <TableHead className="text-right">เปอร์เซ็นต์</TableHead>
                      <TableHead>วันที่เพิ่ม</TableHead>
                      <TableHead className="text-right">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-base px-3 py-1">
                            {agent.commissionPercent}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(agent.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenMove(agent)}
                              title="ย้ายโพยให้เจ้ามือนี้"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(agent)}
                              title="แก้ไข"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAgent(agent.id)}
                              title="ลบ"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </main>
      </div>

      {/* Add Agent Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>เพิ่มเจ้ามือ</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเจ้ามือและตั้งค่าเปอร์เซ็นต์
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="add-name">ชื่อเจ้ามือ</Label>
              <Input
                id="add-name"
                placeholder="กรอกชื่อเจ้ามือ"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-percent">เปอร์เซ็นต์ที่เราจะได้รับ (%)</Label>
              <Input
                id="add-percent"
                type="number"
                placeholder="0-100"
                min="0"
                max="100"
                step="0.01"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                เปอร์เซ็นต์ที่เราจะได้รับจากยอดรวม (0-100)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-payout-2">2 ตัวจ่ายกี่บาท</Label>
              <Input
                id="add-payout-2"
                type="number"
                placeholder="เช่น 70"
                min="0"
                step="0.01"
                value={payout2Digit}
                onChange={(e) => setPayout2Digit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                อัตราจ่ายสำหรับ 2 ตัวบน/ล่าง (เช่น 70 = จ่ายบาทละ 70 บาท)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-payout-3straight">3 ตัวตรงจ่ายกี่บาท</Label>
              <Input
                id="add-payout-3straight"
                type="number"
                placeholder="เช่น 800"
                min="0"
                step="0.01"
                value={payout3Straight}
                onChange={(e) => setPayout3Straight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                อัตราจ่ายสำหรับ 3 ตัวตรง (เช่น 800 = จ่ายบาทละ 800 บาท)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-payout-3tod">3 ตัวโต๊ดจ่ายกี่บาท</Label>
              <Input
                id="add-payout-3tod"
                type="number"
                placeholder="เช่น 130"
                min="0"
                step="0.01"
                value={payout3Tod}
                onChange={(e) => setPayout3Tod(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                อัตราจ่ายสำหรับ 3 ตัวโต๊ด/ชุด (เช่น 130 = จ่ายบาทละ 130 บาท)
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">เลขอั้น</h4>
                <p className="text-xs text-muted-foreground">
                  กำหนดเลขที่ไม่อนุญาตให้รับ (คั่นด้วยเครื่องหมายจุลภาค เช่น 12,34,56)
                </p>
              </div>
              
              {/* 2 ตัวบน */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>2 ตัวบน</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned2Top([...banned2Top, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {banned2Top.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 12,34,56"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...banned2Top];
                        newSets[index] = e.target.value;
                        setBanned2Top(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBanned2Top(banned2Top.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {banned2Top.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned2Top([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>

              {/* 2 ตัวล่าง */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>2 ตัวล่าง</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned2Bottom([...banned2Bottom, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {banned2Bottom.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 12,34,56"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...banned2Bottom];
                        newSets[index] = e.target.value;
                        setBanned2Bottom(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBanned2Bottom(banned2Bottom.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {banned2Bottom.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned2Bottom([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>

              {/* 3 ตัวตรง */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>3 ตัวตรง</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned3Straight([...banned3Straight, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {banned3Straight.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 123,456,789"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...banned3Straight];
                        newSets[index] = e.target.value;
                        setBanned3Straight(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBanned3Straight(banned3Straight.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {banned3Straight.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned3Straight([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>

              {/* 3 ตัวโต๊ด */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>3 ตัวโต๊ด</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned3Tod([...banned3Tod, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {banned3Tod.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 123,456,789"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...banned3Tod];
                        newSets[index] = e.target.value;
                        setBanned3Tod(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBanned3Tod(banned3Tod.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {banned3Tod.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned3Tod([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>

              {/* วิ่ง */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>วิ่ง</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBannedRunning([...bannedRunning, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {bannedRunning.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 1,2,3,4,5"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...bannedRunning];
                        newSets[index] = e.target.value;
                        setBannedRunning(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBannedRunning(bannedRunning.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {bannedRunning.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBannedRunning([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAddAgent}>เพิ่มเจ้ามือ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>แก้ไขเจ้ามือ</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลเจ้ามือและเปอร์เซ็นต์
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="edit-name">ชื่อเจ้ามือ</Label>
              <Input
                id="edit-name"
                placeholder="กรอกชื่อเจ้ามือ"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-percent">เปอร์เซ็นต์ที่เราจะได้รับ (%)</Label>
              <Input
                id="edit-percent"
                type="number"
                placeholder="0-100"
                min="0"
                max="100"
                step="0.01"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                เปอร์เซ็นต์ที่เราจะได้รับจากยอดรวม (0-100)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payout-2">2 ตัวจ่ายกี่บาท</Label>
              <Input
                id="edit-payout-2"
                type="number"
                placeholder="เช่น 70"
                min="0"
                step="0.01"
                value={payout2Digit}
                onChange={(e) => setPayout2Digit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                อัตราจ่ายสำหรับ 2 ตัวบน/ล่าง (เช่น 70 = จ่ายบาทละ 70 บาท)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payout-3straight">3 ตัวตรงจ่ายกี่บาท</Label>
              <Input
                id="edit-payout-3straight"
                type="number"
                placeholder="เช่น 800"
                min="0"
                step="0.01"
                value={payout3Straight}
                onChange={(e) => setPayout3Straight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                อัตราจ่ายสำหรับ 3 ตัวตรง (เช่น 800 = จ่ายบาทละ 800 บาท)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payout-3tod">3 ตัวโต๊ดจ่ายกี่บาท</Label>
              <Input
                id="edit-payout-3tod"
                type="number"
                placeholder="เช่น 130"
                min="0"
                step="0.01"
                value={payout3Tod}
                onChange={(e) => setPayout3Tod(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                อัตราจ่ายสำหรับ 3 ตัวโต๊ด/ชุด (เช่น 130 = จ่ายบาทละ 130 บาท)
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">เลขอั้น</h4>
                <p className="text-xs text-muted-foreground">
                  กำหนดเลขที่ไม่อนุญาตให้รับ (คั่นด้วยเครื่องหมายจุลภาค เช่น 12,34,56)
                </p>
              </div>
              
              {/* 2 ตัวบน */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>2 ตัวบน</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned2Top([...banned2Top, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {banned2Top.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 12,34,56"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...banned2Top];
                        newSets[index] = e.target.value;
                        setBanned2Top(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBanned2Top(banned2Top.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {banned2Top.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned2Top([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>

              {/* 2 ตัวล่าง */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>2 ตัวล่าง</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned2Bottom([...banned2Bottom, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {banned2Bottom.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 12,34,56"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...banned2Bottom];
                        newSets[index] = e.target.value;
                        setBanned2Bottom(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBanned2Bottom(banned2Bottom.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {banned2Bottom.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned2Bottom([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>

              {/* 3 ตัวตรง */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>3 ตัวตรง</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned3Straight([...banned3Straight, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {banned3Straight.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 123,456,789"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...banned3Straight];
                        newSets[index] = e.target.value;
                        setBanned3Straight(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBanned3Straight(banned3Straight.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {banned3Straight.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned3Straight([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>

              {/* 3 ตัวโต๊ด */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>3 ตัวโต๊ด</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned3Tod([...banned3Tod, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {banned3Tod.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 123,456,789"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...banned3Tod];
                        newSets[index] = e.target.value;
                        setBanned3Tod(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBanned3Tod(banned3Tod.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {banned3Tod.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBanned3Tod([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>

              {/* วิ่ง */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>วิ่ง</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBannedRunning([...bannedRunning, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุด
                  </Button>
                </div>
                {bannedRunning.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="เช่น 1,2,3,4,5"
                      value={set}
                      onChange={(e) => {
                        const newSets = [...bannedRunning];
                        newSets[index] = e.target.value;
                        setBannedRunning(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBannedRunning(bannedRunning.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {bannedRunning.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBannedRunning([""])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มชุดเลขอั้น
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEditAgent}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Slips Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ย้ายโพยหวยให้เจ้ามือ</DialogTitle>
            <DialogDescription>
              {agentToMove 
                ? `ย้ายโพยให้ ${agentToMove.name}` 
                : "เลือกโพยและเจ้ามือที่ต้องการย้ายไปให้"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Select Agent */}
            <div className="space-y-2">
              <Label>เลือกเจ้ามือที่ต้องการย้ายไปให้</Label>
              <Select 
                value={selectedAgent?.id || ""} 
                onValueChange={(value) => {
                  const agent = agents.find(a => a.id === value);
                  setSelectedAgent(agent || null);
                  setAgentToMove(agent || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเจ้ามือ..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.length === 0 ? (
                    <SelectItem value="no-agents" disabled>
                      ยังไม่มีเจ้ามือ
                    </SelectItem>
                  ) : (
                    agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} - ได้รับ {agent.commissionPercent}%
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Search Slips */}
            <div className="space-y-2">
              <Label>ค้นหาโพย (ชื่อ/เลขที่โพย)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อลูกค้าหรือเลขที่โพย..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Select Slips */}
            {filteredSlips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>ไม่มีโพยที่สามารถย้ายได้</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <Label>เลือกโพยที่ต้องการย้าย (ปัจจุบัน {selectedSlips.length} ใบ / ทั้งหมด {filteredSlips.length} ใบ)</Label>
                  {filteredSlips.map((slip) => {
                    const currentAgent = agents.find(a => a.id === slip.agentId);
                    return (
                      <div
                        key={slip.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSlips.includes(slip.id)
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          if (selectedSlips.includes(slip.id)) {
                            setSelectedSlips(
                              selectedSlips.filter((id) => id !== slip.id)
                            );
                          } else {
                            setSelectedSlips([...selectedSlips, slip.id]);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedSlips.includes(slip.id)}
                              onChange={() => {}}
                              className="w-4 h-4"
                            />
                            <span className="font-medium">{slip.slipNumber}</span>
                            <Badge variant="outline">{slip.status}</Badge>
                            {currentAgent && (
                              <Badge variant="secondary" className="text-xs">
                                เจ้ามือปัจจุบัน: {currentAgent.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {slip.customerName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(slip.totalAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(slip.createdAtISO)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedSlips.length > 0 && selectedAgent && (
                  <>
                    <Separator />
                    <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span>จำนวนโพยที่จะย้าย:</span>
                        <span className="font-semibold">{selectedSlips.length} ใบ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ย้ายไปให้:</span>
                        <span className="font-semibold text-primary">
                          {selectedAgent.name} (ได้รับ {selectedAgent.commissionPercent}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ยอดรวม:</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            filteredSlips
                              .filter((s) => selectedSlips.includes(s.id))
                              .reduce((sum, s) => sum + s.totalAmount, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSendDialog(false);
              setSelectedAgent(null);
              setSelectedSlips([]);
              setAgentToMove(null);
              setSearchQuery("");
            }}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleMoveSlips}
              disabled={selectedSlips.length === 0 || !selectedAgent}
            >
              <Send className="mr-2 h-4 w-4" />
              ย้ายโพยหวย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ประวัติการส่งเจ้ามือ</DialogTitle>
            <DialogDescription>
              ดูประวัติการส่งโพยให้เจ้ามือทั้งหมด
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {sendHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>ยังไม่มีประวัติการส่ง</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sendHistory.map((record) => {
                  const agent = agents.find((a) => a.id === record.agentId);
                  return (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">
                                {record.agentName || agent?.name || "ไม่พบข้อมูล"}
                              </span>
                              <Badge variant="outline">
                                {record.slipIds.length} โพย
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {formatDate(record.sentAt)}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">ยอดรวม</p>
                                <p className="font-semibold">
                                  {formatCurrency(record.totalAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">เปอร์เซ็นต์ที่เราได้</p>
                                <p className="font-semibold">
                                  {record.commissionPercent}%
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">ส่วนที่เราได้</p>
                                <p className="font-semibold text-primary">
                                  {formatCurrency(record.commissionAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">ยอดที่จ่ายให้เจ้ามือ</p>
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(record.netAmount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบเจ้ามือรายนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAgent}>
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
