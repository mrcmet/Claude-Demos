/**
 * AppShell.tsx
 *
 * Root layout container. Full-height flex row:
 *   [Sidebar (260px, fixed)] [Main content (flex: 1)]
 *
 * The main area takes the remaining viewport width and must clip overflow
 * so the React Flow canvas never causes a scrollbar.
 */

import type { ReactNode } from "react";
import { useTheme } from "@themes/themeContext";

interface AppShellProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export function AppShell({ sidebar, main }: AppShellProps) {
  const theme = useTheme();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        background: theme.background,
        overflow: "hidden",
      }}
    >
      {/* Fixed-width sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {sidebar}
      </aside>

      {/* Main canvas area */}
      <main
        style={{
          flex: 1,
          height: "100%",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {main}
      </main>
    </div>
  );
}
