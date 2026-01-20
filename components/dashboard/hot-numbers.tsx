"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HotNumber } from "@/lib/mockData";
import { Search } from "lucide-react";

interface HotNumbersProps {
  numbers2Top: HotNumber[];
  numbers2Bottom: HotNumber[];
  numbers3: HotNumber[];
  onViewSlips?: (number: string) => void;
}

export function HotNumbers({
  numbers2Top,
  numbers2Bottom,
  numbers3,
  onViewSlips,
}: HotNumbersProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderNumberList = (numbers: HotNumber[]) => {
    const maxAmount = Math.max(...numbers.map((n) => n.amount));

    return (
      <div className="space-y-3">
        {numbers.map((num, index) => (
          <div key={num.number} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-6">
                  #{index + 1}
                </span>
                <span className="font-mono font-semibold text-lg">
                  {num.number}
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">
                  {formatCurrency(num.amount)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onViewSlips?.(num.number)}
                >
                  <Search className="h-3 w-3 mr-1" />
                  ดูโพย
                </Button>
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(num.amount / maxAmount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>เลขยอดนิยม</CardTitle>
        <CardDescription>เลขที่ได้รับโพยมากที่สุด</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="2top" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="2top">2 ตัวบน</TabsTrigger>
            <TabsTrigger value="2bottom">2 ตัวล่าง</TabsTrigger>
            <TabsTrigger value="3">3 ตัว</TabsTrigger>
          </TabsList>
          <TabsContent value="2top" className="mt-4">
            {renderNumberList(numbers2Top)}
          </TabsContent>
          <TabsContent value="2bottom" className="mt-4">
            {renderNumberList(numbers2Bottom)}
          </TabsContent>
          <TabsContent value="3" className="mt-4">
            {renderNumberList(numbers3)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
