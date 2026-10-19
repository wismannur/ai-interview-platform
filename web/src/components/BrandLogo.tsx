import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withSubtitle?: boolean;
}

export default function BrandLogo({ className, size = "md", withSubtitle = false }: BrandLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div className={cn("relative flex items-center justify-center rounded-xl bg-slate-900 shadow-sm border border-slate-800 p-1.5 shrink-0", iconSizes[size])}>
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="brand_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path d="M20 16H34C40 16 44 19.5 44 25C44 30 40.5 33 35 33.5L44 48H35L27 35H25V48H20V16Z" fill="url(#brand_grad)" />
          <path d="M25 21V30H33C36 30 38 28.5 38 25.5C38 22.5 36 21 33 21H25Z" fill="#0f172a" />
          <circle cx="47" cy="18" r="4" fill="#06b6d4" />
          <circle cx="47" cy="18" r="2" fill="#ffffff" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm tracking-tight text-slate-900">
            Rakamin
          </span>
          <span className="font-medium text-sm text-indigo-600">
            AI Interview
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Enterprise
          </span>
        </div>
        {withSubtitle && (
          <span className="text-[11px] text-muted-foreground leading-none">
            Automated Competency Probing &amp; Scoring
          </span>
        )}
      </div>
    </div>
  );
}
