import { useState } from "react";
import { RiDownload2Line, RiEditLine } from "@remixicon/react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  advancedReportsTabReasons,
  editRiskButtonReasons,
  exportButtonReasons,
  featureFlagReason,
  legacyTabReasons,
  permissionReason,
  reportsTabReasons,
  entitlementReason,
  planAtLeastReason,
  type AccessContext,
} from "../access.js";
import { ExplainedGate } from "./ExplainedGate.js";
import { GatedSelectItem } from "./GatedSelectItem.js";
import { OverviewRouting } from "./OverviewRouting.js";

interface TabsPanelProps {
  ctx: AccessContext;
  page: string;
}

type TabKey = "overview" | "reports" | "advanced" | "legacy";

export function TabsPanel({ ctx, page }: TabsPanelProps) {
  const [active, setActive] = useState<TabKey>("overview");
  const [action, setAction] = useState<string | undefined>(undefined);

  return (
    <Card className="min-h-96">
      <CardHeader>
        <CardTitle>{prettyPage(page)}</CardTitle>
        <CardDescription>
          Tabs and buttons gated by permissions, plans, flags, and tenant
          config. Toggle <strong>Debug</strong> in the header to see denied
          surfaces ghosted with hover-card explanations.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Tabs
          value={active}
          onValueChange={(v) => setActive(v as TabKey)}
          className="gap-4"
        >
          <TabsList
            variant="line"
            className="border-b border-border w-full justify-start"
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <ExplainedGate
              id="tab.reports"
              label="Reports"
              type="tab"
              reasons={reportsTabReasons(ctx)}
              layout="inline"
            >
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </ExplainedGate>
            <ExplainedGate
              id="tab.advanced_reports"
              label="Advanced Reports"
              type="tab"
              reasons={advancedReportsTabReasons(ctx)}
              layout="inline"
            >
              <TabsTrigger value="advanced">Advanced Reports</TabsTrigger>
            </ExplainedGate>
            <ExplainedGate
              id="tab.legacy_mode"
              label="Legacy Mode"
              type="tab"
              reasons={legacyTabReasons(ctx)}
              layout="inline"
            >
              <TabsTrigger value="legacy">Legacy Mode</TabsTrigger>
            </ExplainedGate>
          </TabsList>

          <TabsContent value="overview">
            {page === "home" ? (
              <OverviewRouting ctx={ctx} />
            ) : (
              <p className="text-sm text-muted-foreground">
                You are viewing the <strong>overview</strong> tab of{" "}
                <strong>{prettyPage(page)}</strong> as{" "}
                <strong>{ctx.user.name}</strong> on{" "}
                <strong>{ctx.tenant.name}</strong>.
              </p>
            )}
          </TabsContent>
          <TabsContent value="reports">
            <p className="text-sm text-muted-foreground">
              Reports view content for <strong>{ctx.tenant.name}</strong>.
            </p>
          </TabsContent>
          <TabsContent value="advanced">
            <p className="text-sm text-muted-foreground">
              Advanced reports — heavier compute, enterprise-tier only.
            </p>
          </TabsContent>
          <TabsContent value="legacy">
            <p className="text-sm text-muted-foreground">
              Legacy mode — surfaces only for tenants flagged as legacy.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <ExplainedGate
            id="button.export"
            label="Export"
            type="button"
            reasons={exportButtonReasons(ctx)}
            layout="inline"
          >
            <Button variant="outline" size="sm">
              <RiDownload2Line />
              Export
            </Button>
          </ExplainedGate>
          <ExplainedGate
            id="button.edit_risk"
            label="Edit Risk"
            type="button"
            reasons={editRiskButtonReasons(ctx)}
            layout="inline"
          >
            <Button size="sm">
              <RiEditLine />
              Edit Risk
            </Button>
          </ExplainedGate>
        </div>

        <Separator />

        <section className="flex flex-col gap-3">
          <header className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">Action picker</h3>
            <span className="text-xs text-muted-foreground">
              gated dropdown · denied options keep their slot with dashed
              outline + disabled (open the menu)
            </span>
          </header>

          <Select value={action} onValueChange={(v) => setAction(v ?? undefined)}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Pick an action…" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Actions on this record</SelectLabel>
                <SelectItem value="view">View details</SelectItem>
                <GatedSelectItem
                  id="action.edit"
                  label="Edit"
                  value="edit"
                  reasons={[permissionReason(ctx.user, "customers.write")]}
                >
                  Edit
                </GatedSelectItem>
                <GatedSelectItem
                  id="action.refund"
                  label="Issue refund"
                  value="refund"
                  reasons={[
                    permissionReason(ctx.user, "refunds.write"),
                    featureFlagReason(ctx, "smart_refunds"),
                  ]}
                >
                  Issue refund
                </GatedSelectItem>
                <GatedSelectItem
                  id="action.delete"
                  label="Delete record"
                  value="delete"
                  reasons={[
                    permissionReason(ctx.user, "customers.delete"),
                    planAtLeastReason(ctx.tenant, "growth"),
                  ]}
                >
                  Delete record
                </GatedSelectItem>
                <GatedSelectItem
                  id="action.export"
                  label="Custom export"
                  value="custom_export"
                  reasons={[
                    permissionReason(ctx.user, "reports.export"),
                    featureFlagReason(ctx, "advanced_reports"),
                    entitlementReason(ctx.tenant, "analytics"),
                  ]}
                >
                  Custom export
                </GatedSelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {action ? (
            <p className="text-xs text-muted-foreground">
              Picked:{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                {action}
              </code>
            </p>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
}

function prettyPage(page: string): string {
  switch (page) {
    case "home":
      return "Home";
    case "billing":
      return "Billing";
    case "payouts":
      return "Payouts";
    case "risk":
      return "Risk Settings";
    default:
      return page;
  }
}
