"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Printer, CheckCircle } from "lucide-react";
import { Slip } from "@/lib/mockData";
import { getDrawById } from "@/lib/draw";

interface RecentSlipsTableProps {
  slips: Slip[];
  onView?: (slipId: string) => void;
  onPrint?: (slipId: string) => void;
  onMarkPaid?: (slipId: string) => void;
}

export function RecentSlipsTable({
  slips,
  onView,
  onPrint,
  onMarkPaid,
}: RecentSlipsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  };

  const getStatusVariant = (
    status: Slip["status"]
  ): "default" | "secondary" | "success" | "warning" | "destructive" => {
    switch (status) {
      case "จ่ายแล้ว":
        return "success";
      case "ถูกรางวัล":
        return "success";
      case "ไม่ถูกรางวัล":
        return "secondary";
      case "ค้างจ่าย":
        return "warning";
      case "รอผล":
      default:
        return "default";
    }
  };

  return (
    <Card className="glass-card border-none overflow-hidden">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full" />
          โพยล่าสุด
        </CardTitle>
        <CardDescription className="text-muted-foreground">รายการโพยที่บันทึกล่าสุด</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 dark:bg-black/20 hover:bg-muted/50 dark:hover:bg-black/20">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">เวลา</TableHead>
                <TableHead className="text-muted-foreground">เลขที่โพย</TableHead>
                <TableHead className="text-muted-foreground">ชื่อ</TableHead>
                <TableHead className="text-muted-foreground">งวด</TableHead>
                <TableHead className="text-right text-muted-foreground">ยอดรวม</TableHead>
                <TableHead className="text-muted-foreground">สถานะ</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips.length === 0 ? (
                <TableRow className="hover:bg-transparent border-border">
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                    ไม่มีข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                slips.map((slip) => {
                  const draw = slip.drawId ? getDrawById(slip.drawId) : null;
                  return (
                    <TableRow key={slip.id} className="border-border hover:bg-muted/30 dark:hover:bg-white/5 transition-colors group">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatTime(slip.createdAtISO)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors">{slip.slipNumber}</TableCell>
                      <TableCell className="text-foreground">{slip.customerName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {draw ? draw.label : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(slip.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(slip.status)} className="shadow-none">
                          {slip.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView?.(slip.id)}
                            title="ดู"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/20"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPrint?.(slip.id)}
                            title="พิมพ์"
                            className="text-muted-foreground hover:text-secondary hover:bg-secondary/20"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {slip.status === "ค้างจ่าย" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onMarkPaid?.(slip.id)}
                              title="ทำเครื่องหมายจ่ายแล้ว"
                              className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 hover:bg-green-500/20"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
