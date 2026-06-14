import { useMemo, useState } from "react";
import { AccessLensProvider } from "@access-lens/react";
import { AccessLensWidget } from "./components/AccessLensWidget.js";
import { AccessMatrix } from "./components/AccessMatrix.js";
import { ContextControls } from "./components/ContextControls.js";
import { FeatureCatalog } from "./components/FeatureCatalog.js";
import { FlagInspector } from "./components/FlagInspector.js";
import { Sidebar } from "./components/Sidebar.js";
import { TabsPanel } from "./components/TabsPanel.js";
import { DemoCtxProvider } from "./demo-ctx.js";
import {
  DEFAULT_FLAGS,
  TENANTS,
  USERS,
  type FlagsState,
  type Tenant,
  type User,
} from "./data.js";
import type { AccessContext } from "./access.js";

export function App() {
  const [tenant, setTenant] = useState<Tenant>(TENANTS[0]!);
  const [user, setUser] = useState<User>(USERS[0]!);
  const [flags, setFlags] = useState<FlagsState>(DEFAULT_FLAGS);
  const [page, setPage] = useState<string>("home");

  const ctx = useMemo<AccessContext>(
    () => ({ tenant, user, flags }),
    [tenant, user, flags],
  );

  return (
    <AccessLensProvider defaultDebugMode={false}>
      <DemoCtxProvider value={ctx}>
      <AccessLensWidget />
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <ContextControls
          tenantId={tenant.id}
          userId={user.id}
          flags={flags}
          onTenantChange={setTenant}
          onUserChange={setUser}
          onFlagsChange={setFlags}
        />
        <main className="flex-1 grid grid-cols-[260px_1fr] gap-6 px-8 py-6 max-md:grid-cols-1">
          <Sidebar ctx={ctx} active={page} onSelect={setPage} />
          {page === "catalog" ? (
            <FeatureCatalog ctx={ctx} />
          ) : page === "flags" ? (
            <FlagInspector ctx={ctx} />
          ) : page === "matrix" ? (
            <AccessMatrix ctx={ctx} />
          ) : (
            <div className="flex flex-col gap-8 min-w-0">
              <TabsPanel ctx={ctx} page={page} />
              <AccessMatrix ctx={ctx} />
            </div>
          )}
        </main>
        <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border">
          Toggle <strong>Debug</strong> in the header to ghost hidden surfaces
          and open the floating inspector. The{" "}
          <strong>Feature catalog</strong> always shows every gated surface
          with status + reasons.
        </footer>
      </div>
      </DemoCtxProvider>
    </AccessLensProvider>
  );
}
