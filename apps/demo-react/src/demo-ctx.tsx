import { createContext, useContext, type ReactNode } from "react";
import type { AccessContext } from "./access.js";

const DemoCtxContext = createContext<AccessContext | null>(null);

interface DemoCtxProviderProps {
  value: AccessContext;
  children: ReactNode;
}

export function DemoCtxProvider({ value, children }: DemoCtxProviderProps) {
  return (
    <DemoCtxContext.Provider value={value}>{children}</DemoCtxContext.Provider>
  );
}

export function useDemoCtx(): AccessContext | null {
  return useContext(DemoCtxContext);
}
