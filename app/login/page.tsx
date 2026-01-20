"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logActivity } from "@/lib/activity-log";
import { getMembers, Member } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get members from storage
    const members = getMembers();
    
    // Also check default credentials for backward compatibility
    const storedPassword = localStorage.getItem("user_password");
    const defaultCredentials = [
      { username: "admin", password: storedPassword || "admin123", role: "admin" as const },
      { username: "user", password: "user123", role: "user" as const },
    ];

    // Find member by username
    const member = members.find((m: Member) => m.username.toLowerCase() === username.toLowerCase());
    
    let isValid = false;
    let userRole: "admin" | "user" = "user";
    let userName = username;

    // Check if member exists and is active
    if (member) {
      if (member.status !== "active") {
        setError("บัญชีผู้ใช้นี้ถูกระงับการใช้งาน");
        setLoading(false);
        return;
      }
      
      // Check password (plain text comparison since we're storing plain text)
      if (member.password === password) {
        isValid = true;
        userRole = member.role;
        userName = member.name || member.username;
      }
    } else {
      // Fallback to default credentials
      const defaultCred = defaultCredentials.find(
        (cred) => cred.username.toLowerCase() === username.toLowerCase() && cred.password === password
      );
      if (defaultCred) {
        isValid = true;
        userRole = defaultCred.role;
      }
    }

    if (isValid) {
      // Save login state
      const loginData = {
        username: userName,
        originalUsername: member?.username || username,
        role: userRole,
        memberId: member?.id,
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem("auth", JSON.stringify(loginData));
      
      // Log login activity
      logActivity(
        "LOGIN",
        `เข้าสู่ระบบ: ${userName} (${member?.username || username})`,
        { username: member?.username || username, role: userRole }
      );
      
      // Check if PIN is already set
      const pinSetupComplete = localStorage.getItem("pin_setup_complete");
      
      // Redirect to setup PIN if not set, otherwise dashboard
      if (pinSetupComplete === "true") {
        router.push("/dashboard");
      } else {
        router.push("/setup-pin");
      }
    } else {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/70 to-indigo-50/70 p-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-200 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-md">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">เข้าสู่ระบบ</CardTitle>
          <CardDescription className="text-gray-600">
            กรุณาเข้าสู่ระบบเพื่อใช้งานระบบบันทึกโพยหวย
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !username || !password}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                ข้อมูลเข้าสู่ระบบทดสอบ (ถ้ายังไม่มีสมาชิก):
              </p>
              <div className="mt-2 text-xs text-center space-y-1 text-muted-foreground">
                <p>ผู้ดูแลระบบ: <span className="font-mono">admin / admin123</span></p>
                <p>ผู้ใช้ทั่วไป: <span className="font-mono">user / user123</span></p>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                หรือใช้ Username และ Password ที่สร้างจากหน้าจัดการสมาชิก
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
