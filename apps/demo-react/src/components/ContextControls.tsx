import { useState } from "react";
import { useAccessLens } from "@access-lens/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { RiArrowDownSLine, RiEyeLine } from "@remixicon/react";
import {
  FLAG_GROUPS,
  TENANTS,
  USERS,
  type FlagDef,
  type FlagsState,
  type Tenant,
  type User,
} from "../data.js";

interface ContextControlsProps {
  tenantId: string;
  userId: string;
  flags: FlagsState;
  onTenantChange: (next: Tenant) => void;
  onUserChange: (next: User) => void;
  onFlagsChange: (next: FlagsState) => void;
}

export function ContextControls(props: ContextControlsProps) {
  const {
    tenantId,
    userId,
    flags,
    onTenantChange,
    onUserChange,
    onFlagsChange,
  } = props;
  const { debugMode, setDebugMode } = useAccessLens();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function setFlag(key: string, next: FlagDef) {
    onFlagsChange({ ...flags, [key]: next });
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="px-8 py-4 flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-2 h-9">
          <span className="size-2.5 rounded-full bg-primary" />
          <span className="font-bold tracking-tight text-base">Access Lens</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            demo
          </Badge>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <Field className="gap-2 w-fit">
            <FieldLabel htmlFor="tenant-select" className="text-xs">
              Tenant
            </FieldLabel>
            <Select
              value={tenantId}
              onValueChange={(value) => {
                if (!value) return;
                const next = TENANTS.find((t) => t.id === value);
                if (next) onTenantChange(next);
              }}
            >
              <SelectTrigger id="tenant-select" className="h-9 min-w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tenants</SelectLabel>
                  {TENANTS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <span>{t.name}</span>
                        <Badge variant="secondary" className="text-[9px]">
                          {t.plan}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          {t.region.toUpperCase()}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field className="gap-2 w-fit">
            <FieldLabel htmlFor="user-select" className="text-xs">
              User
            </FieldLabel>
            <Select
              value={userId}
              onValueChange={(value) => {
                if (!value) return;
                const next = USERS.find((u) => u.id === value);
                if (next) onUserChange(next);
              }}
            >
              <SelectTrigger id="user-select" className="h-9 min-w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Users</SelectLabel>
                  {USERS.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2">
                        <span>{u.name}</span>
                        <Badge variant="secondary" className="text-[9px]">
                          {u.role}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field className="gap-2 w-fit">
            <FieldLabel className="text-xs invisible select-none">
              Debug
            </FieldLabel>
            <Label
              htmlFor="debug-mode"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 h-9 cursor-pointer"
            >
              <RiEyeLine className="size-4 text-muted-foreground" />
              <span className="text-xs">Debug</span>
              <Switch
                id="debug-mode"
                checked={debugMode}
                onCheckedChange={setDebugMode}
              />
            </Label>
          </Field>
        </div>
      </div>

      <Collapsible
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        className="border-t border-border"
      >
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="w-full flex items-center gap-2 px-8 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
            />
          }
        >
          <RiArrowDownSLine
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              drawerOpen && "rotate-180",
            )}
          />
          <span className="font-medium">Feature flags</span>
          <span className="text-xs text-muted-foreground">
            boolean · variant · rollout · date · killswitch
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-8 pb-4">
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] pt-1">
            {FLAG_GROUPS.map((group) => (
              <div
                key={group.label}
                className="rounded-2xl border border-border bg-card/50 p-3"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.keys.map((key) => {
                    const def = flags[key];
                    if (!def) return null;
                    return (
                      <FlagControl
                        key={key}
                        flagKey={key}
                        def={def}
                        onChange={(next) => setFlag(key, next)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </header>
  );
}

interface FlagControlProps {
  flagKey: string;
  def: FlagDef;
  onChange: (next: FlagDef) => void;
}

function FlagControl({ flagKey, def, onChange }: FlagControlProps) {
  switch (def.kind) {
    case "boolean":
      return (
        <Item
          size="xs"
          variant="outline"
          className="font-mono text-[11px] w-fit"
        >
          <Switch
            checked={def.on}
            onCheckedChange={(checked) =>
              onChange({ kind: "boolean", on: checked })
            }
          />
          <ItemContent>
            <ItemTitle className="font-mono text-[11px]">{flagKey}</ItemTitle>
          </ItemContent>
        </Item>
      );
    case "killswitch":
      return (
        <Item
          size="xs"
          variant="outline"
          className={cn(
            "font-mono text-[11px] w-fit",
            def.engaged &&
              "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          <Switch
            checked={def.engaged}
            onCheckedChange={(checked) =>
              onChange({ kind: "killswitch", engaged: checked })
            }
          />
          <ItemContent>
            <ItemTitle className="font-mono text-[11px]">
              {flagKey}
              <em className="not-italic opacity-70 ml-1">
                {def.engaged ? "engaged" : "off"}
              </em>
            </ItemTitle>
          </ItemContent>
        </Item>
      );
    case "variant":
      return (
        <Item
          size="xs"
          variant="outline"
          className="font-mono text-[11px] w-fit"
        >
          <ItemContent>
            <ItemTitle className="font-mono text-[11px]">{flagKey}</ItemTitle>
          </ItemContent>
          <Select
            value={def.value}
            onValueChange={(value) => {
              if (typeof value !== "string") return;
              onChange({ kind: "variant", value, choices: def.choices });
            }}
          >
            <SelectTrigger className="h-6 px-2 text-[11px] font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Variants</SelectLabel>
                {def.choices.map((c) => (
                  <SelectItem
                    key={c}
                    value={c}
                    className="text-[11px] font-mono"
                  >
                    {c}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Item>
      );
    case "percent":
      return (
        <Item
          size="xs"
          variant="outline"
          className="font-mono text-[11px] w-fit min-w-48"
        >
          <ItemContent>
            <ItemTitle className="font-mono text-[11px]">
              {flagKey}
              <em className="not-italic opacity-70 ml-1">{def.rollout}%</em>
            </ItemTitle>
          </ItemContent>
          <Slider
            value={[def.rollout]}
            min={0}
            max={100}
            step={5}
            onValueChange={(value) => {
              const arr = Array.isArray(value) ? value : [value];
              const next = arr[0];
              if (typeof next === "number") {
                onChange({ kind: "percent", rollout: next });
              }
            }}
            className="w-20"
          />
        </Item>
      );
    case "date":
      return (
        <Item
          size="xs"
          variant="outline"
          className="font-mono text-[11px] w-fit"
        >
          <ItemMedia className="hidden" />
          <ItemContent>
            <ItemTitle className="font-mono text-[11px]">{flagKey}</ItemTitle>
          </ItemContent>
          <Input
            type="date"
            value={def.activeFrom}
            onChange={(e) =>
              onChange({ kind: "date", activeFrom: e.target.value })
            }
            className="h-6 px-1 text-[11px] font-mono w-32"
          />
        </Item>
      );
  }
}
