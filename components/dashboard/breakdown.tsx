"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BreakdownRow } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";

interface BreakdownProps {
  data: BreakdownRow[];
}

export function Breakdown({ data }: BreakdownProps) {
  const maxAmount = Math.max(...data.map((row) => row.salesAmount));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายละเอียดตามประเภท</CardTitle>
        <CardDescription>ยอดรับและยอดจ่ายแยกตามประเภทการเล่น</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((row) => (
            <div key={row.typeLabel} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.typeLabel}</span>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(row.salesAmount)}</div>
                  {row.payoutAmount !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      จ่าย: {formatCurrency(row.payoutAmount)}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(row.salesAmount / maxAmount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
