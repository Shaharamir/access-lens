import { createContext } from "react";
import type { AccessLensClient } from "@access-lens/core";

export interface AccessLensContextValue {
  client: AccessLensClient;
  debugMode: boolean;
  setDebugMode: (next: boolean) => void;
}

export const AccessLensContext =
  createContext<AccessLensContextValue | null>(null);
