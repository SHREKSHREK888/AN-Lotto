"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Slip } from "@/lib/mockData";
import { getSlips, updateSlipStatus, getAgents, Agent } from "@/lib/storage";
import { getDrawById, getCurrentDraw, getDraws, Draw } from "@/lib/draw";
import { calculateSlipPayout } from "@/lib/payout";
import { KPICard } from "@/components/dashboard/kpi-card";
import { RecentSlipsTable } from "@/components/dashboard/recent-slips-table";
import { AppLayout } from "@/components/layout/app-layout";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Wallet,
  Receipt,
  List,
  TrendingUp,
  AlertTriangle,
  Send,
  Users,
  BarChart3,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [storedSlips, setStoredSlips] = useState<Slip[]>([]);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sendHistory, setSendHistory] = useState<any[]>([]);

  // Check authentication and PIN setup on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      // Check if PIN is set up
      const pinSetupComplete = localStorage.getItem("pin_setup_complete");
      if (pinSetupComplete !== "true") {
        router.push("/setup-pin");
      } else {
        setIsAuthChecked(true);
      }
    }
  }, [router]);

  // Load data from localStorage
  useEffect(() => {
    if (isAuthChecked) {
      const loadData = () => {
        const saved = getSlips();
        setStoredSlips(saved);

        const savedAgents = getAgents();
        setAgents(savedAgents || []);

        try {
          const savedSends = localStorage.getItem("agent_sends");
          setSendHistory(savedSends ? JSON.parse(savedSends) : []);
        } catch {
          setSendHistory([]);
        }
      };

      // Load data immediately
      loadData();

      // Listen for storage events from other tabs/windows
      const handleStorageChange = () => {
        setTimeout(loadData, 100);
      };
      window.addEventListener("storage", handleStorageChange);

      // Also listen for custom storage events from same window (triggered by saveSlip)
      const handleCustomStorage = () => {
        setTimeout(loadData, 100);
      };

      // Listen for both native and custom storage events
      window.addEventListener("storage", handleCustomStorage);

      // Poll for changes when window is focused (for same-tab updates)
      const handleFocus = () => {
        loadData();
      };
      window.addEventListener("focus", handleFocus);

      // Reload when page becomes visible
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          loadData();
        }
      });

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("storage", handleCustomStorage);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [isAuthChecked]);

  // Reload data when component becomes visible (after navigation)
  useEffect(() => {
    if (isAuthChecked && typeof window !== "undefined") {
      const loadData = () => {
        const saved = getSlips();
        setStoredSlips(saved);

        const savedAgents = getAgents();
        setAgents(savedAgents || []);

        try {
          const savedSends = localStorage.getItem("agent_sends");
          setSendHistory(savedSends ? JSON.parse(savedSends) : []);
        } catch {
          setSendHistory([]);
        }
      };

      // Small delay to ensure we're getting the latest data after navigation
      const timeoutId = setTimeout(loadData, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthChecked]);

  // Sort slips by date
  const sortedSlips = useMemo(() => {
    return [...storedSlips].sort(
      (a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
    );
  }, [storedSlips]);

  // Calculate KPIs
  const totalSales = useMemo(() => {
    return storedSlips.reduce((sum, slip) => sum + slip.totalAmount, 0);
  }, [storedSlips]);

  const totalSlips = storedSlips.length;

  const totalItems = useMemo(() => {
    return storedSlips.reduce((sum, slip) => {
      return sum + (slip.items?.length || 0);
    }, 0);
  }, [storedSlips]);

  const totalPayout = useMemo(() => {
    const draws = getDraws();
    return storedSlips
      .filter((slip) => slip.status === "ถูกรางวัล" || slip.status === "จ่ายแล้ว")
      .reduce((sum, slip) => {
        // Find draw and result for this slip
        const draw = slip.drawId ? getDrawById(slip.drawId) : getCurrentDraw();
        const result = draw?.result || null;
        
        // Find agent for this slip
        const agent = slip.agentId ? agents.find(a => a.id === slip.agentId) ?? null : null;
        
        if (result) {
          return sum + calculateSlipPayout(slip, result, agent, draw);
        }
        // Fallback to old calculation if no result
        return sum + (slip.totalAmount * 0.8);
      }, 0);
  }, [storedSlips, agents]);

  const profit = useMemo(() => {
    return totalSales - totalPayout;
  }, [totalSales, totalPayout]);

  const unpaidAmount = useMemo(() => {
    return storedSlips
      .filter((slip) => slip.status === "ค้างจ่าย")
      .reduce((sum, slip) => sum + slip.totalAmount, 0);
  }, [storedSlips]);


  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const slips = getSlips();
    if (slips.length === 0) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่มีข้อมูลที่จะส่งออก",
      });
      return;
    }

    const headers = ["เลขที่โพย", "ชื่อลูกค้า", "ยอดรวม", "สถานะ", "วันที่บันทึก"];
    const rows = slips.map(slip => [
      slip.slipNumber,
      slip.customerName,
      slip.totalAmount,
      slip.status,
      new Date(slip.createdAtISO).toLocaleString("th-TH")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `โพย_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "ส่งออกข้อมูลเรียบร้อยแล้ว",
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6 w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">แดชบอร์ด</h1>
        </div>

        {/* System Summary */}
        <Card className="glass-card border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              สรุประบบทั้งหมด
            </CardTitle>
            <CardDescription className="text-muted-foreground">ข้อมูลสรุปของระบบทั้งหมด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* สรุปโพย */}
              <div className="space-y-4 p-4 rounded-xl bg-muted/30 dark:bg-white/5 border border-border dark:border-white/5 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">โพย</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">ทั้งหมด</span>
                    <span className="font-semibold text-foreground">{storedSlips.length} ใบ</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/50 dark:bg-black/20 p-2 rounded flex justify-between">
                      <span className="text-muted-foreground">รอผล</span>
                      <span className="text-yellow-600 dark:text-yellow-400">{storedSlips.filter(s => s.status === "รอผล").length}</span>
                    </div>
                    <div className="bg-muted/50 dark:bg-black/20 p-2 rounded flex justify-between">
                      <span className="text-muted-foreground">ถูกรางวัล</span>
                      <span className="text-green-600 dark:text-green-400">{storedSlips.filter(s => s.status === "ถูกรางวัล").length}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-end">
                    <span className="text-sm font-medium text-muted-foreground">ยอดรวมทั้งหมด</span>
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                      {formatCurrency(storedSlips.reduce((sum, s) => sum + s.totalAmount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* สรุปเจ้ามือ */}
              <div className="space-y-4 p-4 rounded-xl bg-muted/30 dark:bg-white/5 border border-border dark:border-white/5 hover:border-secondary/20 transition-all">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-secondary/20 text-secondary">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">เจ้ามือ</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">จำนวนเจ้ามือ</span>
                    <span className="font-semibold text-foreground">{agents.length} คน</span>
                  </div>

                  {agents.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">รายชื่อล่าสุด</p>
                      <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                        {agents.slice(0, 5).map((agent) => (
                          <div key={agent.id} className="flex justify-between items-center text-xs bg-muted/50 dark:bg-black/20 p-2 rounded">
                            <span className="truncate text-foreground">{agent.name}</span>
                            <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/5 text-[10px] h-5">
                              {agent.commissionPercent}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[100px] flex items-center justify-center text-xs text-muted-foreground italic">
                      ยังไม่มีข้อมูลเจ้ามือ
                    </div>
                  )}
                </div>
              </div>

              {/* สรุปการส่งให้เจ้ามือ */}
              <div className="space-y-4 p-4 rounded-xl bg-muted/30 dark:bg-white/5 border border-border dark:border-white/5 hover:border-accent/20 transition-all">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/20 text-accent">
                    <Send className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">การส่งยอด</h3>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const slipsWithAgent = storedSlips.filter((slip) => slip.agentId);
                    const totalSentAmount = slipsWithAgent.reduce((sum, slip) => sum + slip.totalAmount, 0);
                    const totalSentSlips = slipsWithAgent.length;
                    let totalCommission = 0;
                    let totalPayToAgent = 0;
                    slipsWithAgent.forEach((slip) => {
                      const agent = agents.find(a => a.id === slip.agentId);
                      if (agent) {
                        const commission = (slip.totalAmount * agent.commissionPercent) / 100;
                        totalCommission += commission;
                        totalPayToAgent += slip.totalAmount - commission;
                      }
                    });

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">ส่งแล้ว</span>
                          <span className="text-foreground">{totalSentSlips} ใบ</span>
                        </div>
                        <Separator className="bg-border" />
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">ยอดส่งรวม</span>
                            <span className="text-foreground">{formatCurrency(totalSentAmount)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">ส่วนแบ่ง</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(totalCommission)}</span>
                          </div>
                          <div className="flex justify-between text-sm pt-2">
                            <span className="text-muted-foreground">จ่ายเจ้ามือ</span>
                            <span className="text-accent font-bold">{formatCurrency(totalPayToAgent)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <KPICard
            title="ยอดรับรวม"
            value={totalSales}
            helperText="ทั้งหมด"
            icon={<Wallet className="h-4 w-4" />}
          />
          <KPICard
            title="จำนวนโพย"
            value={totalSlips}
            helperText="ใบ"
            icon={<Receipt className="h-4 w-4" />}
            formatAsCurrency={false}
          />
          <KPICard
            title="จำนวนรายการ"
            value={totalItems}
            helperText="รายการ"
            icon={<List className="h-4 w-4" />}
            formatAsCurrency={false}
          />
          <KPICard
            title="ยอดจ่าย"
            value={totalPayout}
            helperText="หลังออกผล"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KPICard
            title="กำไร/ขาดทุน"
            value={profit}
            helperText={profit >= 0 ? "กำไร" : "ขาดทุน"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KPICard
            title="ยอดค้างจ่าย"
            value={unpaidAmount}
            helperText="รอการจ่าย"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </div>

        {/* Agent Summary - ข้อมูลที่ได้จากเจ้ามือ */}
        {agents.length > 0 && (
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-red-600" />
                สรุปตามเจ้ามือ
              </CardTitle>
              <CardDescription className="text-muted-foreground">ข้อมูลและกำไรที่ได้จากเจ้ามือแต่ละคน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => {
                  // Calculate data from slips that came from this agent (agentId matches)
                  const slipsFromAgent = storedSlips.filter((slip) => slip.agentId === agent.id);
                  const totalSlipsReceived = slipsFromAgent.length;
                  const totalAmountReceived = slipsFromAgent.reduce((sum, slip) => sum + slip.totalAmount, 0);

                  // กำไรที่ได้จากเจ้ามือนี้ = ยอดรวมที่ได้รับ × เปอร์เซ็นต์ที่เราได้รับ
                  const profitFromAgent = (totalAmountReceived * agent.commissionPercent) / 100;

                  // ยอดที่ต้องจ่ายให้เจ้ามือ = ยอดรวม - กำไรที่เราได้
                  const amountToPayAgent = totalAmountReceived - profitFromAgent;

                  return (
                    <Card key={agent.id} className="border-l-4 border-l-primary bg-muted/30 dark:bg-white/5 border-t-0 border-r-0 border-b-0 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-foreground">{agent.name}</h3>
                            <Badge variant="outline" className="mt-1 text-secondary border-secondary/50">
                              ได้รับ {agent.commissionPercent}%
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">จำนวนโพยที่ได้รับ</p>
                            <p className="text-lg font-semibold">{totalSlipsReceived} ใบ</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ยอดรวมที่ได้รับ</p>
                            <p className="text-lg font-semibold">{formatCurrency(totalAmountReceived)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">กำไรที่ได้จากเจ้ามือนี้</p>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(profitFromAgent)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ยอดที่ต้องจ่ายให้เจ้ามือ</p>
                            <p className="text-lg font-semibold text-orange-600">
                              {formatCurrency(amountToPayAgent)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Summary of all agents */}
                {agents.length > 1 && (
                  <>
                    <Separator className="my-4" />
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">ยอดรวมทั้งหมดจากเจ้ามือ</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(
                              agents.reduce((sum, agent) => {
                                const slipsFromAgent = storedSlips.filter((slip) => slip.agentId === agent.id);
                                return sum + slipsFromAgent.reduce((s, slip) => s + slip.totalAmount, 0);
                              }, 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">กำไรรวมจากเจ้ามือทั้งหมด</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              agents.reduce((sum, agent) => {
                                const slipsFromAgent = storedSlips.filter((slip) => slip.agentId === agent.id);
                                const totalAmount = slipsFromAgent.reduce((s, slip) => s + slip.totalAmount, 0);
                                return sum + (totalAmount * agent.commissionPercent) / 100;
                              }, 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Slips Table */}
        <RecentSlipsTable
          slips={sortedSlips}
          onView={(slipId) => router.push(`/slip/${slipId}`)}
          onPrint={(slipId) => {
            router.push(`/slip/${slipId}`);
            setTimeout(() => window.print(), 500);
          }}
          onMarkPaid={(slipId) => {
            updateSlipStatus(slipId, "จ่ายแล้ว");
            setStoredSlips(getSlips());
          }}
        />
      </div>
    </AppLayout>
  );
}
