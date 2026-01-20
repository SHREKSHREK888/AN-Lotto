"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, Edit } from "lucide-react";
import { Alerts } from "@/lib/mockData";

interface AlertsPanelProps {
  alerts: Alerts;
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>การแจ้งเตือน</CardTitle>
        <CardDescription>ข้อมูลสำคัญที่ต้องติดตาม</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Close Countdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="font-semibold text-sm">ใกล้ปิดรับ</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {alerts.closeCountdownText}
          </div>
        </div>

        <Separator />

        {/* Over Limit Numbers */}
        {alerts.overLimitNumbers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-sm">เลขเกินเพดาน</span>
            </div>
            <div className="space-y-2">
              {alerts.overLimitNumbers.map((num) => (
                <div
                  key={num.number}
                  className="flex items-center justify-between p-2 rounded-md bg-red-50 border border-red-200"
                >
                  <span className="font-mono font-semibold">{num.number}</span>
                  <Badge variant="destructive">
                    {formatCurrency(num.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Edit Log */}
        {alerts.edits.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm">มีการแก้ไขโพย</span>
            </div>
            <div className="space-y-2">
              {alerts.edits.slice(0, 3).map((edit, index) => (
                <div key={index} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-muted-foreground">
                      {formatTime(edit.timeISO)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {edit.slipId}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">{edit.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
