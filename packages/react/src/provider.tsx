import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  AccessLensClient,
  createAccessLensClient,
} from "@access-lens/core";
import { AccessLensContext } from "./context.js";
import type { AccessLensContextValue } from "./context.js";

export interface AccessLensProviderProps {
  children: ReactNode;
  client?: AccessLensClient;
  debugMode?: boolean;
  defaultDebugMode?: boolean;
  onDebugModeChange?: (next: boolean) => void;
}

export function AccessLensProvider(props: AccessLensProviderProps) {
  const {
    children,
    client: externalClient,
    debugMode: controlledDebug,
    defaultDebugMode = false,
    onDebugModeChange,
  } = props;

  const clientRef = useRef<AccessLensClient | null>(externalClient ?? null);
  if (clientRef.current === null) {
    clientRef.current = createAccessLensClient();
  }
  const client = clientRef.current;

  const [internalDebug, setInternalDebug] = useState(defaultDebugMode);
  const debugMode = controlledDebug ?? internalDebug;

  const setDebugMode = useCallback(
    (next: boolean) => {
      if (controlledDebug === undefined) {
        setInternalDebug(next);
      }
      onDebugModeChange?.(next);
    },
    [controlledDebug, onDebugModeChange],
  );

  useEffect(() => {
    if (controlledDebug !== undefined) {
      onDebugModeChange?.(controlledDebug);
    }
  }, [controlledDebug, onDebugModeChange]);

  const value = useMemo<AccessLensContextValue>(
    () => ({ client, debugMode, setDebugMode }),
    [client, debugMode, setDebugMode],
  );

  return (
    <AccessLensContext.Provider value={value}>
      {children}
    </AccessLensContext.Provider>
  );
}
