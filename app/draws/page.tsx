"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Play, Square, Trophy, Edit, Save } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import {
  getDraws,
  saveDraw,
  getCurrentDraw,
  setCurrentDrawId,
  getDrawById,
  Draw,
} from "@/lib/draw";
import { getSlips, saveSlip } from "@/lib/storage";
import { Slip } from "@/lib/mockData";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";

export default function DrawsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showCloseResultDialog, setShowCloseResultDialog] = useState(false);
  const [selectedDrawForResult, setSelectedDrawForResult] = useState<Draw | null>(null);
  const [drawLabel, setDrawLabel] = useState("");

  // Draw settings form states
  const [banned2Top, setBanned2Top] = useState("");
  const [banned2Bottom, setBanned2Bottom] = useState("");
  const [banned3Straight, setBanned3Straight] = useState("");
  const [banned3Tod, setBanned3Tod] = useState("");
  const [bannedRunning, setBannedRunning] = useState("");

  // Payout rates form states
  const [payout2Digit, setPayout2Digit] = useState("70");
  const [payout3Straight, setPayout3Straight] = useState("800");
  const [payout3Tod, setPayout3Tod] = useState("130");
  const [payoutRunning, setPayoutRunning] = useState("3");

  // Lottery result form states
  const [editResult2Top, setEditResult2Top] = useState("");
  const [editResult2Bottom, setEditResult2Bottom] = useState("");
  const [editResult3Straight, setEditResult3Straight] = useState("");
  const [editResult3Tod, setEditResult3Tod] = useState("");

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
      loadData();
    }
  }, [router]);

  const loadData = () => {
    const allDraws = getDraws();
    setDraws(allDraws.sort((a, b) =>
      new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
    ));

    const current = getCurrentDraw();
    setCurrentDraw(current);
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

  // Helper function to parse comma-separated numbers
  const parseNumbers = (input: string): string[] => {
    if (!input.trim()) return [];
    return input
      .split(",")
      .map(n => n.trim())
      .filter(n => n.length > 0);
  };

  const handleOpenDraw = () => {
    if (!drawLabel.trim()) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกชื่องวด",
      });
      return;
    }

    // Check if there's already an open draw
    const existingOpen = draws.find((d) => d.status === "open");
    if (existingOpen) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: `มีงวดที่เปิดอยู่แล้ว: ${existingOpen.label}`,
      });
      return;
    }

    // Parse banned numbers
    const bannedNumbers: Draw["bannedNumbers"] = {};
    const banned2TopList = parseNumbers(banned2Top);
    const banned2BottomList = parseNumbers(banned2Bottom);
    const banned3StraightList = parseNumbers(banned3Straight);
    const banned3TodList = parseNumbers(banned3Tod);
    const bannedRunningList = parseNumbers(bannedRunning);

    if (banned2TopList.length > 0) bannedNumbers["2 ตัวบน"] = banned2TopList;
    if (banned2BottomList.length > 0) bannedNumbers["2 ตัวล่าง"] = banned2BottomList;
    if (banned3StraightList.length > 0) bannedNumbers["3 ตัวตรง"] = banned3StraightList;
    if (banned3TodList.length > 0) bannedNumbers["3 ตัวโต๊ด"] = banned3TodList;
    if (bannedRunningList.length > 0) bannedNumbers["วิ่ง"] = bannedRunningList;

    // Parse payout rates
    const payoutRates: Draw["payoutRates"] = {};
    if (payout2Digit && !isNaN(parseFloat(payout2Digit))) {
      payoutRates["2 ตัวบน"] = parseFloat(payout2Digit);
      payoutRates["2 ตัวล่าง"] = parseFloat(payout2Digit);
      payoutRates["2 ตัวกลับ"] = parseFloat(payout2Digit);
    }
    if (payout3Straight && !isNaN(parseFloat(payout3Straight))) {
      payoutRates["3 ตัวตรง"] = parseFloat(payout3Straight);
      payoutRates["3 กลับ"] = parseFloat(payout3Straight);
    }
    if (payout3Tod && !isNaN(parseFloat(payout3Tod))) {
      payoutRates["3 ตัวโต๊ด"] = parseFloat(payout3Tod);
      payoutRates["ชุด"] = parseFloat(payout3Tod);
    }
    if (payoutRunning && !isNaN(parseFloat(payoutRunning))) {
      payoutRates["วิ่ง"] = parseFloat(payoutRunning);
    }

    const newDraw: Draw = {
      id: `draw_${Date.now()}`,
      label: drawLabel.trim(),
      status: "open",
      openedAt: new Date().toISOString(),
      bannedNumbers: Object.keys(bannedNumbers).length > 0 ? bannedNumbers : undefined,
      payoutRates: Object.keys(payoutRates).length > 0 ? payoutRates : undefined,
    };

    saveDraw(newDraw);
    setCurrentDrawId(newDraw.id);
    setShowOpenDialog(false);
    setDrawLabel("");
    setBanned2Top("");
    setBanned2Bottom("");
    setBanned3Straight("");
    setBanned3Tod("");
    setBannedRunning("");
    setPayout2Digit("70");
    setPayout3Straight("800");
    setPayout3Tod("130");
    setPayoutRunning("3");

    toast({
      variant: "success",
      title: "เปิดงวดสำเร็จ",
      description: `เปิดงวด ${newDraw.label} เรียบร้อยแล้ว`,
    });

    loadData();
  };

  const handleCloseDraw = () => {
    if (!currentDraw) return;

    const updatedDraw: Draw = {
      ...currentDraw,
      status: "closed",
      closedAt: new Date().toISOString(),
    };

    saveDraw(updatedDraw);
    setCurrentDrawId(null);

    toast({
      variant: "success",
      title: "ปิดงวดสำเร็จ",
      description: `ปิดงวด ${currentDraw.label} เรียบร้อยแล้ว`,
    });

    setShowCloseDialog(false);
    loadData();
  };

  const handleOpenCloseResultDialog = (draw: Draw) => {
    setSelectedDrawForResult(draw);
    setEditResult2Top("");
    setEditResult2Bottom("");
    setEditResult3Straight("");
    setEditResult3Tod("");
    setShowCloseResultDialog(true);
  };

  const checkWin = (slip: Slip, result: any): boolean => {
    if (!slip.items || slip.items.length === 0) return false;

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
        case "ชุด":
          const digits = number.split("");
          const resultDigits = result.result3Tod;
          if (digits.length === 3 && resultDigits.length === 3) {
            const allDigitsMatch = digits.every(d => resultDigits.includes(d));
            const countsMatch = digits.every(d => {
              const countInNumber = digits.filter((x: string) => x === d).length;
              const countInResult = resultDigits.filter((x: string) => x === d).length;
              return countInNumber <= countInResult;
            });
            if (allDigitsMatch && countsMatch) {
              isWin = true;
            }
          }
          break;
        case "วิ่ง":
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

      if (isWin) return true;
    }

    return false;
  };

  const handleCloseLotteryResult = () => {
    if (!selectedDrawForResult) return;

    if (!editResult2Top || !editResult2Bottom || !editResult3Straight || !editResult3Tod) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกเลขผลหวยให้ครบถ้วน",
      });
      return;
    }

    const todDigits = editResult3Tod.replace(/\D/g, "");

    if (todDigits.length !== 3) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "เลข 3 ตัวโต๊ดต้องมี 3 ตัว",
      });
      return;
    }

    const todArray = todDigits.split("");

    const newResult = {
      result2Top: editResult2Top.padStart(2, "0"),
      result2Bottom: editResult2Bottom.padStart(2, "0"),
      result3Straight: editResult3Straight.padStart(3, "0"),
      result3Tod: todArray,
      closedAt: new Date().toISOString(),
      canEdit: true,
    };

    // Save result to draw
    const updatedDraw: Draw = {
      ...selectedDrawForResult,
      result: newResult,
    };
    saveDraw(updatedDraw);

    // Check all slips for this draw and update status
    const allSlips = getSlips();
    const updatedSlips = allSlips.map((slip) => {
      if (slip.drawId === selectedDrawForResult.id && slip.status === "รอผล") {
        const isWin = checkWin(slip, newResult);
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
      description: `ปิดผลหวยสำหรับงวด ${selectedDrawForResult.label} เรียบร้อยแล้ว`,
    });

    setShowCloseResultDialog(false);
    setSelectedDrawForResult(null);
    loadData();
  };

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
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">เปิดผล/ปิดผล</h1>
            <p className="text-muted-foreground">จัดการงวดหวย</p>
          </div>
          <div className="flex gap-2">
            {currentDraw && currentDraw.status === "open" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleOpenCloseResultDialog(currentDraw)}
                  className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  ปิดผลหวย
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowCloseDialog(true)}
                >
                  <Square className="mr-2 h-4 w-4" />
                  ปิดงวด
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowOpenDialog(true)} className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20">
                <Play className="mr-2 h-4 w-4" />
                เปิดงวดใหม่
              </Button>
            )}
          </div>
        </div>

        {/* Current Draw */}
        {currentDraw && currentDraw.status === "open" && (
          <Card className="glass-card border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-green-400" />
                งวดที่เปิดอยู่
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">ชื่องวด</Label>
                  <p className="text-2xl font-bold mt-1 text-foreground">{currentDraw.label}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">เปิดเมื่อ</Label>
                  <p className="text-lg mt-1 text-foreground">{formatDate(currentDraw.openedAt)}</p>
                </div>

                {/* Show banned numbers if any */}
                {currentDraw.bannedNumbers && Object.keys(currentDraw.bannedNumbers).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border dark:border-white/10">
                    <Label className="text-sm font-semibold text-foreground">เลขอั้น:</Label>
                    <div className="space-y-1">
                      {currentDraw.bannedNumbers["2 ตัวบน"] && currentDraw.bannedNumbers["2 ตัวบน"].length > 0 && (
                        <p className="text-sm text-foreground">
                          <span className="font-medium text-muted-foreground">2 ตัวบน:</span> {currentDraw.bannedNumbers["2 ตัวบน"].join(", ")}
                        </p>
                      )}
                      {currentDraw.bannedNumbers["2 ตัวล่าง"] && currentDraw.bannedNumbers["2 ตัวล่าง"].length > 0 && (
                        <p className="text-sm text-foreground">
                          <span className="font-medium text-muted-foreground">2 ตัวล่าง:</span> {currentDraw.bannedNumbers["2 ตัวล่าง"].join(", ")}
                        </p>
                      )}
                      {currentDraw.bannedNumbers["3 ตัวตรง"] && currentDraw.bannedNumbers["3 ตัวตรง"].length > 0 && (
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-gray-400">3 ตัวตรง:</span> {currentDraw.bannedNumbers["3 ตัวตรง"].join(", ")}
                        </p>
                      )}
                      {currentDraw.bannedNumbers["3 ตัวโต๊ด"] && currentDraw.bannedNumbers["3 ตัวโต๊ด"].length > 0 && (
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-gray-400">3 ตัวโต๊ด:</span> {currentDraw.bannedNumbers["3 ตัวโต๊ด"].join(", ")}
                        </p>
                      )}
                      {currentDraw.bannedNumbers["วิ่ง"] && currentDraw.bannedNumbers["วิ่ง"].length > 0 && (
                        <p className="text-sm text-foreground">
                          <span className="font-medium text-muted-foreground">วิ่ง:</span> {currentDraw.bannedNumbers["วิ่ง"].join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Show payout rates if any */}
                {currentDraw.payoutRates && Object.keys(currentDraw.payoutRates).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border dark:border-white/10">
                    <Label className="text-sm font-semibold text-foreground">เปอร์เซ็นต์การจ่าย:</Label>
                    <div className="space-y-1">
                      {currentDraw.payoutRates["2 ตัวบน"] && (
                        <p className="text-sm text-foreground">
                          <span className="font-medium text-muted-foreground">2 ตัว:</span> {currentDraw.payoutRates["2 ตัวบน"]}%
                        </p>
                      )}
                      {currentDraw.payoutRates["3 ตัวตรง"] && (
                        <p className="text-sm text-foreground">
                          <span className="font-medium text-muted-foreground">3 ตัวตรง:</span> {currentDraw.payoutRates["3 ตัวตรง"]}%
                        </p>
                      )}
                      {currentDraw.payoutRates["3 ตัวโต๊ด"] && (
                        <p className="text-sm text-foreground">
                          <span className="font-medium text-muted-foreground">3 ตัวโต๊ด:</span> {currentDraw.payoutRates["3 ตัวโต๊ด"]}%
                        </p>
                      )}
                      {currentDraw.payoutRates["วิ่ง"] && (
                        <p className="text-sm text-foreground">
                          <span className="font-medium text-muted-foreground">วิ่ง:</span> {currentDraw.payoutRates["วิ่ง"]}%
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  เปิดอยู่
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Current Draw */}
        {!currentDraw && (
          <Card className="glass-card border-none">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Calendar className="mx-auto h-12 w-12 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white">ไม่มีงวดที่เปิดอยู่</h3>
                  <p className="text-gray-400 mt-2">
                    เปิดงวดใหม่เพื่อเริ่มรับโพยหวย
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Draws History */}
        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="text-white">ประวัติงวด</CardTitle>
            <CardDescription className="text-gray-400">งวดหวยทั้งหมด</CardDescription>
          </CardHeader>
          <CardContent>
            {draws.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>ยังไม่มีงวด</p>
              </div>
            ) : (
              <div className="space-y-4">
                {draws.map((draw) => (
                  <Card
                    key={draw.id}
                    className={`bg-white/5 border-none transition-all hover:bg-white/10 ${draw.status === "open" ? "ring-1 ring-green-500/50" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg text-white">{draw.label}</span>
                            <Badge
                              variant={draw.status === "open" ? "default" : "secondary"}
                              className={draw.status === "open" ? "bg-green-600" : "bg-white/10 text-gray-400"}
                            >
                              {draw.status === "open" ? "เปิดอยู่" : "ปิดแล้ว"}
                            </Badge>
                            {draw.result && (
                              <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                                มีผลหวยแล้ว
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            เปิดเมื่อ: {formatDate(draw.openedAt)}
                          </p>
                          {draw.closedAt && (
                            <p className="text-sm text-gray-400">
                              ปิดเมื่อ: {formatDate(draw.closedAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {draw.result ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/lottery-result?drawId=${draw.id}`)}
                              className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                            >
                              <Trophy className="mr-2 h-4 w-4" />
                              ดูผล
                            </Button>
                          ) : (
                            draw.status === "closed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCloseResultDialog(draw)}
                                className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                              >
                                <Trophy className="mr-2 h-4 w-4" />
                                ปิดผลหวย
                              </Button>
                            )
                          )}
                          {draw.status === "closed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/payment?drawId=${draw.id}`)}
                              className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              จ่ายหวย
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Open Draw Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent className="glass-card border-none text-white">
          <DialogHeader>
            <DialogTitle>เปิดงวดใหม่</DialogTitle>
            <DialogDescription className="text-gray-400">
              เปิดงวดหวยใหม่เพื่อเริ่มรับโพยหวย
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="draw-label">ชื่องวด</Label>
              <Input
                id="draw-label"
                placeholder="เช่น งวดวันที่ 1 ก.พ. 2569"
                value={drawLabel}
                onChange={(e) => setDrawLabel(e.target.value)}
                className="glass-input text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowOpenDialog(false);
              setDrawLabel("");
            }} className="hover:bg-white/10 hover:text-white">
              ยกเลิก
            </Button>
            <Button onClick={handleOpenDraw} className="bg-primary hover:bg-primary/90">
              <Play className="mr-2 h-4 w-4" />
              เปิดงวด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Draw Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="glass-card border-none text-white">
          <DialogHeader>
            <DialogTitle>ปิดงวด</DialogTitle>
            <DialogDescription className="text-gray-400">
              คุณแน่ใจหรือไม่ว่าต้องการปิดงวด {currentDraw?.label}?
              หลังจากปิดงวดแล้วจะไม่สามารถรับโพยหวยใหม่ได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCloseDialog(false)} className="hover:bg-white/10 hover:text-white">
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleCloseDraw}>
              <Square className="mr-2 h-4 w-4" />
              ปิดงวด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Lottery Result Dialog */}
      <Dialog open={showCloseResultDialog} onOpenChange={setShowCloseResultDialog}>
        <DialogContent className="glass-card border-none text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ปิดผลหวย</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedDrawForResult && `กรอกเลขผลหวยสำหรับงวด ${selectedDrawForResult.label}`}
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
                className="glass-input text-white"
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
                className="glass-input text-white"
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
                className="glass-input text-white"
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
                className="glass-input text-white"
              />
              <p className="text-xs text-gray-500">
                {editResult3Straight.length === 3
                  ? `เลข 3 ตัวโต๊ดดึงมาจากเลข 3 ตัวตรงอัตโนมัติ: ${editResult3Straight} (สามารถแก้ไขได้)`
                  : "กรอกเลข 3 ตัวตรงก่อน หรือกรอกเลข 3 ตัวต่อกัน เช่น 199"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowCloseResultDialog(false);
              setSelectedDrawForResult(null);
            }} className="hover:bg-white/10 hover:text-white">
              ยกเลิก
            </Button>
            <Button onClick={handleCloseLotteryResult} className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" />
              ปิดผลหวย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
