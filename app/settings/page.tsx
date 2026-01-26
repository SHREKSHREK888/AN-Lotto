"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Lock, Key, Shield, AlertCircle, Palette } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { themes, getCurrentTheme, setTheme, Theme } from "@/lib/themes";

export default function SettingsPage() {
  const { toast } = useToast();
  const [shopName, setShopName] = useState("ร้านหวย");
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [address, setAddress] = useState("");
  const [autoGenerateSlipNumber, setAutoGenerateSlipNumber] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const router = useRouter();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Change PIN states
  const [showChangePinDialog, setShowChangePinDialog] = useState(false);
  const [oldPin, setOldPin] = useState<string[]>(Array(6).fill(""));
  const [newPin, setNewPin] = useState<string[]>(Array(6).fill(""));
  const [confirmNewPin, setConfirmNewPin] = useState<string[]>(Array(6).fill(""));
  const [pinStep, setPinStep] = useState<"old" | "new" | "confirm">("old");
  const oldPinRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const newPinRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const confirmNewPinRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Change password states
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  // Get PIN from localStorage or use default
  const getPin = (): string => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_pin") || "123456";
    }
    return "123456";
  };

  const CORRECT_PIN = getPin();

  // Check authentication on mount and load theme
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
      // Load current theme from localStorage
      if (typeof window !== "undefined") {
        const currentTheme = getCurrentTheme();
        setSelectedTheme(currentTheme);
        // Apply theme immediately
        setTheme(currentTheme.id);
      }
    }
  }, [router]);

  // Listen for theme changes from other tabs/components
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleThemeChange = () => {
      const currentTheme = getCurrentTheme();
      setSelectedTheme(currentTheme);
    };

    window.addEventListener("themechange", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  const handleSave = () => {
    // In a real app, this would save to backend or localStorage
    localStorage.setItem("settings", JSON.stringify({
      shopName,
      address,
      autoGenerateSlipNumber,
      notifications,
    }));
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "บันทึกการตั้งค่าเรียบร้อยแล้ว!",
    });
  };

  const handleClearDataClick = () => {
    setShowClearDataDialog(true);
  };

  const handleConfirmClearData = () => {
    setShowClearDataDialog(false);
    setPin(Array(6).fill(""));
    setShowPinDialog(true);
    // Focus first input after dialog opens
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  const handlePinChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are filled
    if (newPin.every(digit => digit !== "") && index === 5) {
      handlePinSubmit(newPin.join(""));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{1,6}$/.test(pastedData)) {
      const newPin = Array(6).fill("");
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit if 6 digits
      if (pastedData.length === 6) {
        handlePinSubmit(pastedData);
      }
    }
  };

  const handlePinSubmit = (enteredPin?: string) => {
    const pinToCheck = enteredPin || pin.join("");

    if (pinToCheck.length !== 6) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอก PIN ให้ครบ 6 หลัก",
      });
      return;
    }

    if (pinToCheck === CORRECT_PIN) {
      setShowPinDialog(false);
      setPin(Array(6).fill(""));

      // Final confirmation
      if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้!")) {
        localStorage.removeItem("lotto_slips");
        localStorage.removeItem("agent_sends");
        toast({
          variant: "success",
          title: "สำเร็จ",
          description: "ล้างข้อมูลเรียบร้อยแล้ว",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
      });
      setPin(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleClosePinDialog = () => {
    setShowPinDialog(false);
    setPin(Array(6).fill(""));
  };

  // Change PIN handlers
  const handleChangePinInput = (
    index: number,
    value: string,
    type: "old" | "new" | "confirm"
  ) => {
    if (value && !/^\d$/.test(value)) return;

    if (type === "old") {
      const newOldPin = [...oldPin];
      newOldPin[index] = value;
      setOldPin(newOldPin);
      if (value && index < 5) {
        oldPinRefs.current[index + 1]?.focus();
      }
      if (newOldPin.every((d) => d !== "") && index === 5) {
        const enteredOldPin = newOldPin.join("");
        if (enteredOldPin === CORRECT_PIN) {
          setTimeout(() => {
            setPinStep("new");
            newPinRefs.current[0]?.focus();
          }, 300);
        } else {
          toast({
            variant: "destructive",
            title: "ข้อผิดพลาด",
            description: "PIN เก่าไม่ถูกต้อง",
          });
          setOldPin(Array(6).fill(""));
          oldPinRefs.current[0]?.focus();
        }
      }
    } else if (type === "new") {
      const newNewPin = [...newPin];
      newNewPin[index] = value;
      setNewPin(newNewPin);
      if (value && index < 5) {
        newPinRefs.current[index + 1]?.focus();
      }
      if (newNewPin.every((d) => d !== "") && index === 5) {
        setTimeout(() => {
          setPinStep("confirm");
          confirmNewPinRefs.current[0]?.focus();
        }, 300);
      }
    } else {
      const newConfirmPin = [...confirmNewPin];
      newConfirmPin[index] = value;
      setConfirmNewPin(newConfirmPin);
      if (value && index < 5) {
        confirmNewPinRefs.current[index + 1]?.focus();
      }
      if (newConfirmPin.every((d) => d !== "") && index === 5) {
        handleChangePinSubmit(newConfirmPin.join(""));
      }
    }
  };

  const handleChangePinSubmit = (enteredConfirmPin?: string) => {
    const newPinValue = newPin.join("");
    const confirmPinValue = enteredConfirmPin || confirmNewPin.join("");

    if (newPinValue.length !== 6 || confirmPinValue.length !== 6) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอก PIN ให้ครบ 6 หลัก",
      });
      return;
    }

    if (newPinValue !== confirmPinValue) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "PIN ใหม่ไม่ตรงกัน กรุณาลองใหม่อีกครั้ง",
      });
      setNewPin(Array(6).fill(""));
      setConfirmNewPin(Array(6).fill(""));
      setPinStep("new");
      newPinRefs.current[0]?.focus();
      return;
    }

    // Save new PIN
    localStorage.setItem("admin_pin", newPinValue);
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "เปลี่ยน PIN เรียบร้อยแล้ว",
    });
    setShowChangePinDialog(false);
    setPinStep("old");
    setOldPin(Array(6).fill(""));
    setNewPin(Array(6).fill(""));
    setConfirmNewPin(Array(6).fill(""));
  };

  const handleCloseChangePinDialog = () => {
    setShowChangePinDialog(false);
    setPinStep("old");
    setOldPin(Array(6).fill(""));
    setNewPin(Array(6).fill(""));
    setConfirmNewPin(Array(6).fill(""));
  };

  // Change password handlers
  const handleChangePassword = () => {
    setPasswordError("");

    // Get stored password or use default
    const storedPassword = localStorage.getItem("user_password");
    const currentPassword = storedPassword || "admin123"; // Default for admin

    if (oldPassword !== currentPassword) {
      setPasswordError("รหัสผ่านเก่าไม่ถูกต้อง");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    // Save new password
    localStorage.setItem("user_password", newPassword);
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
    });
    setShowChangePasswordDialog(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleCloseChangePasswordDialog = () => {
    setShowChangePasswordDialog(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 pt-16 lg:pt-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">ตั้งค่า</h1>
                <p className="text-muted-foreground">จัดการการตั้งค่าระบบ</p>
              </div>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                บันทึก
              </Button>
            </div>

            {/* Settings Content */}
            <div className="space-y-6">
              {/* Shop Information */}
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="text-foreground">ข้อมูลร้าน</CardTitle>
                  <CardDescription className="text-muted-foreground">ข้อมูลพื้นฐานของร้านค้า</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop-name">ชื่อร้าน</Label>
                    <Input
                      id="shop-name"
                      placeholder="กรอกชื่อร้าน"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">ที่อยู่</Label>
                    <Input
                      id="address"
                      placeholder="กรอกที่อยู่ร้าน"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Theme Settings */}
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    ธีมสีหน้าเว็บ
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">เลือกธีมสีที่ต้องการใช้ในระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedTheme ? (
                    <div className="text-center py-4 text-muted-foreground">
                      กำลังโหลดธีม...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {themes.map((theme) => {
                        const baseColor = theme.colors.primary.split("-")[0];
                        const colorMap: Record<string, { 600: string; 700: string; 300: string }> = {
                          red: { 600: "#dc2626", 700: "#b91c1c", 300: "#fca5a5" },
                          blue: { 600: "#2563eb", 700: "#1d4ed8", 300: "#93c5fd" },
                          green: { 600: "#16a34a", 700: "#15803d", 300: "#86efac" },
                          purple: { 600: "#9333ea", 700: "#7e22ce", 300: "#c084fc" },
                          orange: { 600: "#ea580c", 700: "#c2410c", 300: "#fdba74" },
                          pink: { 600: "#db2777", 700: "#be185d", 300: "#f9a8d4" },
                          teal: { 600: "#0d9488", 700: "#0f766e", 300: "#5eead4" },
                          indigo: { 600: "#4f46e5", 700: "#4338ca", 300: "#a5b4fc" },
                          yellow: { 600: "#ca8a04", 700: "#a16207", 300: "#fde047" },
                          cyan: { 600: "#0891b2", 700: "#0e7490", 300: "#67e8f9" },
                          emerald: { 600: "#059669", 700: "#047857", 300: "#6ee7b7" },
                          violet: { 600: "#7c3aed", 700: "#6d28d9", 300: "#c4b5fd" },
                          amber: { 600: "#d97706", 700: "#b45309", 300: "#fcd34d" },
                          rose: { 600: "#e11d48", 700: "#be123c", 300: "#fda4af" },
                          sky: { 600: "#0284c7", 700: "#0369a1", 300: "#7dd3fc" },
                          lime: { 600: "#65a30d", 700: "#4d7c0f", 300: "#bef264" },
                          fuchsia: { 600: "#c026d3", 700: "#a21caf", 300: "#f0abfc" },
                          slate: { 600: "#475569", 700: "#334155", 300: "#cbd5e1" },
                          stone: { 600: "#57534e", 700: "#44403c", 300: "#d6d3d1" },
                          zinc: { 600: "#52525b", 700: "#3f3f46", 300: "#d4d4d8" },
                        };
                        const colors = colorMap[baseColor] || colorMap.red;

                        return (
                          <button
                            key={theme.id}
                            onClick={() => {
                              setSelectedTheme(theme);
                              setTheme(theme.id);
                              toast({
                                title: "เปลี่ยนธีมสำเร็จ",
                                description: `เปลี่ยนเป็นธีม "${theme.name}" เรียบร้อยแล้ว`,
                              });
                            }}
                            className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${selectedTheme.id === theme.id
                                ? "border-red-500 ring-2 ring-red-200"
                                : "border-slate-200 hover:border-slate-300"
                              }`}
                          >
                            <div className="space-y-2">
                              <div
                                className="h-12 w-full rounded-md border-2"
                                style={{
                                  background: `linear-gradient(135deg, ${colors[600]}, ${colors[700]})`,
                                  borderColor: colors[300],
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-4 w-4 rounded-full"
                                  style={{ backgroundColor: colors[600] }}
                                />
                                <span className="text-xs font-medium text-foreground">
                                  {theme.name}
                                </span>
                              </div>
                            </div>
                            {selectedTheme.id === theme.id && (
                              <div className="absolute top-1 right-1">
                                <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="text-foreground">การตั้งค่าระบบ</CardTitle>
                  <CardDescription className="text-muted-foreground">ปรับแต่งการทำงานของระบบ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-slip">สร้างเลขที่โพยอัตโนมัติ</Label>
                      <p className="text-sm text-muted-foreground">
                        สร้างเลขที่โพยอัตโนมัติเมื่อบันทึกโพยใหม่
                      </p>
                    </div>
                    <Switch
                      id="auto-slip"
                      checked={autoGenerateSlipNumber}
                      onCheckedChange={setAutoGenerateSlipNumber}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">เปิดการแจ้งเตือน</Label>
                      <p className="text-sm text-muted-foreground">
                        รับการแจ้งเตือนเกี่ยวกับระบบ
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="text-foreground">ความปลอดภัย</CardTitle>
                  <CardDescription className="text-muted-foreground">จัดการรหัสผ่านและ PIN</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Key className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">เปลี่ยนรหัสผ่าน</p>
                        <p className="text-sm text-muted-foreground">
                          เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบ
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowChangePasswordDialog(true);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError("");
                      }}
                    >
                      เปลี่ยนรหัสผ่าน
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">เปลี่ยน PIN</p>
                        <p className="text-sm text-muted-foreground">
                          เปลี่ยน PIN สำหรับการล้างข้อมูล
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowChangePinDialog(true);
                        setPinStep("old");
                        setOldPin(Array(6).fill(""));
                        setNewPin(Array(6).fill(""));
                        setConfirmNewPin(Array(6).fill(""));
                        setTimeout(() => oldPinRefs.current[0]?.focus(), 100);
                      }}
                    >
                      เปลี่ยน PIN
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="text-foreground">จัดการข้อมูล</CardTitle>
                  <CardDescription className="text-muted-foreground">การจัดการและสำรองข้อมูล</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">ส่งออกข้อมูล</p>
                      <p className="text-sm text-muted-foreground">
                        ส่งออกข้อมูลโพยทั้งหมดเป็นไฟล์ CSV
                      </p>
                    </div>
                    <Button variant="outline">
                      ส่งออก
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">ล้างข้อมูลทั้งหมด</p>
                      <p className="text-sm text-muted-foreground text-red-600">
                        ⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleClearDataClick}
                    >
                      ล้างข้อมูล
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการล้างข้อมูล</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้
              <br />
              <strong>คุณจะต้องกรอก PIN เพื่อยืนยันอีกครั้ง</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDataDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleConfirmClearData}>
              ใช่, ต้องการล้างข้อมูล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">ยืนยัน PIN</DialogTitle>
            <DialogDescription className="text-center">
              กรุณากรอก PIN 6 หลักเพื่อล้างข้อมูลทั้งหมด
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex justify-center gap-2 mb-4">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  onPaste={index === 0 ? handlePinPaste : undefined}
                  className="w-12 h-12 text-center text-xl font-bold focus:ring-2 focus:ring-red-500"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClosePinDialog}
              className="flex-1 sm:flex-none"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handlePinSubmit()}
              className="flex-1 sm:flex-none"
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-center">เปลี่ยนรหัสผ่าน</DialogTitle>
            <DialogDescription className="text-center">
              กรุณากรอกรหัสผ่านเก่าและรหัสผ่านใหม่
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>รหัสผ่านเก่า</Label>
              <Input
                type="password"
                placeholder="กรอกรหัสผ่านเก่า"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>รหัสผ่านใหม่</Label>
              <Input
                type="password"
                placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>ยืนยันรหัสผ่านใหม่</Label>
              <Input
                type="password"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleChangePassword();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseChangePasswordDialog}
            >
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleChangePassword}>
              เปลี่ยนรหัสผ่าน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change PIN Dialog */}
      <Dialog open={showChangePinDialog} onOpenChange={setShowChangePinDialog}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <DialogTitle className="text-center">
              {pinStep === "old"
                ? "ยืนยัน PIN เก่า"
                : pinStep === "new"
                  ? "ตั้งค่า PIN ใหม่"
                  : "ยืนยัน PIN ใหม่"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {pinStep === "old"
                ? "กรุณากรอก PIN เก่า 6 หลัก"
                : pinStep === "new"
                  ? "กรุณาตั้งค่า PIN ใหม่ 6 หลัก"
                  : "กรุณากรอก PIN ใหม่อีกครั้งเพื่อยืนยัน"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {pinStep === "old" && (
              <div className="flex justify-center gap-2">
                {oldPin.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      oldPinRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleChangePinInput(index, e.target.value, "old")
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && index > 0) {
                        oldPinRefs.current[index - 1]?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-xl font-bold focus:ring-2 focus:ring-purple-500"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            )}

            {pinStep === "new" && (
              <div className="flex justify-center gap-2">
                {newPin.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      newPinRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleChangePinInput(index, e.target.value, "new")
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && index > 0) {
                        newPinRefs.current[index - 1]?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-xl font-bold focus:ring-2 focus:ring-purple-500"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            )}

            {pinStep === "confirm" && (
              <div className="flex justify-center gap-2">
                {confirmNewPin.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      confirmNewPinRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleChangePinInput(index, e.target.value, "confirm")
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && index > 0) {
                        confirmNewPinRefs.current[index - 1]?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-xl font-bold focus:ring-2 focus:ring-purple-500"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseChangePinDialog}
            >
              ยกเลิก
            </Button>
            {pinStep === "old" && (
              <Button
                type="button"
                onClick={() => {
                  const enteredOldPin = oldPin.join("");
                  if (enteredOldPin === CORRECT_PIN) {
                    setPinStep("new");
                    setTimeout(() => newPinRefs.current[0]?.focus(), 100);
                  } else {
                    toast({
                      variant: "destructive",
                      title: "ข้อผิดพลาด",
                      description: "PIN เก่าไม่ถูกต้อง",
                    });
                    setOldPin(Array(6).fill(""));
                    oldPinRefs.current[0]?.focus();
                  }
                }}
                disabled={!oldPin.every((d) => d !== "")}
              >
                ต่อไป
              </Button>
            )}
            {pinStep === "new" && (
              <Button
                type="button"
                onClick={() => {
                  if (newPin.every((d) => d !== "")) {
                    setPinStep("confirm");
                    setTimeout(() => confirmNewPinRefs.current[0]?.focus(), 100);
                  }
                }}
                disabled={!newPin.every((d) => d !== "")}
              >
                ต่อไป
              </Button>
            )}
            {pinStep === "confirm" && (
              <Button
                type="button"
                onClick={() => handleChangePinSubmit()}
                disabled={!confirmNewPin.every((d) => d !== "")}
              >
                ยืนยัน
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
