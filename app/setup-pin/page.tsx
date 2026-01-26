"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SetupPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [step, setStep] = useState<"setup" | "confirm">("setup");
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Check if already authenticated
  useEffect(() => {
    const { isAuthenticated } = require("@/lib/auth");
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Focus first input when step changes
  useEffect(() => {
    if (step === "setup") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handlePinChange = (
    index: number,
    value: string,
    type: "pin" | "confirm"
  ) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    if (type === "pin") {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      setError("");

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-move to confirm step if all 6 digits are filled
      if (newPin.every((digit) => digit !== "") && index === 5) {
        setTimeout(() => setStep("confirm"), 300);
      }
    } else {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = value;
      setConfirmPin(newConfirmPin);
      setError("");

      // Auto-focus next input
      if (value && index < 5) {
        confirmInputRefs.current[index + 1]?.focus();
      }

      // Auto-submit if all 6 digits are filled
      if (newConfirmPin.every((digit) => digit !== "") && index === 5) {
        handleSubmit(newConfirmPin.join(""));
      }
    }
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "pin" | "confirm"
  ) => {
    if (e.key === "Backspace") {
      if (type === "pin") {
        if (!pin[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        if (!confirmPin[index] && index > 0) {
          confirmInputRefs.current[index - 1]?.focus();
        }
      }
    }
  };

  const handlePinPaste = (
    e: React.ClipboardEvent,
    type: "pin" | "confirm"
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{1,6}$/.test(pastedData)) {
      if (type === "pin") {
        const newPin = Array(6).fill("");
        for (let i = 0; i < pastedData.length; i++) {
          newPin[i] = pastedData[i];
        }
        setPin(newPin);
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();

        if (pastedData.length === 6) {
          setTimeout(() => setStep("confirm"), 300);
        }
      } else {
        const newConfirmPin = Array(6).fill("");
        for (let i = 0; i < pastedData.length; i++) {
          newConfirmPin[i] = pastedData[i];
        }
        setConfirmPin(newConfirmPin);
        const nextIndex = Math.min(pastedData.length, 5);
        confirmInputRefs.current[nextIndex]?.focus();

        if (pastedData.length === 6) {
          handleSubmit(pastedData);
        }
      }
    }
  };

  const handleSubmit = (enteredConfirmPin?: string) => {
    const pinToCheck = enteredConfirmPin || confirmPin.join("");
    const originalPin = pin.join("");

    if (pinToCheck.length !== 6 || originalPin.length !== 6) {
      setError("กรุณากรอก PIN ให้ครบ 6 หลัก");
      return;
    }

    if (pinToCheck !== originalPin) {
      setError("PIN ไม่ตรงกัน กรุณาลองใหม่อีกครั้ง");
      setConfirmPin(Array(6).fill(""));
      confirmInputRefs.current[0]?.focus();
      return;
    }

    // Save PIN to localStorage
    localStorage.setItem("admin_pin", originalPin);

    // Mark PIN as set
    localStorage.setItem("pin_setup_complete", "true");

    // Redirect to dashboard
    router.push("/dashboard");
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("setup");
      setConfirmPin(Array(6).fill(""));
      setError("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-card border-none w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "setup" ? "ตั้งค่า PIN" : "ยืนยัน PIN"}
          </CardTitle>
          <CardDescription>
            {step === "setup"
              ? "กรุณาตั้งค่า PIN 6 หลักสำหรับการล้างข้อมูล"
              : "กรุณากรอก PIN อีกครั้งเพื่อยืนยัน"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {step === "setup" ? (
              <div>
                <Label className="mb-4 block text-center">
                  กรอก PIN 6 หลัก
                </Label>
                <div className="flex justify-center gap-2">
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
                      onChange={(e) =>
                        handlePinChange(index, e.target.value, "pin")
                      }
                      onKeyDown={(e) =>
                        handlePinKeyDown(index, e, "pin")
                      }
                      onPaste={index === 0 ? (e) => handlePinPaste(e, "pin") : undefined}
                      className="w-12 h-12 text-center text-xl font-bold focus:ring-2 focus:ring-primary"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <Label className="mb-4 block text-center">
                  กรอก PIN อีกครั้งเพื่อยืนยัน
                </Label>
                <div className="flex justify-center gap-2">
                  {confirmPin.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        confirmInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) =>
                        handlePinChange(index, e.target.value, "confirm")
                      }
                      onKeyDown={(e) =>
                        handlePinKeyDown(index, e, "confirm")
                      }
                      onPaste={
                        index === 0
                          ? (e) => handlePinPaste(e, "confirm")
                          : undefined
                      }
                      className="w-12 h-12 text-center text-xl font-bold focus:ring-2 focus:ring-primary"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {step === "confirm" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  ย้อนกลับ
                </Button>
              )}
              <Button
                type="button"
                onClick={() => {
                  if (step === "setup") {
                    if (pin.every((d) => d !== "")) {
                      setStep("confirm");
                    } else {
                      setError("กรุณากรอก PIN ให้ครบ 6 หลัก");
                    }
                  } else {
                    handleSubmit();
                  }
                }}
                className={step === "confirm" ? "flex-1" : "w-full"}
                disabled={
                  step === "setup"
                    ? !pin.every((d) => d !== "")
                    : !confirmPin.every((d) => d !== "")
                }
              >
                {step === "setup" ? "ต่อไป" : "ยืนยัน"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
