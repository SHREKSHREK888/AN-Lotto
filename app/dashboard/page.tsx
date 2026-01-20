"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Slip } from "@/lib/mockData";
import { getSlips, updateSlipStatus, getAgents, Agent } from "@/lib/storage";
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
    return storedSlips
      .filter((slip) => slip.status === "ถูกรางวัล" || slip.status === "จ่ายแล้ว")
      .reduce((sum, slip) => sum + (slip.totalAmount * 0.8), 0);
  }, [storedSlips]);

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
          <h1 className="text-3xl font-bold tracking-tight text-red-700">แดชบอร์ด</h1>
        </div>

        {/* System Summary */}
        <Card className="border border-slate-200 shadow-md bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              สรุประบบทั้งหมด
            </CardTitle>
            <CardDescription>ข้อมูลสรุปของระบบทั้งหมด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* สรุปโพย */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">โพย</h3>
                </div>
                <div className="space-y-2 pl-7">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ทั้งหมด:</span>
                    <span className="font-semibold">{storedSlips.length} ใบ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">รอผล:</span>
                    <Badge variant="outline">
                      {storedSlips.filter(s => s.status === "รอผล").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ถูกรางวัล:</span>
                    <Badge variant="default" className="bg-green-600">
                      {storedSlips.filter(s => s.status === "ถูกรางวัล").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ไม่ถูกรางวัล:</span>
                    <Badge variant="secondary">
                      {storedSlips.filter(s => s.status === "ไม่ถูกรางวัล").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">จ่ายแล้ว:</span>
                    <Badge variant="outline" className="bg-blue-50">
                      {storedSlips.filter(s => s.status === "จ่ายแล้ว").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ค้างจ่าย:</span>
                    <Badge variant="destructive">
                      {storedSlips.filter(s => s.status === "ค้างจ่าย").length}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>ยอดรวมทั้งหมด:</span>
                    <span className="text-blue-600">
                      {formatCurrency(storedSlips.reduce((sum, s) => sum + s.totalAmount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* สรุปเจ้ามือ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">เจ้ามือ</h3>
                </div>
                <div className="space-y-2 pl-7">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">จำนวนเจ้ามือ:</span>
                    <span className="font-semibold">{agents.length} คน</span>
                  </div>
                  {agents.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">รายชื่อ:</p>
                        {agents.map((agent) => (
                          <div key={agent.id} className="flex justify-between items-center text-sm">
                            <span className="truncate">{agent.name}</span>
                            <Badge variant="outline">
                              {agent.commissionPercent}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {agents.length === 0 && (
                    <p className="text-sm text-muted-foreground pl-2">ยังไม่มีเจ้ามือ</p>
                  )}
                </div>
              </div>

              {/* สรุปการส่งให้เจ้ามือ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg">การส่งให้เจ้ามือ</h3>
                </div>
                <div className="space-y-2 pl-7">
                  {/* โพยที่มีการเลือกเจ้ามือแล้ว */}
                  {(() => {
                    const slipsWithAgent = storedSlips.filter((slip) => slip.agentId);
                    const totalSentAmount = slipsWithAgent.reduce((sum, slip) => sum + slip.totalAmount, 0);
                    const totalSentSlips = slipsWithAgent.length;
                    
                    // คำนวณส่วนที่เราได้และจ่ายให้เจ้ามือ
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
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">จำนวนครั้ง:</span>
                          <span className="font-semibold">{sendHistory.length} ครั้ง</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">จำนวนโพยที่ส่ง:</span>
                          <span className="font-semibold">
                            {totalSentSlips} ใบ
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ยอดรวมที่ส่ง:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(totalSentAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ส่วนที่เราได้:</span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(totalCommission)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">จ่ายให้เจ้ามือ:</span>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(totalPayToAgent)}
                          </span>
                        </div>
                        {totalSentSlips === 0 && (
                          <p className="text-sm text-muted-foreground pt-2">ยังไม่มีประวัติการส่ง</p>
                        )}
                      </>
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
          <Card className="border border-slate-200 shadow-md bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Users className="h-5 w-5 text-red-600" />
                สรุปตามเจ้ามือ
              </CardTitle>
              <CardDescription>ข้อมูลและกำไรที่ได้จากเจ้ามือแต่ละคน</CardDescription>
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
                    <Card key={agent.id} className="border-l-4 border-l-red-500 bg-white/95 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            <Badge variant="outline" className="mt-1">
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
