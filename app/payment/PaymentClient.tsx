"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { getSlips, saveSlip } from "@/lib/storage";
import { getDrawById, Draw } from "@/lib/draw";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Slip } from "@/lib/mockData";

export default function PaymentClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const drawId = searchParams.get("drawId");
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [slips, setSlips] = useState<Slip[]>([]);

  const loadData = useCallback(() => {
    if (!drawId) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่พบงวด",
      });
      router.push("/draws");
      return;
    }

    const draw = getDrawById(drawId);
    if (!draw) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่พบงวด",
      });
      router.push("/draws");
      return;
    }

    setCurrentDraw(draw);

    // Load slips for this draw
    const allSlips = getSlips();
    const drawSlips = allSlips.filter(slip => slip.drawId === draw.id);
    setSlips(drawSlips);
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

  // Calculate payout for a slip
  const calculatePayout = (slip: Slip): number => {
    if (!slip.items) return 0;
    let payout = 0;
    slip.items.forEach((item) => {
      switch (item.type) {
        case "2 ตัวบน":
        case "2 ตัวล่าง":
        case "2 ตัวกลับ":
        case "2 กลับ (3 ตัว)":
          payout += item.amount * 70;
          break;
        case "3 ตัวตรง":
        case "3 ตัวบน":
        case "3 กลับ":
          payout += item.amount * 800;
          break;
        case "3 ตัวโต๊ด":
        case "ชุด":
          payout += item.amount * 130;
          break;
        case "วิ่ง":
        case "วิ่งบน":
        case "วิ่งล่าง":
          payout += item.amount * 3;
          break;
      }
    });
    return payout;
  };

  const handleMarkPaid = (slipId: string) => {
    const updatedSlips = slips.map((slip) => {
      if (slip.id === slipId && slip.status === "ถูกรางวัล") {
        return {
          ...slip,
          status: "จ่ายแล้ว" as const,
        };
      }
      return slip;
    });

    const updatedSlip = updatedSlips.find(s => s.id === slipId);
    if (updatedSlip) {
      saveSlip(updatedSlip);
      setSlips(updatedSlips);
      window.dispatchEvent(new Event("storage"));
      
      toast({
        variant: "success",
        title: "สำเร็จ",
        description: "ทำเครื่องหมายจ่ายแล้ว",
      });
    }
  };

  const handleMarkAllPaid = () => {
    const winningSlips = slips.filter(slip => slip.status === "ถูกรางวัล");
    if (winningSlips.length === 0) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่มีโพยที่ต้องจ่าย",
      });
      return;
    }

    winningSlips.forEach((slip) => {
      const updatedSlip = {
        ...slip,
        status: "จ่ายแล้ว" as const,
      };
      saveSlip(updatedSlip);
    });

    setSlips(slips.map(slip => {
      if (slip.status === "ถูกรางวัล") {
        return { ...slip, status: "จ่ายแล้ว" as const };
      }
      return slip;
    }));

    window.dispatchEvent(new Event("storage"));

    toast({
      variant: "success",
      title: "สำเร็จ",
      description: `ทำเครื่องหมายจ่ายแล้วทั้งหมด ${winningSlips.length} ใบ`,
    });
  };

  // Calculate summary
  const winningSlips = slips.filter(slip => slip.status === "ถูกรางวัล");
  const paidSlips = slips.filter(slip => slip.status === "จ่ายแล้ว");
  const totalPayout = winningSlips.reduce((sum, slip) => sum + calculatePayout(slip), 0);
  const totalPaid = paidSlips.reduce((sum, slip) => sum + calculatePayout(slip), 0);
  const remainingPayout = totalPayout - totalPaid;

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  if (!currentDraw) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <h2 className="text-2xl font-bold">ไม่พบงวด</h2>
                  <p className="text-muted-foreground mt-2">
                    ไม่พบข้อมูลงวดที่ต้องการ
                  </p>
                </div>
                <Button asChild>
                  <a href="/draws">กลับไปหน้าเปิดผล/ปิดผล</a>
                </Button>
              </div>
            </CardContent>
          </Card>
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
                <h1 className="text-3xl font-bold tracking-tight">จ่ายหวยงวดชนงวด</h1>
                <p className="text-muted-foreground">{currentDraw.label}</p>
              </div>
              {winningSlips.length > 0 && (
                <Button onClick={handleMarkAllPaid}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  ทำเครื่องหมายจ่ายทั้งหมด
                </Button>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    จำนวนโพยที่ถูกรางวัล
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {winningSlips.length} ใบ
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    ยอดจ่ายรวม
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalPayout)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    ยอดค้างจ่าย
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(remainingPayout)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Winning Slips Table */}
            <Card>
              <CardHeader>
                <CardTitle>โพยที่ถูกรางวัล</CardTitle>
                <CardDescription>
                  รายการโพยที่ถูกรางวัลทั้งหมด ({winningSlips.length} ใบ)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {winningSlips.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>ไม่มีโพยที่ถูกรางวัล</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>เลขที่โพย</TableHead>
                          <TableHead>ชื่อลูกค้า</TableHead>
                          <TableHead className="text-right">ยอดรวม</TableHead>
                          <TableHead className="text-right">ยอดจ่าย</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead className="text-right">การดำเนินการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {winningSlips.map((slip) => {
                          const payout = calculatePayout(slip);
                          return (
                            <TableRow key={slip.id}>
                              <TableCell className="font-medium">
                                {slip.slipNumber}
                              </TableCell>
                              <TableCell>{slip.customerName}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(slip.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                {formatCurrency(payout)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="default" className="bg-green-600">
                                  {slip.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkPaid(slip.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  จ่ายแล้ว
                                </Button>
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
          </div>
        </main>
      </div>
    </div>
  );
}
