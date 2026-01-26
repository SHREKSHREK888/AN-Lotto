"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Edit, Save, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { getSlips, updateSlipStatus, saveSlip, getAgents, Agent } from "@/lib/storage";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Slip } from "@/lib/mockData";
import { getDrawById, getCurrentDraw, saveDraw, Draw } from "@/lib/draw";
import { useSearchParams } from "next/navigation";
import { calculateSlipPayout } from "@/lib/payout";

interface LotteryResult {
  result2Top: string; // 2 ตัวบน
  result2Bottom: string; // 2 ตัวล่าง
  result3Straight: string; // 3 ตัวตรง
  result3Tod: string[]; // 3 ตัวโต๊ด (array of 3 digits)
  closedAt: string; // ISO string
  canEdit: boolean; // Can edit if within 1 day
}

export default function LotteryResultClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const drawId = searchParams.get("drawId");
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [result, setResult] = useState<LotteryResult | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Form states for editing
  const [editResult2Top, setEditResult2Top] = useState("");
  const [editResult2Bottom, setEditResult2Bottom] = useState("");
  const [editResult3Straight, setEditResult3Straight] = useState("");
  const [editResult3Tod, setEditResult3Tod] = useState("");

  const loadData = useCallback(() => {
    // Get draw
    let draw: Draw | null = null;
    if (drawId) {
      draw = getDrawById(drawId);
    } else {
      draw = getCurrentDraw();
    }

    if (!draw) {
      toast({
        variant: "destructive",
        title: "ไม่พบงวด",
        description: "กรุณาเปิดงวดก่อนปิดผลหวย",
      });
      setTimeout(() => {
        router.push("/draws");
      }, 2000);
      return;
    }

    setCurrentDraw(draw);

    // Load slips for this draw
    const allSlips = getSlips();
    const drawSlips = allSlips.filter(slip => slip.drawId === draw.id);
    setSlips(drawSlips);

    // Load agents
    const allAgents = getAgents();
    setAgents(allAgents || []);

    // Load lottery result from draw
    if (draw.result) {
      const closedDate = new Date(draw.result.closedAt);
      const now = new Date();
      const diffTime = now.getTime() - closedDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      setResult({
        ...draw.result,
        canEdit: diffDays < 1, // Can edit if less than 1 day
      });
    }
  }, [drawId, router, toast]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
      loadData();
    }
  }, [router, drawId, loadData]);

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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Check if a number matches lottery result
  const checkWin = (slip: Slip): boolean => {
    if (!result || !slip.items || slip.items.length === 0) return false;

    // Check each item in the slip
    for (const item of slip.items) {
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
          if (number.padStart(3, "0") === result.result3Straight) {
            isWin = true;
          }
          break;
        case "3 ตัวโต๊ด":
          // Check if all 3 digits of the number match any permutation of result3Tod
          if (number.length === 3) {
            const digits = number.split("").map(d => d.trim()).filter(d => d);
            const resultDigits = result.result3Tod.map(d => d.trim()).filter(d => d);

            // Check if all digits in number exist in result3Tod
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
        case "ชุด":
          // Similar to 3 ตัวโต๊ด
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
        case "วิ่ง":
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

      // If any item wins, the slip wins
      if (isWin) return true;
    }

    return false;
  };

  const handleCloseResult = () => {
    if (!editResult2Top || !editResult2Bottom || !editResult3Straight || !editResult3Tod) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกเลขผลหวยให้ครบถ้วน",
      });
      return;
    }

    // Parse 3 ตัวโต๊ด (3 digits like "199")
    const todDigits = editResult3Tod.replace(/\D/g, ""); // Remove non-digits

    if (todDigits.length !== 3) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "เลข 3 ตัวโต๊ดต้องมี 3 ตัว",
      });
      return;
    }

    const todArray = todDigits.split("");

    if (!currentDraw) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่พบงวด",
      });
      return;
    }

    const newResult: LotteryResult = {
      result2Top: editResult2Top.padStart(2, "0"),
      result2Bottom: editResult2Bottom.padStart(2, "0"),
      result3Straight: editResult3Straight.padStart(3, "0"),
      result3Tod: todArray,
      closedAt: new Date().toISOString(),
      canEdit: true,
    };

    // Save result to draw
    const updatedDraw: Draw = {
      ...currentDraw,
      result: newResult,
    };
    saveDraw(updatedDraw);
    setCurrentDraw(updatedDraw);
    setResult(newResult);

    // Check all slips for this draw and update status
    const allSlips = getSlips();
    const updatedSlips = allSlips.map((slip) => {
      if (slip.drawId === currentDraw.id && slip.status === "รอผล") {
        const isWin = checkWin(slip);
        return {
          ...slip,
          status: isWin ? ("ถูกรางวัล" as const) : ("ไม่ถูกรางวัล" as const),
        };
      }
      return slip;
    });

    // Save updated slips
    updatedSlips.forEach((slip) => {
      saveSlip(slip);
    });

    // Trigger storage event
    window.dispatchEvent(new Event("storage"));

    toast({
      variant: "success",
      title: "ปิดผลหวยสำเร็จ",
      description: "อัปเดตสถานะโพยเรียบร้อยแล้ว",
    });

    setShowEditDialog(false);
    loadData();
  };

  const handleEditResult = () => {
    if (!result) return;

    if (!result.canEdit) {
      toast({
        variant: "destructive",
        title: "ไม่สามารถแก้ไขได้",
        description: "สามารถแก้ไขเลขผลหวยได้เฉพาะภายใน 1 วันหลังจากปิดผล",
      });
      return;
    }

    setEditResult2Top(result.result2Top);
    setEditResult2Bottom(result.result2Bottom);
    setEditResult3Straight(result.result3Straight);
    // Auto-fill 3 ตัวโต๊ด from 3 ตัวตรง if exists, otherwise use saved value
    if (result.result3Straight.length === 3) {
      setEditResult3Tod(result.result3Straight);
    } else {
      setEditResult3Tod(result.result3Tod.join(""));
    }
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!result) return;

    if (!editResult2Top || !editResult2Bottom || !editResult3Straight || !editResult3Tod) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกเลขผลหวยให้ครบถ้วน",
      });
      return;
    }

    // Parse 3 ตัวโต๊ด (3 digits like "199")
    const todDigits = editResult3Tod.replace(/\D/g, ""); // Remove non-digits

    if (todDigits.length !== 3) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "เลข 3 ตัวโต๊ดต้องมี 3 ตัว",
      });
      return;
    }

    const todArray = todDigits.split("");

    if (!currentDraw) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่พบงวด",
      });
      return;
    }

    const updatedResult: LotteryResult = {
      ...result!,
      result2Top: editResult2Top.padStart(2, "0"),
      result2Bottom: editResult2Bottom.padStart(2, "0"),
      result3Straight: editResult3Straight.padStart(3, "0"),
      result3Tod: todArray,
    };

    // Save result to draw
    const updatedDraw: Draw = {
      ...currentDraw,
      result: updatedResult,
    };
    saveDraw(updatedDraw);
    setCurrentDraw(updatedDraw);
    setResult(updatedResult);

    // Re-check all slips for this draw with new result
    const allSlips = getSlips();
    const updatedSlips = allSlips.map((slip) => {
      if (slip.drawId === currentDraw.id &&
        (slip.status === "รอผล" || slip.status === "ถูกรางวัล" || slip.status === "ไม่ถูกรางวัล")) {
        const isWin = checkWin(slip);
        return {
          ...slip,
          status: isWin ? ("ถูกรางวัล" as const) : ("ไม่ถูกรางวัล" as const),
        };
      }
      return slip;
    });

    updatedSlips.forEach((slip) => {
      saveSlip(slip);
    });

    window.dispatchEvent(new Event("storage"));

    toast({
      variant: "success",
      title: "แก้ไขสำเร็จ",
      description: "อัปเดตเลขผลหวยและสถานะโพยเรียบร้อยแล้ว",
    });

    setShowEditDialog(false);
    loadData();
  };

  // Calculate profit/loss summary
  const calculateSummary = () => {
    const totalSales = slips.reduce((sum, slip) => sum + slip.totalAmount, 0);
    const winningSlips = slips.filter(slip => slip.status === "ถูกรางวัล");
    const totalPayout = winningSlips.reduce((sum, slip) => {
      // Find agent for this slip
        const agent = slip.agentId ? agents.find(a => a.id === slip.agentId) ?? null : null;
        // Calculate payout considering banned numbers
        return sum + (result ? calculateSlipPayout(slip, result, agent, currentDraw) : 0);
    }, 0);

    const profit = totalSales - totalPayout;

    return {
      totalSales,
      totalPayout,
      profit,
      winningCount: winningSlips.length,
      totalSlips: slips.length,
    };
  };

  const summary = calculateSummary();

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
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 pt-16 lg:pt-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">ปิดผลหวย</h1>
                <p className="text-muted-foreground">ปิดผลหวยและสรุปกำไร/ขาดทุน</p>
              </div>
              <div className="flex gap-2">
                {result ? (
                  <Button
                    variant="outline"
                    onClick={handleEditResult}
                    disabled={!result.canEdit}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {result.canEdit ? "แก้ไขเลขผลหวย" : "หมดเวลาการแก้ไข"}
                  </Button>
                ) : (
                  <Button onClick={() => setShowEditDialog(true)}>
                    <Trophy className="mr-2 h-4 w-4" />
                    ปิดผลหวย
                  </Button>
                )}
              </div>
            </div>

            {/* Current Result */}
            {result && (
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    เลขผลหวย
                  </CardTitle>
                  <CardDescription>
                    ปิดผลเมื่อ: {formatDate(result.closedAt)}
                    {result.canEdit && (
                      <Badge variant="outline" className="ml-2">
                        สามารถแก้ไขได้
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-500/10 rounded-lg border-2 border-blue-500/30">
                      <Label className="text-sm text-blue-200">2 ตัวบน</Label>
                      <p className="text-3xl font-bold text-blue-400 mt-2">
                        {result.result2Top}
                      </p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg border-2 border-green-500/30">
                      <Label className="text-sm text-green-200">2 ตัวล่าง</Label>
                      <p className="text-3xl font-bold text-green-400 mt-2">
                        {result.result2Bottom}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-500/10 rounded-lg border-2 border-purple-500/30">
                      <Label className="text-sm text-purple-200">3 ตัวตรง</Label>
                      <p className="text-3xl font-bold text-purple-400 mt-2">
                        {result.result3Straight}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-500/10 rounded-lg border-2 border-orange-500/30">
                      <Label className="text-sm text-orange-200">3 ตัวโต๊ด</Label>
                      <p className="text-3xl font-bold text-orange-400 mt-2">
                        {result.result3Tod.join("")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {result && (
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    {summary.profit >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    )}
                    สรุปกำไร/ขาดทุน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">จำนวนโพยทั้งหมด</Label>
                      <p className="text-2xl font-bold mt-2 text-foreground">{summary.totalSlips} ใบ</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">โพยที่ถูกรางวัล</Label>
                      <p className="text-2xl font-bold text-green-400 mt-2">
                        {summary.winningCount} ใบ
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">ยอดรับรวม</Label>
                      <p className="text-2xl font-bold mt-2 text-foreground">{formatCurrency(summary.totalSales)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">ยอดจ่ายรวม</Label>
                      <p className="text-2xl font-bold text-red-400 mt-2">
                        {formatCurrency(summary.totalPayout)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        {summary.profit >= 0 ? "กำไร" : "ขาดทุน"}
                      </Label>
                      <p
                        className={`text-3xl font-bold mt-2 ${summary.profit >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                      >
                        {formatCurrency(Math.abs(summary.profit))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Winning Slips */}
            {result && (
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="text-foreground">โพยที่ถูกรางวัล</CardTitle>
                  <CardDescription>
                    รายการโพยที่ถูกรางวัลทั้งหมด ({summary.winningCount} ใบ)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.winningCount === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>ไม่มีโพยที่ถูกรางวัล</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>เลขที่โพย</TableHead>
                            <TableHead>ชื่อลูกค้า</TableHead>
                            <TableHead>ยอดรวม</TableHead>
                            <TableHead>ยอดจ่าย</TableHead>
                            <TableHead>สถานะ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {slips
                            .filter((slip) => slip.status === "ถูกรางวัล")
                            .map((slip) => {
                              // Find agent for this slip
                              const agent = slip.agentId ? agents.find(a => a.id === slip.agentId) ?? null : null;
                              // Calculate payout considering banned numbers
                              const payout = result ? calculateSlipPayout(slip, result, agent, currentDraw) : 0;
                              return (
                                <TableRow key={slip.id}>
                                  <TableCell className="font-medium">
                                    {slip.slipNumber}
                                  </TableCell>
                                  <TableCell>{slip.customerName}</TableCell>
                                  <TableCell>{formatCurrency(slip.totalAmount)}</TableCell>
                                  <TableCell className="text-green-400 font-semibold">
                                    {formatCurrency(payout)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="default" className="bg-green-600 text-white">
                                      {slip.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No Result Message */}
            {!result && (
              <Card className="glass-card border-none">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">ยังไม่ได้ปิดผลหวย</h3>
                      <p className="text-gray-400 mt-2">
                        คลิกปุ่ม &ldquo;ปิดผลหวย&rdquo; เพื่อปิดผลและอัปเดตสถานะโพย
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Edit/Close Result Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {result ? "แก้ไขเลขผลหวย" : "ปิดผลหวย"}
            </DialogTitle>
            <DialogDescription>
              {result
                ? "แก้ไขเลขผลหวย (สามารถแก้ไขได้เฉพาะภายใน 1 วัน)"
                : "กรอกเลขผลหวยเพื่อปิดผลและอัปเดตสถานะโพย"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="result-2top">2 ตัวบน</Label>
              <Input
                id="result-2top"
                placeholder="00-99"
                maxLength={2}
                value={editResult2Top}
                onChange={(e) => setEditResult2Top(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result-2bottom">2 ตัวล่าง</Label>
              <Input
                id="result-2bottom"
                placeholder="00-99"
                maxLength={2}
                value={editResult2Bottom}
                onChange={(e) => setEditResult2Bottom(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result-3straight">3 ตัวตรง</Label>
              <Input
                id="result-3straight"
                placeholder="000-999"
                maxLength={3}
                value={editResult3Straight}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setEditResult3Straight(value);
                  // Auto-fill 3 ตัวโต๊ด from 3 ตัวตรง
                  if (value.length === 3) {
                    setEditResult3Tod(value);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result-3tod">3 ตัวโต๊ด (ดึงจาก 3 ตัวตรงอัตโนมัติ)</Label>
              <Input
                id="result-3tod"
                placeholder="000-999"
                maxLength={3}
                value={editResult3Tod}
                onChange={(e) => setEditResult3Tod(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                {editResult3Straight.length === 3
                  ? `เลข 3 ตัวโต๊ดดึงมาจากเลข 3 ตัวตรงอัตโนมัติ: ${editResult3Straight} (สามารถแก้ไขได้)`
                  : "กรอกเลข 3 ตัวตรงก่อน หรือกรอกเลข 3 ตัวต่อกัน เช่น 199"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={result ? handleSaveEdit : handleCloseResult}>
              <Save className="mr-2 h-4 w-4" />
              {result ? "บันทึกการแก้ไข" : "ปิดผลหวย"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
