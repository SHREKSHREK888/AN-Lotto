import { Suspense } from "react";
import PaymentClient from "./PaymentClient";

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <PaymentClient />
    </Suspense>
  );
}
