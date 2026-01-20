"use client";

import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50/70 flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 pt-16 lg:pt-0 overflow-y-auto">
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
