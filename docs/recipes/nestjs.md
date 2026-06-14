# Recipe: NestJS

End-to-end wiring for NestJS-based backends. The endpoint is decorated, the response is DTO-validated, and the same TypeScript permission union ships to the frontend through a shared types package.

## 1. Shared types package

```ts
// packages/auth-types/src/index.ts
export const PERMISSIONS = [
  "billing.read",
  "billing.write",
  "billing.export",
  "reports.read",
  "reports.export",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PLANS = ["free", "basic", "growth", "enterprise"] as const;
export type Plan = (typeof PLANS)[number];

export const ENTITLEMENTS = ["billing", "payouts", "analytics"] as const;
export type Entitlement = (typeof ENTITLEMENTS)[number];
```

Both `apps/api` (NestJS) and `apps/web` (React) depend on this package.

## 2. NestJS controller

```ts
// apps/api/src/me/me.controller.ts
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOkResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { MeService } from "./me.service.js";
import { AccessResponseDto } from "./dto/access.dto.js";

@ApiTags("me")
@Controller("me")
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get("access")
  @ApiOkResponse({ type: AccessResponseDto })
  async access(@Req() req): Promise<AccessResponseDto> {
    return this.meService.buildAccessSet(req.user);
  }
}
```

## 3. The service (the actual logic)

```ts
// apps/api/src/me/me.service.ts
import { Injectable } from "@nestjs/common";
import { Permission, Entitlement, Plan } from "@yourcompany/auth-types";
import { FlagsService } from "../flags/flags.service.js";
import { TenantsService } from "../tenants/tenants.service.js";

@Injectable()
export class MeService {
  constructor(
    private readonly tenants: TenantsService,
    private readonly flags: FlagsService,
  ) {}

  async buildAccessSet(user) {
    const tenant = await this.tenants.findById(user.tenantId);
    const flagValues = await this.flags.allForTenant(tenant.id);

    return {
      permissions: this.resolvePermissions(user),
      plan: tenant.plan as Plan,
      entitlements: tenant.entitlements as Record<Entitlement, boolean>,
      flags: flagValues,  // already in { kind, ... } shape
      tenantConfig: {
        legacy: tenant.legacy,
        region: tenant.region,
      },
      tenant: {
        bucketPercent: tenant.bucketPercent,
      },
    };
  }

  private resolvePermissions(user): Permission[] {
    const permissions = new Set<Permission>();
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        permissions.add(permission.key as Permission);
      }
    }
    return [...permissions];
  }
}
```

## 4. DTO with class-validator

```ts
// apps/api/src/me/dto/access.dto.ts
import {
  IsArray, IsBoolean, IsObject, IsString,
  ValidateNested, IsIn, IsNumber, Min, Max,
} from "class-validator";
import { Type } from "class-transformer";
import { PERMISSIONS, PLANS } from "@yourcompany/auth-types";

class BooleanFlag {
  @IsIn(["boolean"]) kind: "boolean";
  @IsBoolean() on: boolean;
}
class KillswitchFlag {
  @IsIn(["killswitch"]) kind: "killswitch";
  @IsBoolean() engaged: boolean;
}
class VariantFlag {
  @IsIn(["variant"]) kind: "variant";
  @IsString() value: string;
}
class PercentFlag {
  @IsIn(["percent"]) kind: "percent";
  @IsNumber() @Min(0) @Max(100) rollout: number;
}
class DateFlag {
  @IsIn(["date"]) kind: "date";
  @IsString() activeFrom: string;
}

export class AccessResponseDto {
  @IsArray() @IsIn(PERMISSIONS, { each: true }) permissions: string[];
  @IsIn(PLANS) plan: string;
  @IsObject() entitlements: Record<string, boolean>;
  @IsObject() @ValidateNested({ each: true }) flags: Record<string, unknown>;
  @IsObject() tenantConfig: Record<string, unknown>;
  @IsObject() tenant: { bucketPercent: number };
}
```

The shape is now validated on the server before it leaves the building, and `createAccessSet` validates again on the client. Two independent contracts.

## 5. Frontend — exactly the same hook

```ts
import { createAccessSet } from "@access-lens/core";
import { useQuery } from "@tanstack/react-query";
import { PERMISSIONS, PLANS, ENTITLEMENTS } from "@yourcompany/auth-types";

// Bound to the same typed registry as the backend
import { defineAccessLens } from "@access-lens/core";
import { createReactBindings } from "@access-lens/react";

export const al = defineAccessLens({
  permissions: PERMISSIONS,
  plans: PLANS,
  entitlements: ENTITLEMENTS,
  flags: { /* ... */ },
});

export const { AccessLensProvider, AccessGate } = createReactBindings(al);

export function useAccess() {
  return useQuery({
    queryKey: ["me", "access"],
    queryFn: async () => {
      const response = await fetch("/api/me/access", { credentials: "include" });
      return createAccessSet(await response.json());
    },
  });
}
```

Now adding `"billing.delete"` to `PERMISSIONS` in `@yourcompany/auth-types` means:
- The NestJS DTO accepts it.
- The NestJS service can return it from `resolvePermissions`.
- The React lens config knows about it.
- An `<AccessGate>` referencing `"billing.delete"` compiles.

Forget to add it on one side and TypeScript fails the build.

## See also

- [Backend integration overview](/guide/backend-integration)
- [Recipe: `/me/access` endpoint](/recipes/me-access-endpoint)
- [Recipe: Express + CASL](/recipes/express-casl)
