"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Plus,
  Send,
  Settings,
  LogOut,
  FileDown,
  Menu,
  X,
  Trophy,
  Calendar,
  Users,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getSlips } from "@/lib/storage";
import { useTheme } from "@/hooks/use-theme";

interface SidebarProps {
  onExport?: () => void;
}

export function Sidebar({ onExport }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");

  // Update active menu based on pathname
  useEffect(() => {
    if (pathname === "/dashboard") setActiveMenu("dashboard");
    else if (pathname === "/entry") setActiveMenu("entry");
    else if (pathname === "/draws") setActiveMenu("draws");
    else if (pathname === "/agents") setActiveMenu("agents");
    else if (pathname === "/lottery-result") setActiveMenu("lottery-result");
    else if (pathname === "/payment") setActiveMenu("payment");
    else if (pathname === "/settings") setActiveMenu("settings");
    else if (pathname === "/members") setActiveMenu("members");
    else if (pathname === "/activity-log") setActiveMenu("activity-log");
  }, [pathname]);

  const handleMenuClick = (menu: string, path: string) => {
    setActiveMenu(menu);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    router.push(path, { scroll: false });
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    // Default export functionality
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

  const isActive = (menu: string) => activeMenu === menu;

  // Get theme colors
  const baseColor = theme.colors.primary.split("-")[0];
  const colorMap: Record<string, { 600: string; 700: string; 800: string; 400: string; 500: string }> = {
    red: { 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 400: "#f87171", 500: "#ef4444" },
    blue: { 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 400: "#60a5fa", 500: "#3b82f6" },
    green: { 600: "#16a34a", 700: "#15803d", 800: "#166534", 400: "#4ade80", 500: "#22c55e" },
    purple: { 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 400: "#a78bfa", 500: "#8b5cf6" },
    orange: { 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 400: "#fb923c", 500: "#f97316" },
    pink: { 600: "#db2777", 700: "#be185d", 800: "#9f1239", 400: "#f472b6", 500: "#ec4899" },
    teal: { 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 400: "#2dd4bf", 500: "#14b8a6" },
    indigo: { 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 400: "#818cf8", 500: "#6366f1" },
    yellow: { 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 400: "#facc15", 500: "#eab308" },
    cyan: { 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 400: "#22d3ee", 500: "#06b6d4" },
    emerald: { 600: "#059669", 700: "#047857", 800: "#065f46", 400: "#34d399", 500: "#10b981" },
    violet: { 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 400: "#a78bfa", 500: "#8b5cf6" },
    amber: { 600: "#d97706", 700: "#b45309", 800: "#92400e", 400: "#fbbf24", 500: "#f59e0b" },
    rose: { 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 400: "#fb7185", 500: "#f43f5e" },
    sky: { 600: "#0284c7", 700: "#0369a1", 800: "#075985", 400: "#38bdf8", 500: "#0ea5e9" },
    lime: { 600: "#65a30d", 700: "#4d7c0f", 800: "#365314", 400: "#a3e635", 500: "#84cc16" },
    fuchsia: { 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 400: "#f0abfc", 500: "#d946ef" },
    slate: { 600: "#475569", 700: "#334155", 800: "#1e293b", 400: "#94a3b8", 500: "#64748b" },
    stone: { 600: "#57534e", 700: "#44403c", 800: "#292524", 400: "#a8a29e", 500: "#78716c" },
    zinc: { 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 400: "#a1a1aa", 500: "#71717a" },
  };
  const colors = colorMap[baseColor] || colorMap.red;

  return (
    <>
      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 border-r-2 shadow-xl transform transition-transform duration-300 ease-in-out lg:h-screen lg:flex-shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: `linear-gradient(to bottom, ${colors[700]}, ${colors[800]})`,
          borderColor: `${colors[400]}80`,
        }}
      >
        <div className="flex flex-col h-full lg:h-screen">
          {/* Sidebar Header */}
          <div 
            className="flex items-center justify-between p-4 border-b lg:justify-center"
            style={{
              borderColor: `${colors[500]}50`,
              backgroundColor: `${colors[800]}80`,
            }}
          >
            <h2 className="text-xl font-bold text-white drop-shadow-md">ระบบหวย</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-pink-500/30"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              onClick={() => handleMenuClick("dashboard", "/dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive("dashboard")
                  ? "text-white font-semibold shadow-md"
                  : "text-white/80 hover:opacity-80 hover:text-white"
              }`}
              style={isActive("dashboard") ? { backgroundColor: colors[600] } : {}}
              onMouseEnter={(e) => {
                if (!isActive("dashboard")) {
                  e.currentTarget.style.backgroundColor = `${colors[600]}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("dashboard")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">แดชบอร์ด</span>
            </button>
            
            <button
              onClick={() => handleMenuClick("entry", "/entry")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive("entry")
                  ? "text-white font-semibold shadow-md"
                  : "text-white/80 hover:opacity-80 hover:text-white"
              }`}
              style={isActive("entry") ? { backgroundColor: colors[600] } : {}}
              onMouseEnter={(e) => {
                if (!isActive("entry")) {
                  e.currentTarget.style.backgroundColor = `${colors[600]}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("entry")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">คีย์หวย</span>
            </button>
            
            <button
              onClick={() => handleMenuClick("draws", "/draws")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive("draws")
                  ? "text-white font-semibold shadow-md"
                  : "text-white/80 hover:opacity-80 hover:text-white"
              }`}
              style={isActive("draws") ? { backgroundColor: colors[600] } : {}}
              onMouseEnter={(e) => {
                if (!isActive("draws")) {
                  e.currentTarget.style.backgroundColor = `${colors[600]}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("draws")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">เปิดผล/ปิดผล</span>
            </button>
            
            <button
              onClick={() => handleMenuClick("agents", "/agents")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive("agents")
                  ? "text-white font-semibold shadow-md"
                  : "text-white/80 hover:opacity-80 hover:text-white"
              }`}
              style={isActive("agents") ? { backgroundColor: colors[600] } : {}}
              onMouseEnter={(e) => {
                if (!isActive("agents")) {
                  e.currentTarget.style.backgroundColor = `${colors[600]}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("agents")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Send className="h-5 w-5" />
              <span className="font-medium">ย้ายโพยหวยให้เจ้ามือ</span>
            </button>
            
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:opacity-80 hover:text-white transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors[600]}80`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <FileDown className="h-5 w-5" />
              <span className="font-medium">ส่งออกข้อมูล</span>
            </button>

            <button
              onClick={() => handleMenuClick("members", "/members")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive("members")
                  ? "text-white font-semibold shadow-md"
                  : "text-white/80 hover:opacity-80 hover:text-white"
              }`}
              style={isActive("members") ? { backgroundColor: colors[600] } : {}}
              onMouseEnter={(e) => {
                if (!isActive("members")) {
                  e.currentTarget.style.backgroundColor = `${colors[600]}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("members")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">จัดการสมาชิก</span>
            </button>

            <button
              onClick={() => handleMenuClick("activity-log", "/activity-log")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive("activity-log")
                  ? "text-white font-semibold shadow-md"
                  : "text-white/80 hover:opacity-80 hover:text-white"
              }`}
              style={isActive("activity-log") ? { backgroundColor: colors[600] } : {}}
              onMouseEnter={(e) => {
                if (!isActive("activity-log")) {
                  e.currentTarget.style.backgroundColor = `${colors[600]}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("activity-log")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Clock className="h-5 w-5" />
              <span className="font-medium">ประวัติการใช้งาน</span>
            </button>
            
            <button
              onClick={() => handleMenuClick("settings", "/settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive("settings")
                  ? "text-white font-semibold shadow-md"
                  : "text-white/80 hover:opacity-80 hover:text-white"
              }`}
              style={isActive("settings") ? { backgroundColor: colors[600] } : {}}
              onMouseEnter={(e) => {
                if (!isActive("settings")) {
                  e.currentTarget.style.backgroundColor = `${colors[600]}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("settings")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">ตั้งค่า</span>
            </button>
            
            <div 
              className="pt-4 border-t"
              style={{ borderColor: `${colors[500]}50` }}
            >
              <button
                onClick={() => setShowLogoutDialog(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:opacity-80 hover:text-white transition-all"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors[600]}B3`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">ออกจากระบบ</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-30 text-white shadow-md border"
        style={{
          backgroundColor: colors[700],
          borderColor: colors[500],
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors[600];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors[700];
        }}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการออกจากระบบ</DialogTitle>
            <DialogDescription>
              คุณต้องการออกจากระบบหรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="default" onClick={() => {
              logout();
              setShowLogoutDialog(false);
            }}>
              ออกจากระบบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
