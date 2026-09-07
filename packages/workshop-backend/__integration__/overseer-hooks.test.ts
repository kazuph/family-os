import { env, exports } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import type { AuthenticatedApi, Overseer, PublicApi } from "@gadgets/workshop-shared/api";
import { unwrapFamilyRpcResult } from "@gadgets/workshop-shared/api";
import { DEFAULT_ADMIN_CONFIG, serializeAdminConfig } from "../src/admin-config.js";
import { ADMIN_CONFIG_KEY } from "../src/blueprint-archive.js";
import { OverseerDurableObject } from "../src/overseer.js";
import { describe, expect, it } from "vitest";
import { HOOK_ENTRYPOINT } from "./action-log-fixtures.js";
import { FAMILY_ACCESS_API_URL, signFamilyAccessJwt } from "./family-access-jwt.js";
import { localHookController } from "./hook-controller-fixtures.js";

type HookWorkspaceContext = {
  native: DurableObjectStub<OverseerDurableObject>;
  workspaceId: string;
  gadgetId: number;
  workspace: RpcStub<Overseer>;
};

type HookFixtureOptions = {
  enabled?: boolean;
  vendorId?: string;
  gadgetId?: number;
  legacyVendorId?: string;
  includeHook?: boolean;
};

async function rejection(value: PromiseLike<unknown>): Promise<Error> {
  try {
    await value;
  } catch (error) {
    if (!(error instanceof Error)) throw new TypeError("Expected an RPC Error.", {cause: error});
    return error;
  }
  throw new Error("Expected RPC rejection.");
}

async function withAuthenticatedApi(
    run: (api: RpcStub<AuthenticatedApi>) => Promise<void>): Promise<void> {
  const response = await exports.default.fetch(new Request(FAMILY_ACCESS_API_URL, {
    headers: {
      Upgrade: "websocket",
      Origin: "https://workshop.invalid",
      Cookie: "CF_Authorization=login-1200",
      "cf-access-jwt-assertion": await signFamilyAccessJwt(1200),
    },
  }));
  expect(response.status).toBe(101);
  if (!response.webSocket) throw new Error("Expected authenticated WebSocket.");
  response.webSocket.accept();
  using api = newWebSocketRpcSession<PublicApi>(response.webSocket);
  api.onRpcBroken(() => {});
  using family = await api.authenticateFromCfAccess();
  family.onRpcBroken(() => {});
  unwrapFamilyRpcResult(await family.selectAdultProfile());
  using authenticated = unwrapFamilyRpcResult(await family.getAuthenticatedApi());
  authenticated.onRpcBroken(() => {});
  if (!(await authenticated.isOnboardingCompleted())) {
    await authenticated.setOwnDisplayName("Hook integration");
    await authenticated.completeOnboarding();
  }
  await run(authenticated);
}

async function withHookWorkspace(
    run: (context: HookWorkspaceContext) => Promise<void>): Promise<void> {
  await withAuthenticatedApi(async authenticated => {
    using createdWorkspace = await authenticated.newGadget();
    using gadget = await createdWorkspace.createGadget("Hook integration fixture");
    let workspaceId = (await createdWorkspace.getMetadata()).id;
    let gadgetId = await gadget.getId();
    using workspace = await authenticated.openGadget(workspaceId);
    let native = exports.OverseerDurableObject.get(
        exports.OverseerDurableObject.idFromString(workspaceId));
    await run({native, workspaceId, gadgetId, workspace});
  });
}

async function withAdminConfig<T>(
    config: Parameters<typeof serializeAdminConfig>[0], run: () => Promise<T>): Promise<T> {
  let previous = await env.BLUEPRINTS.get(ADMIN_CONFIG_KEY);
  await env.BLUEPRINTS.put(ADMIN_CONFIG_KEY, serializeAdminConfig(config));
  try {
    return await run();
  } finally {
    if (previous === null) await env.BLUEPRINTS.delete(ADMIN_CONFIG_KEY);
    else await env.BLUEPRINTS.put(ADMIN_CONFIG_KEY, previous);
  }
}

async function withBlueprintsFailure<T>(run: () => Promise<T>): Promise<T> {
  let blueprints = Reflect.get(env, "BLUEPRINTS");
  let setFailure = Reflect.get(blueprints, "setFailure");
  if (typeof setFailure !== "function") {
    throw new Error("The local BLUEPRINTS emulator does not expose failure control.");
  }
  await setFailure.call(blueprints, true);
  try {
    return await run();
  } finally {
    await setFailure.call(blueprints, false);
  }
}

async function seedHook(
    context: HookWorkspaceContext,
    options: HookFixtureOptions = {},
): Promise<{hookId: number; controllerKey: string}> {
  let hookId = 7;
  let controllerKey = `${context.workspaceId}:${hookId}`;
  await runInDurableObject(context.native, async instance => {
    let impl = instance["impl"];
    let controller = Reflect.get(impl.env, "LOCAL_HOOK_CONTROLLER");
    await controller.register(controllerKey);
    if (options.includeHook === false) return;
    let provider = Reflect.get(impl.env, "LOCAL_ACTION_PROVIDER");
    let gatekeeperClass = await provider.getClass();

    impl.storage.gatekeepers.put({
      id: 1,
      class: gatekeeperClass,
      hook: HOOK_ENTRYPOINT,
      creationSpec: {
        type: "gatekeeper",
        vendorId: options.vendorId ?? options.legacyVendorId ?? "email",
        resourceUrl: "https://example.com/resource",
        typeUrlPattern: "https://*",
      },
    });
    let callback = await controller.getPersistentCallback();
    impl.storage.boundHooks.put({
      id: hookId,
      actionId: 0,
      gatekeeperId: 1,
      ...(options.gadgetId !== undefined ? {gadgetId: options.gadgetId} : {}),
      ...(options.vendorId !== undefined ? {vendorId: options.vendorId} : {}),
      controller: await controller.getPersistentController(),
      callback,
      description: {title: "Incoming hook", description: "Hook integration fixture"},
      enabled: options.enabled ?? true,
    });
    if (options.legacyVendorId !== undefined) {
      impl.storage.gatekeepers.put({
        id: 1,
        class: gatekeeperClass,
        creationSpec: {
          type: "gatekeeper",
          vendorId: options.legacyVendorId,
          resourceUrl: "https://example.com/resource",
          typeUrlPattern: "https://*",
        },
      });
    }
  });
  return {hookId, controllerKey};
}

async function startHook(context: HookWorkspaceContext, hookId: number) {
  const error = await runInDurableObject(context.native, async instance => {
    try {
      await instance.startHook(hookId);
      return null;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      return error.message;
    }
  });
  if (error !== null) throw new Error(error);
  throw new Error("Expected hook delivery to fail.");
}

async function readControllerState(): Promise<Record<string, unknown>> {
  let state = await localHookController.read();
  let response = await localHookController.fetch("https://hook-controller.invalid/state");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(state);
  return state;
}

describe("OverseerDurableObject.startHook", () => {
  it.each([
    ["ordinary", DEFAULT_ADMIN_CONFIG, "email"],
    ["ambient", {
      ...DEFAULT_ADMIN_CONFIG,
      ambientGatekeeperModes: {scheduler: "optional" as const},
    }, "scheduler"],
  ])("allows delivery for an enabled %s vendor", async (_kind, config, vendorId) => {
    await withHookWorkspace(async context => {
      let {hookId} = await seedHook(context, {vendorId});
      await withAdminConfig(config, async () => {
        let result = await context.native.startHook(hookId);
        expect(result.callback).toBeDefined();
        expect(result.approvalQueue).toBeDefined();
        await result.callback.entry({});
        expect(await result.callback.state()).toEqual({entries: 1});
        result.callback[Symbol.dispose]();
        result.approvalQueue[Symbol.dispose]();
      });
    });
  });

  it("rejects delivery for an administratively disabled ordinary vendor", async () => {
    await withHookWorkspace(async context => {
      let {hookId} = await seedHook(context);
      let config = {...DEFAULT_ADMIN_CONFIG, disabledGatekeepers: ["email"]};
      await withAdminConfig(config, async () => {
        expect((await rejection(startHook(context, hookId))).message)
            .toBe("Gatekeeper is disabled.");
      });
    });
  });

  it("rejects delivery for an administratively disabled ambient vendor", async () => {
    await withHookWorkspace(async context => {
      let {hookId} = await seedHook(context, {vendorId: "scheduler"});
      let config = {
        ...DEFAULT_ADMIN_CONFIG,
        ambientGatekeeperModes: {scheduler: "disabled" as const},
      };
      await withAdminConfig(config, async () => {
        expect((await rejection(startHook(context, hookId))).message)
            .toBe("Gatekeeper is disabled.");
      });
    });
  });

  it("enforces vendor policy for legacy hooks without a denormalized vendor ID", async () => {
    await withHookWorkspace(async context => {
      let {hookId} = await seedHook(context, {legacyVendorId: "email"});
      let config = {...DEFAULT_ADMIN_CONFIG, disabledGatekeepers: ["email"]};
      await withAdminConfig(config, async () => {
        expect((await rejection(startHook(context, hookId))).message)
            .toBe("Gatekeeper is disabled.");
      });
    });
  });

  it("rejects delivery when admin-config KV access fails", async () => {
    await withHookWorkspace(async context => {
      let {hookId} = await seedHook(context);
      await withBlueprintsFailure(async () => {
        expect((await rejection(startHook(context, hookId))).message).toBe("KV unavailable");
      });
    });
  });

  it("rejects delivery when the hook was disabled", async () => {
    await withHookWorkspace(async context => {
      let {hookId} = await seedHook(context, {enabled: false});
      expect((await rejection(startHook(context, hookId))).message)
          .toBe("Hook has been deleted or disabled.");
    });
  });

  it("rejects delivery when the hook was deleted", async () => {
    await withHookWorkspace(async context => {
      let {hookId} = await seedHook(context, {includeHook: false});
      expect((await rejection(startHook(context, hookId))).message)
          .toBe("Hook has been deleted or disabled.");
    });
  });
});

describe("hook target", () => {
  it("passes the workspace and gadget IDs to enable()", async () => {
    await withHookWorkspace(async context => {
      let {hookId, controllerKey} = await seedHook(context, {
        enabled: false, gadgetId: context.gadgetId,
      });
      await context.workspace.enableHook(hookId);
      expect(await readControllerState()).toMatchObject({
        key: controllerKey, registered: true, enabled: true, deleted: false,
        target: {workspaceId: context.workspaceId, gadgetId: context.gadgetId},
      });
    });
  });

  it("omits the gadget ID for a hook that is not pinned to one", async () => {
    await withHookWorkspace(async context => {
      let {hookId, controllerKey} = await seedHook(context, {enabled: false});
      await context.workspace.enableHook(hookId);
      expect(await readControllerState()).toMatchObject({
        key: controllerKey, registered: true, enabled: true, deleted: false,
        target: {workspaceId: context.workspaceId},
      });

      await context.workspace.disableHook(hookId);
      expect(await readControllerState()).toMatchObject({enabled: false, deleted: false});
      await context.workspace.deleteHook(hookId);
      await localHookController.deleteHook();
      expect(await readControllerState()).toMatchObject({enabled: false, deleted: true});
      expect(await context.workspace.listHooks()).toEqual([]);
    });
  });
});
