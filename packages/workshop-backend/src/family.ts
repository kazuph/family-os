import { DurableObject, RpcStub as NativeRpcStub } from "cloudflare:workers";
import { collection, createTypedStorage } from "@gadgets/typed-storage";
import {
  createFamilyError,
  getFamilyErrorCode,
  FAMILY_ERROR_CODES,
  FAMILY_MONSTER_AVATAR_IDS,
  isFamilyAdultPasscode,
  type FamilyMonsterAvatarId,
  type FamilyProfile,
  type FamilyState,
} from "@gadgets/workshop-shared/api";

const MAX_PASSCODE_FAILURES = 3;

type FamilyPasscode = { salt: string; hash: string };
type FamilyChildProfile = Extract<FamilyProfile, { kind: "child" }> & { userId: string };
type FamilyAdultAvatar = { adultUserId: string; avatarId: FamilyMonsterAvatarId };
type FamilyDoResult<T> = { ok: true; value: T } | { ok: false; error: typeof FAMILY_ERROR_CODES[keyof typeof FAMILY_ERROR_CODES] };

async function captureFamilyResult<T>(operation: () => T | Promise<T>): Promise<FamilyDoResult<T>> {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    let code = getFamilyErrorCode(error);
    if (code) return { ok: false, error: code };
    throw error;
  }
}
/** Stored, browser-device-specific Family OS profile-selection state. */
export type FamilyDeviceSession = {
  deviceId: string;
  activeProfileId: "unselected" | "adult" | string;
  failedPasscodeAttempts: number;
  generation: number;
  reauthenticateAfterLoginIat?: number;
};

function makeFamilyStorage(storage: DurableObjectStorage) {
  return createTypedStorage(storage, {
    collections: {
      children: collection<FamilyChildProfile>()({ primaryKey: "id" }),
      deviceSessions: collection<FamilyDeviceSession>()({ primaryKey: "deviceId" }),
      adultMonsterAvatars: collection<FamilyAdultAvatar>()({ primaryKey: "adultUserId" }),
    },
    singletons: {
      passcode: <FamilyPasscode | null>null,
      lastAcceptedAccessLoginIat: <number | null>null,
    },
  });
}

type FamilyStorage = ReturnType<typeof makeFamilyStorage>;

/** True only for the shared six-digit adult passcode format required by Family OS. */
export function isAdultPasscode(value: string): boolean {
  return isFamilyAdultPasscode(value);
}

/** Fail closed when a child Family session attempts an adult-only action. */
export function assertAdultFamilyProfile(childProfile: boolean): void {
  if (childProfile) throw createFamilyError(FAMILY_ERROR_CODES.adultProfileRequired);
}

/** Applies one invalid passcode attempt without changing the selected child profile. */
export function recordInvalidPasscodeAttempt(
    attempts: number, loginIat: number): Pick<FamilyDeviceSession,
        "failedPasscodeAttempts" | "reauthenticateAfterLoginIat"> {
  let failedPasscodeAttempts = attempts + 1;
  return failedPasscodeAttempts >= MAX_PASSCODE_FAILURES
    ? { failedPasscodeAttempts, reauthenticateAfterLoginIat: loginIat }
    : { failedPasscodeAttempts };
}

/** Creates the chooser-only state for a newly seen browser device. */
export function createFamilyDeviceSession(deviceId: string): FamilyDeviceSession {
  return { deviceId, activeProfileId: "unselected", failedPasscodeAttempts: 0, generation: 0 };
}

/** Returns the child profile data without its internal User Durable Object identifier. */
export function createFamilyChildProfile(id: string, name: string)
    : Extract<FamilyProfile, { kind: "child" }> {
  name = name.trim();
  if (!name) throw new TypeError("A child profile name is required.");
  return { kind: "child", id, name };
}

/** Selects an existing child without changing any other browser device's profile state. */
export function selectFamilyChildProfile(
    session: FamilyDeviceSession, profiles: readonly FamilyProfile[], profileId: string): void {
  if (!profiles.some((profile) => profile.kind === "child" && profile.id === profileId)) {
    throw createFamilyError(FAMILY_ERROR_CODES.profileNotFound);
  }
  session.activeProfileId = profileId;
  session.failedPasscodeAttempts = 0;
  delete session.reauthenticateAfterLoginIat;
}

/** Resets a reauthentication-locked device only after a strictly newer Access global login. */
export function applyAccessReauthentication(session: FamilyDeviceSession, loginIat: number): void {
  if (session.reauthenticateAfterLoginIat !== undefined
      && loginIat > session.reauthenticateAfterLoginIat) {
    restoreAdultProfile(session);
  }
}

/** Restores direct adult mode and clears the failed shared-passcode counter. */
export function restoreAdultProfile(session: FamilyDeviceSession): void {
  session.activeProfileId = "adult";
  session.failedPasscodeAttempts = 0;
  delete session.reauthenticateAfterLoginIat;
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a[index] ^ b[index];
  return difference === 0;
}

async function hashPasscode(passcode: string, salt: string): Promise<string> {
  let input = new TextEncoder().encode(`${salt}:${passcode}`);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", input)).toBase64();
}

function publicChildProfile(child: FamilyChildProfile): Extract<FamilyProfile, { kind: "child" }> {
  let { userId: _userId, ...profile } = child;
  return profile;
}

/** The single deployment-scoped household state for Family OS. */
export class FamilyDurableObject extends DurableObject<Cloudflare.Env> {
  private storage: FamilyStorage;
  private deviceSessionAborts = new Map<string, Map<string, NativeRpcStub<() => void>>>();

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.storage = makeFamilyStorage(ctx.storage);
  }

  async getState(deviceId: string, loginIat: number, adultUserId: string): Promise<FamilyState> {
    return this.#state(await this.#session(deviceId, loginIat), adultUserId);
  }

  async resolveActiveUser(deviceId: string, loginIat: number, adultUserId: string)
      : Promise<FamilyDoResult<{ userId: string; generation: number }>> {
    return captureFamilyResult(async () => {
    let session = await this.#session(deviceId, loginIat);
    if (session.reauthenticateAfterLoginIat !== undefined) {
      throw createFamilyError(FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    }
    if (session.activeProfileId === "unselected") {
      throw createFamilyError(FAMILY_ERROR_CODES.profileSelectionRequired);
    }
    if (session.activeProfileId === "adult") return { userId: adultUserId, generation: session.generation };

    let child = this.storage.children.get(session.activeProfileId);
    if (!child) throw createFamilyError(FAMILY_ERROR_CODES.profileNotFound);
    return { userId: child.userId, generation: session.generation };
    });
  }

  async setPasscode(deviceId: string, loginIat: number, adultUserId: string, passcode: string)
      : Promise<FamilyDoResult<FamilyState>> {
    return captureFamilyResult(async () => {
    let session = await this.#session(deviceId, loginIat);
    if (session.reauthenticateAfterLoginIat !== undefined) {
      throw createFamilyError(FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    }
    // The Access adult may set the initial household passcode from the chooser while unselected.
    // Changing an already-configured passcode still requires an active adult profile.
    if (session.activeProfileId === "unselected") {
      if (this.storage.passcode.get()) {
        throw createFamilyError(FAMILY_ERROR_CODES.adultProfileRequired);
      }
    } else {
      this.#requireAdult(session);
    }
    if (!isAdultPasscode(passcode)) throw createFamilyError(FAMILY_ERROR_CODES.passcodeInvalid);

    let salt = crypto.randomUUID();
    this.storage.passcode.put({ salt, hash: await hashPasscode(passcode, salt) });
    return this.#state(session, adultUserId);
    });
  }

  async createChild(deviceId: string, loginIat: number, adultUserId: string, name: string)
      : Promise<FamilyDoResult<FamilyState>> {
    return captureFamilyResult(async () => {
    let session = await this.#session(deviceId, loginIat);
    this.#requireAdult(session);
    if (!this.storage.passcode.get()) throw createFamilyError(FAMILY_ERROR_CODES.passcodeRequired);

    let childProfile = createFamilyChildProfile(crypto.randomUUID(), name);
    let userObjectId = this.ctx.exports.UserDurableObject.idFromName(childProfile.id);
    let userId = userObjectId.toString();
    let child: FamilyChildProfile = { ...childProfile, userId };
    let user = this.ctx.exports.UserDurableObject.get(userObjectId);
    await user.initializeFamilyChild(child.id, child.name);
    this.storage.children.put(child);
    return this.#state(session, adultUserId);
    });
  }

  async setMonsterAvatar(deviceId: string, loginIat: number, adultUserId: string,
      avatarId: FamilyMonsterAvatarId)
      : Promise<FamilyDoResult<FamilyState>> {
    return captureFamilyResult(async () => {
    let session = await this.#session(deviceId, loginIat);
    if (session.reauthenticateAfterLoginIat !== undefined) {
      throw createFamilyError(FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    }
    if (!FAMILY_MONSTER_AVATAR_IDS.includes(avatarId)) {
      throw createFamilyError(FAMILY_ERROR_CODES.profileNotFound);
    }
    if (session.activeProfileId === "unselected") {
      throw createFamilyError(FAMILY_ERROR_CODES.profileSelectionRequired);
    }
    if (session.activeProfileId === "adult") {
      this.storage.adultMonsterAvatars.put({ adultUserId, avatarId });
    } else {
      let child = this.storage.children.get(session.activeProfileId);
      if (!child) throw createFamilyError(FAMILY_ERROR_CODES.profileNotFound);
      child.monsterAvatarId = avatarId;
      this.storage.children.put(child);
    }
    return this.#state(session, adultUserId);
    });
  }

  async selectAdult(deviceId: string, loginIat: number, passcode?: string): Promise<FamilyDoResult<void>> {
    return captureFamilyResult(async () => {
    let session = await this.#session(deviceId, loginIat);
    this.#requireChooserAdult(session);
    let baseline = this.storage.lastAcceptedAccessLoginIat.get();
    let passcodeConfigured = this.storage.passcode.get() !== null;
    // Bootstrap remains open until a household passcode exists: the Access adult may enter adult
    // mode without a passcode so the chooser can finish first-time setup.
    if (!passcodeConfigured || baseline === null || loginIat > baseline) {
      if (baseline === null || loginIat > baseline) {
        this.storage.lastAcceptedAccessLoginIat.put(loginIat);
      }
    } else if (!await this.#matchesPasscode(passcode)) {
      if (passcode !== undefined) await this.#rejectPasscode(session, loginIat);
      throw createFamilyError(passcodeConfigured
        ? FAMILY_ERROR_CODES.passcodeInvalid
        : FAMILY_ERROR_CODES.passcodeRequired);
    }
    await this.#transition(session, "adult");
    });
  }

  async selectChild(deviceId: string, loginIat: number, profileId: string)
      : Promise<FamilyDoResult<void>> {
    return captureFamilyResult(async () => {
    let session = await this.#session(deviceId, loginIat);
    this.#requireChooserAdult(session);
    selectFamilyChildProfile(session, Array.from(this.storage.children.list(), publicChildProfile), profileId);
    await this.#transition(session, session.activeProfileId);
    });
  }

  async switchToAdult(deviceId: string, loginIat: number, passcode: string)
      : Promise<FamilyDoResult<void>> {
    return captureFamilyResult(async () => {
    let session = await this.#session(deviceId, loginIat);
    if (session.reauthenticateAfterLoginIat !== undefined) {
      throw createFamilyError(FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    }
    if (session.activeProfileId === "adult") return;

    if (!await this.#matchesPasscode(passcode)) await this.#rejectPasscode(session, loginIat);
    await this.#transition(session, "adult");
    });
  }

  async assertGeneration(deviceId: string, generation: number): Promise<FamilyDoResult<void>> {
    return captureFamilyResult(async () => {
    let session = this.storage.deviceSessions.get(deviceId);
    if (!session || session.generation !== generation || session.activeProfileId === "unselected"
        || session.reauthenticateAfterLoginIat !== undefined) {
      throw createFamilyError(FAMILY_ERROR_CODES.profileCapabilityRevoked);
    }
    });
  }

  registerDeviceSessionAbort(deviceId: string, sessionId: string, abort: NativeRpcStub<() => void>): void {
    let handlers = this.deviceSessionAborts.get(deviceId) ?? new Map();
    handlers.get(sessionId)?.[Symbol.dispose]();
    handlers.set(sessionId, abort.dup());
    this.deviceSessionAborts.set(deviceId, handlers);
  }

  unregisterDeviceSessionAbort(deviceId: string, sessionId: string): void {
    let handlers = this.deviceSessionAborts.get(deviceId);
    let abort = handlers?.get(sessionId);
    if (!handlers || !abort) return;
    handlers.delete(sessionId);
    abort[Symbol.dispose]();
    if (handlers.size === 0) this.deviceSessionAborts.delete(deviceId);
  }

  async revokeDeviceSessionSiblings(deviceId: string, keepSessionId: string): Promise<void> {
    await this.#revokeDeviceSessionAborts(deviceId, keepSessionId);
  }

  async revokeAllDeviceSessionAborts(deviceId: string): Promise<void> {
    await this.#revokeDeviceSessionAborts(deviceId, undefined);
  }

  async #revokeDeviceSessionAborts(deviceId: string, keepSessionId: string | undefined): Promise<void> {
    let handlers = this.deviceSessionAborts.get(deviceId);
    if (!handlers) return;
    let entries = Array.from(handlers.entries());
    for (let [sessionId, abort] of entries) {
      if (sessionId === keepSessionId) continue;
      handlers.delete(sessionId);
      try {
        void abort().catch(() => {});
      } catch {
        // A browser may have disconnected before its unregister RPC reached this object.
      }
      abort[Symbol.dispose]();
    }
    if (handlers.size === 0) this.deviceSessionAborts.delete(deviceId);
  }

  async #session(deviceId: string, loginIat: number): Promise<FamilyDeviceSession> {
    let existing = this.storage.deviceSessions.get(deviceId);
    let session = existing ?? createFamilyDeviceSession(deviceId);
    let wasLocked = session.reauthenticateAfterLoginIat !== undefined;
    applyAccessReauthentication(session, loginIat);
    if (wasLocked && session.reauthenticateAfterLoginIat === undefined) {
      let baseline = this.storage.lastAcceptedAccessLoginIat.get();
      if (baseline === null || loginIat > baseline) this.storage.lastAcceptedAccessLoginIat.put(loginIat);
      await this.#transition(session, "adult");
      void this.revokeAllDeviceSessionAborts(session.deviceId);
    } else if (!existing) {
      this.storage.deviceSessions.put(session);
    }
    return session;
  }

  #state(session: FamilyDeviceSession, adultUserId: string): FamilyState {
    let childProfiles = Array.from(this.storage.children.list(), publicChildProfile);
    let activeProfile: FamilyProfile = session.activeProfileId === "unselected"
      ? { kind: "unselected", id: "unselected" }
      : session.activeProfileId === "adult"
      ? { kind: "adult", id: "adult",
          monsterAvatarId: this.storage.adultMonsterAvatars.get(adultUserId)?.avatarId }
      : childProfiles.find((profile) => profile.id === session.activeProfileId)
        ?? { kind: "unselected", id: "unselected" };
    return {
      activeProfile,
      childProfiles,
      adultMonsterAvatarId: this.storage.adultMonsterAvatars.get(adultUserId)?.avatarId,
      passcodeConfigured: this.storage.passcode.get() !== null,
      requiresAccessReauthentication: session.reauthenticateAfterLoginIat !== undefined,
    };
  }

  #requireAdult(session: FamilyDeviceSession): void {
    if (session.reauthenticateAfterLoginIat !== undefined) {
      throw createFamilyError(FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    }
    if (session.activeProfileId !== "adult") {
      throw createFamilyError(FAMILY_ERROR_CODES.adultProfileRequired);
    }
  }

  #requireChooserAdult(session: FamilyDeviceSession): void {
    if (session.reauthenticateAfterLoginIat !== undefined) {
      throw createFamilyError(FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    }
    if (session.activeProfileId === "child" || session.activeProfileId !== "unselected"
        && session.activeProfileId !== "adult") {
      throw createFamilyError(FAMILY_ERROR_CODES.adultProfileRequired);
    }
  }

  async #matchesPasscode(passcode: string | undefined): Promise<boolean> {
    let storedPasscode = this.storage.passcode.get();
    if (!storedPasscode || !passcode || !isAdultPasscode(passcode)) return false;
    let hash = await hashPasscode(passcode, storedPasscode.salt);
    return equalBytes(Uint8Array.fromBase64(hash), Uint8Array.fromBase64(storedPasscode.hash));
  }

  async #rejectPasscode(session: FamilyDeviceSession, loginIat: number): Promise<never> {
    Object.assign(session, recordInvalidPasscodeAttempt(session.failedPasscodeAttempts, loginIat));
    if (session.reauthenticateAfterLoginIat !== undefined) {
      await this.#bumpGeneration(session);
      throw createFamilyError(FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    }
    this.storage.deviceSessions.put(session);
    throw createFamilyError(FAMILY_ERROR_CODES.passcodeInvalid);
  }

  async #transition(session: FamilyDeviceSession, activeProfileId: FamilyDeviceSession["activeProfileId"])
      : Promise<void> {
    session.activeProfileId = activeProfileId;
    session.failedPasscodeAttempts = 0;
    delete session.reauthenticateAfterLoginIat;
    await this.#bumpGeneration(session);
  }

  async #bumpGeneration(session: FamilyDeviceSession): Promise<void> {
    session.generation++;
    this.storage.deviceSessions.put(session);
  }
}
