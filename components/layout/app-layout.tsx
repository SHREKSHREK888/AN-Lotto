import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen w-full overflow-hidden flex bg-background relative">
      {/* Global Background Effects are in globals.css, but we can add specific layer here if needed */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 dark:opacity-100 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Top Mesh/Glow for content area */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
