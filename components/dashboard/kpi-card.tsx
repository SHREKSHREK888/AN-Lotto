"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  helperText?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  formatAsCurrency?: boolean;
}

export function KPICard({ title, value, helperText, trend, icon, formatAsCurrency = true }: KPICardProps) {
  const formattedValue = formatAsCurrency
    ? new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    : new Intl.NumberFormat("th-TH").format(value);

  return (
    <Card className="bg-white/95 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
        {icon && <div className="text-red-600">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-700">{formattedValue}</div>
        {helperText && (
          <p className="text-xs text-gray-600 mt-1">{helperText}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-2 font-semibold ${
            trend.isPositive ? "text-emerald-600" : "text-rose-600"
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
