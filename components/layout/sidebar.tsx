"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Calendar,
  Users,
  Clock,
  Sparkles,
  ChevronRight,
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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { Sun, Moon } from "lucide-react";

interface SidebarProps {
  onExport?: () => void;
}

export function Sidebar({ onExport }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { theme, toggleTheme, mounted } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");

  // Update active menu based on pathname
  useEffect(() => {
    if (pathname.includes("/dashboard")) setActiveMenu("dashboard");
    else if (pathname.includes("/entry")) setActiveMenu("entry");
    else if (pathname.includes("/draws")) setActiveMenu("draws");
    else if (pathname.includes("/agents")) setActiveMenu("agents");
    else if (pathname.includes("/lottery-result")) setActiveMenu("lottery-result");
    else if (pathname.includes("/payment")) setActiveMenu("payment");
    else if (pathname.includes("/settings")) setActiveMenu("settings");
    else if (pathname.includes("/members")) setActiveMenu("members");
    else if (pathname.includes("/activity-log")) setActiveMenu("activity-log");
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
    const slips = getSlips();
    if (slips.length === 0) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่มีข้อมูลที่จะส่งออก",
      });
      return;
    }

    // ... (Keep existing export logic simplified for brevity or functionality)
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
      variant: "default",
      className: "bg-green-600 text-white border-none",
      title: "สำเร็จ",
      description: "ส่งออกข้อมูลเรียบร้อยแล้ว",
    });
  };

  const menuItems = [
    { id: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard, path: "/dashboard" },
    { id: "entry", label: "คีย์หวย", icon: Plus, path: "/entry" },
    { id: "draws", label: "เปิดผล/ปิดผล", icon: Calendar, path: "/draws" },
    { id: "agents", label: "ย้ายโพยให้เจ้ามือ", icon: Send, path: "/agents" },
    { id: "members", label: "จัดการสมาชิก", icon: Users, path: "/members" },
    { id: "activity-log", label: "ประวัติการใช้งาน", icon: Clock, path: "/activity-log" },
    { id: "settings", label: "ตั้งค่า", icon: Settings, path: "/settings" },
  ];

  return (
    <>
      <AnimatePresence>
        {(sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 flex-shrink-0",
              "bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950",
              "border-r border-border dark:border-white/10 lg:translate-x-0",
              "backdrop-blur-xl shadow-xl"
            )}
          >
            <div className="flex flex-col h-full relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 left-0 w-full h-24 bg-primary/20 blur-3xl -z-10" />

              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/5">
                      <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Lotto
                    </h2>
                    <p className="text-xs text-muted-foreground">Premium System</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Sidebar Menu */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {menuItems.map((item) => {
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id, item.path)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                        isActive
                          ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/10 border border-primary/20"
                          : "text-foreground hover:bg-muted/50 dark:hover:bg-white/5"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 -z-10"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}

                      <div className="flex items-center gap-3 relative z-10">
                        <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                        <span className="font-medium">{item.label}</span>
                      </div>

                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-white"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}

                <div className="mt-4 pt-4 border-t border-border dark:border-white/10 space-y-2">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/50 dark:hover:bg-white/5 transition-all group"
                  >
                    {mounted && theme === "dark" ? (
                      <>
                        <Sun className="h-5 w-5 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors" />
                        <span className="font-medium">โหมดสว่าง</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-5 w-5 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                        <span className="font-medium">โหมดมืด</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/50 dark:hover:bg-white/5 transition-all group"
                  >
                    <FileDown className="h-5 w-5 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
                    <span className="font-medium">ส่งออกข้อมูล</span>
                  </button>
                </div>
              </nav>

              {/* Bottom Section */}
              <div className="p-4 border-t border-border dark:border-white/5 bg-muted/30 dark:bg-black/20">
                <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Toggle Button */}
      {/* Only show when sidebar is closed and on mobile, but handled by parent layout logic usually. 
             Since sidebar is `fixed lg:sticky`, we need a fixed toggle for mobile if it's not open.
         */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-4 left-4 z-40 bg-background/80 backdrop-blur-md border border-border dark:border-white/10 shadow-lg text-foreground"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}


      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="glass-card border-border dark:border-white/10 text-foreground sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">ยืนยันการออกจากระบบ</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              คุณต้องการออกจากระบบหรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="ghost"
              onClick={() => setShowLogoutDialog(false)}
              className="hover:bg-muted hover:text-foreground"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                logout();
                setShowLogoutDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-900/20"
            >
              ออกจากระบบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
