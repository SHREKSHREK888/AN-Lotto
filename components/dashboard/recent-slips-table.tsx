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
    <Card>
      <CardHeader>
        <CardTitle>โพยล่าสุด</CardTitle>
        <CardDescription>รายการโพยที่บันทึกล่าสุด</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>เลขที่โพย</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>งวด</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    ไม่มีข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                slips.map((slip) => {
                  const draw = slip.drawId ? getDrawById(slip.drawId) : null;
                  return (
                  <TableRow key={slip.id}>
                    <TableCell className="font-mono text-xs">
                      {formatTime(slip.createdAtISO)}
                    </TableCell>
                    <TableCell className="font-medium">{slip.slipNumber}</TableCell>
                    <TableCell>{slip.customerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {draw ? draw.label : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(slip.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(slip.status)}>
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onPrint?.(slip.id)}
                          title="พิมพ์"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {slip.status === "ค้างจ่าย" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onMarkPaid?.(slip.id)}
                            title="ทำเครื่องหมายจ่ายแล้ว"
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
