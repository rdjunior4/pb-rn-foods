import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface CustomerLayoutProps {
  children: ReactNode;
  variant?: "default" | "gradient";
  maxWidth?: "1400" | "1200" | "800" | "600";
  fullWidth?: boolean;
  noPadding?: boolean;
  stickyNav?: ReactNode;
}

export function CustomerLayout({
  children,
  variant = "default",
  maxWidth = "1200",
  fullWidth = false,
  noPadding = false,
  stickyNav,
}: CustomerLayoutProps) {
  const maxWClass =
    maxWidth === "1400"
      ? "max-w-[1400px]"
      : maxWidth === "800"
        ? "max-w-[800px]"
        : maxWidth === "600"
          ? "max-w-[600px]"
          : "max-w-[1200px]";

  return (
    <div
      className={`min-h-screen ${
        variant === "gradient"
          ? "bg-gradient-to-br from-muted/50 via-background to-muted/30"
          : "bg-gray-50"
      }`}
    >
      <TopBar />
      <div className="sticky top-0 z-50">
        <Header />
        {stickyNav && (
          <div className="bg-card border-t border-border/30 py-2.5">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px]">
              {stickyNav}
            </div>
          </div>
        )}
      </div>
      <main
        className={
          fullWidth
            ? noPadding ? "" : "pb-8"
            : `mx-auto ${maxWClass} px-4 sm:px-6 lg:px-[30px] ${noPadding ? "" : "py-8"}`
        }
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
