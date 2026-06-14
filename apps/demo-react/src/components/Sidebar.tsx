import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  RiCompass3Line,
  RiFlag2Line,
  RiGridLine,
  RiHomeLine,
  RiMoneyDollarCircleLine,
  RiSendPlaneLine,
  RiShieldKeyholeLine,
} from "@remixicon/react";
import { Card } from "@workspace/ui/components/card";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import {
  billingSidebarReasons,
  payoutsSidebarReasons,
  riskSidebarReasons,
  type AccessContext,
} from "../access.js";
import { ExplainedGate } from "./ExplainedGate.js";

interface SidebarProps {
  ctx: AccessContext;
  active: string;
  onSelect: (key: string) => void;
}

export function Sidebar({ ctx, active, onSelect }: SidebarProps) {
  return (
    <Card className="p-2 gap-1 self-start sticky top-32">
      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        Workspace
      </div>
      <ItemGroup>
        <NavItem
          icon={<RiHomeLine />}
          label="Home"
          active={active === "home"}
          onClick={() => onSelect("home")}
        />
        <NavItem
          icon={<RiCompass3Line />}
          label="Feature catalog"
          active={active === "catalog"}
          onClick={() => onSelect("catalog")}
        />
        <NavItem
          icon={<RiFlag2Line />}
          label="Flag inspector"
          active={active === "flags"}
          onClick={() => onSelect("flags")}
        />
        <NavItem
          icon={<RiGridLine />}
          label="Access matrix"
          active={active === "matrix"}
          onClick={() => onSelect("matrix")}
        />
        <ExplainedGate
          id="sidebar.billing"
          label="Billing"
          type="sidebar_item"
          reasons={billingSidebarReasons(ctx)}
        >
          <NavItem
            icon={<RiMoneyDollarCircleLine />}
            label="Billing"
            active={active === "billing"}
            onClick={() => onSelect("billing")}
          />
        </ExplainedGate>
        <ExplainedGate
          id="sidebar.payouts"
          label="Payouts"
          type="sidebar_item"
          reasons={payoutsSidebarReasons(ctx)}
        >
          <NavItem
            icon={<RiSendPlaneLine />}
            label="Payouts"
            active={active === "payouts"}
            onClick={() => onSelect("payouts")}
          />
        </ExplainedGate>
        <ExplainedGate
          id="sidebar.risk"
          label="Risk Settings"
          type="sidebar_item"
          reasons={riskSidebarReasons(ctx)}
        >
          <NavItem
            icon={<RiShieldKeyholeLine />}
            label="Risk Settings"
            active={active === "risk"}
            onClick={() => onSelect("risk")}
          />
        </ExplainedGate>
      </ItemGroup>
    </Card>
  );
}

/**
 * Forwards `className`, `aria-*`, and `data-*` props down to the rendered
 * Item — required so ExplainedGate's cloneElement(outline + access-lens id)
 * actually reaches the visible DOM element.
 */
type NavItemPassthrough = Omit<
  ComponentPropsWithoutRef<typeof Item>,
  "render" | "variant" | "size" | "children"
>;

interface NavItemProps extends NavItemPassthrough {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem(props: NavItemProps) {
  const { icon, label, active, onClick, ...rest } = props;
  return (
    <Item
      {...rest}
      size="sm"
      variant={active ? "muted" : "default"}
      render={
        <button
          type="button"
          onClick={onClick}
          aria-current={active ? "page" : undefined}
          className="cursor-pointer hover:bg-muted/60"
        />
      }
    >
      <ItemMedia variant="icon">{icon}</ItemMedia>
      <ItemContent>
        <ItemTitle className={active ? "text-primary font-semibold" : ""}>
          {label}
        </ItemTitle>
      </ItemContent>
    </Item>
  );
}
