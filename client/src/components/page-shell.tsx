import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const widthMap: Record<"sm" | "md" | "lg" | "xl" | "full", string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  full: "max-w-none",
};

interface PageShellProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  maxWidth?: keyof typeof widthMap;
  bleed?: boolean;
  padding?: "none" | "sm" | "md";
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
  maxWidth = "xl",
  bleed = false,
  padding = "md",
}: PageShellProps) {
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "sm"
        ? "py-4 sm:py-6"
        : "py-6 sm:py-8";

  return (
    <section
      className={cn(
        !bleed && "px-safe",
        paddingClass,
        "w-full",
        className,
      )}
      data-page-shell="true"
    >
      <div className={cn("mx-auto w-full space-y-6", widthMap[maxWidth], contentClassName)}>
        {(title || description || actions) && (
          <div
            className={cn(
              "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
              headerClassName,
            )}
          >
            <div className="space-y-1">
              {title && <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>}
              {description && <p className="text-sm text-muted-foreground sm:text-base">{description}</p>}
            </div>
            {actions && <div className="flex w-full flex-wrap gap-2 md:w-auto">{actions}</div>}
          </div>
        )}
        <div className="space-y-6">{children}</div>
      </div>
    </section>
  );
}

export default PageShell;
