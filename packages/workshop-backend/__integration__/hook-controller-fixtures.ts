import { env } from "cloudflare:workers";

export type LocalHookController =
    Service<typeof import("./local-hook-controller-emulator.js").default>;

const testEnv = env as unknown as {LOCAL_HOOK_CONTROLLER: LocalHookController};

export const localHookController = testEnv.LOCAL_HOOK_CONTROLLER;
