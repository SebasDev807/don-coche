"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Evita hidratación incorrecta
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button type="button" className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] transition-colors w-10 h-10 flex items-center justify-center cursor-pointer">
        <span className="material-symbols-outlined text-[20px]">sync</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] transition-colors w-10 h-10 flex items-center justify-center group cursor-pointer"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-12 group-active:scale-95">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
