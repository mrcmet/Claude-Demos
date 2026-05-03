import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { colors } from "./colors";

type Theme = typeof colors;

const ThemeContext = createContext<Theme>(colors);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app and exposes the design-system color palette to all
 * components via useTheme(). Currently there is only one theme (dark),
 * but the context makes it easy to add light mode or custom themes later.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={colors}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Returns the full color palette. Use instead of hardcoded hex values. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
