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
    <Card className="glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/20 hover:border-primary/30 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
        {icon && <div className="text-primary group-hover:text-accent transition-colors">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-all">{formattedValue}</div>
        {helperText && (
          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-2 font-semibold ${trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
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
