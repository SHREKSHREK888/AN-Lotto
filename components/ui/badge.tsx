import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-red-300 bg-red-600 text-white hover:bg-red-700",
        secondary:
          "border-slate-300 bg-slate-200 text-slate-900 hover:bg-slate-300",
        destructive:
          "border-red-300 bg-red-600 text-white hover:bg-red-700",
        outline: "text-red-700 border-red-300 bg-red-50 hover:bg-red-100",
        success: "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700",
        warning: "border-amber-300 bg-amber-500 text-white hover:bg-amber-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
