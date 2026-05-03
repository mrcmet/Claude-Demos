/**
 * Header.tsx
 *
 * Optional minimal top bar. Currently unused in the default layout
 * (Sidebar provides all navigation). Kept as a named export for future
 * use if a top toolbar (e.g., breadcrumbs, term filter) is needed.
 */

import type { ReactNode } from "react";
import { useTheme } from "@themes/themeContext";

interface HeaderProps {
  title?: string;
  rightContent?: ReactNode;
}

export function Header({ title, rightContent }: HeaderProps) {
  const theme = useTheme();

  return (
    <header
      style={{
        height: 48,
        background: theme.surface,
        borderBottom: `1px solid ${theme.borderDefault}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
      }}
    >
      {title && (
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: theme.textSecondary,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
      )}
      {rightContent && <div>{rightContent}</div>}
    </header>
  );
}
