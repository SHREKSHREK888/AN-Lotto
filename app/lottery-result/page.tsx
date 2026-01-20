import { Suspense } from "react";
import LotteryResultClient from "./LotteryResultClient";

export default function LotteryResultPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <LotteryResultClient />
    </Suspense>
  );
}
