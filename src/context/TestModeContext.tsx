"use client";

import { createContext, useContext } from "react";

export const TestModeContext = createContext<boolean | null>(null);

export function TestModeProvider({
  isTestMode,
  children,
}: {
  isTestMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <TestModeContext.Provider value={isTestMode}>
      {children}
    </TestModeContext.Provider>
  );
}

export function useTestModeContext() {
  return useContext(TestModeContext);
}
