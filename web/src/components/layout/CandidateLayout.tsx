import { Outlet } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

export default function CandidateLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-13 py-2 flex items-center justify-between">
          <BrandLogo size="sm" />
          <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2.5 py-1 rounded-full border">
            Official Evaluation Session
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
