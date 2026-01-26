"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logActivity } from "@/lib/activity-log";
import { getMembers, Member } from "@/lib/storage";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ... (Keep existing logic unchanged)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800)); // Slightly longer for effect

    const members = getMembers();
    const storedPassword = localStorage.getItem("user_password");
    const defaultCredentials = [
      { username: "admin", password: storedPassword || "admin123", role: "admin" as const },
      { username: "user", password: "user123", role: "user" as const },
    ];

    const member = members.find((m: Member) => m.username.toLowerCase() === username.toLowerCase());

    let isValid = false;
    let userRole: "admin" | "user" = "user";
    let userName = username;

    if (member) {
      if (member.status !== "active") {
        setError("บัญชีผู้ใช้นี้ถูกระงับการใช้งาน");
        setLoading(false);
        return;
      }
      if (member.password === password) {
        isValid = true;
        userRole = member.role;
        userName = member.name || member.username;
      }
    } else {
      const defaultCred = defaultCredentials.find(
        (cred) => cred.username.toLowerCase() === username.toLowerCase() && cred.password === password
      );
      if (defaultCred) {
        isValid = true;
        userRole = defaultCred.role;
      }
    }

    if (isValid) {
      const loginData = {
        username: userName,
        originalUsername: member?.username || username,
        role: userRole,
        memberId: member?.id,
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem("auth", JSON.stringify(loginData));

      logActivity(
        "LOGIN",
        `เข้าสู่ระบบ: ${userName} (${member?.username || username})`,
        { username: member?.username || username, role: userRole }
      );

      const pinSetupComplete = localStorage.getItem("pin_setup_complete");

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
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-white/10 shadow-2xl relative overflow-hidden">
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <motion.div
              className="flex justify-center mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 shadow-lg shadow-primary/20">
                <div className="w-full h-full rounded-2xl bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>
            <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight">
              Lotto Premium
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              ระบบจัดการโพยหวยที่ทันสมัยที่สุด
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">ชื่อผู้ใช้</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-hover:text-primary" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 glass-input text-white placeholder:text-gray-600"
                    required
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">รหัสผ่าน</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-hover:text-primary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 glass-input text-white placeholder:text-gray-600"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-lg shadow-primary/25 font-semibold text-lg"
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </Button>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-center text-gray-500">
                  เข้าระบบเพื่อเริ่มต้นใช้งาน • Lotto Premium System
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
