import { describe, expect, it } from "vitest";
import {
  applyAccessReauthentication,
  assertAdultFamilyProfile,
  createFamilyChildProfile,
  createFamilyDeviceSession,
  isAdultPasscode,
  recordInvalidPasscodeAttempt,
  restoreAdultProfile,
  selectFamilyChildProfile,
} from "../src/family.js";
import { FAMILY_ERROR_CODES, FAMILY_MONSTER_AVATAR_IDS, getFamilyErrorCode } from "@gadgets/workshop-shared/api";

describe("Family OS device profile transitions", () => {
  it("starts every new browser device unselected and without an API generation", () => {
    expect(createFamilyDeviceSession("browser-a")).toMatchObject({
      activeProfileId: "unselected",
      failedPasscodeAttempts: 0,
      generation: 0,
    });
  });

  it("creates an email-free child profile and persists its selection only on that device", () => {
    let child = createFamilyChildProfile("child-1", "Mochi");
    let firstDevice = createFamilyDeviceSession("browser-a");
    let otherDevice = createFamilyDeviceSession("browser-b");

    selectFamilyChildProfile(firstDevice, [child], child.id);

    expect(child).toEqual({ kind: "child", id: "child-1", name: "Mochi" });
    expect(firstDevice.activeProfileId).toBe(child.id);
    expect(otherDevice.activeProfileId).toBe("unselected");
  });

  it("fails closed for an unknown child profile", () => {
    let device = createFamilyDeviceSession("browser-a");
    let error: unknown;
    try {
      selectFamilyChildProfile(device, [], "not-a-child");
    } catch (caught) {
      error = caught;
    }
    expect(getFamilyErrorCode(error)).toBe(FAMILY_ERROR_CODES.profileNotFound);
    expect(device.activeProfileId).toBe("unselected");
  });

  it("keeps child mode for the first two invalid passcodes and locks on the third", () => {
    let device = { ...createFamilyDeviceSession("browser-a"), activeProfileId: "child-1" };
    Object.assign(device, recordInvalidPasscodeAttempt(device.failedPasscodeAttempts, 100));
    expect(device).toMatchObject({ activeProfileId: "child-1", failedPasscodeAttempts: 1 });
    Object.assign(device, recordInvalidPasscodeAttempt(device.failedPasscodeAttempts, 100));
    expect(device).toMatchObject({ activeProfileId: "child-1", failedPasscodeAttempts: 2 });
    Object.assign(device, recordInvalidPasscodeAttempt(device.failedPasscodeAttempts, 100));
    expect(device).toMatchObject({
      activeProfileId: "child-1",
      failedPasscodeAttempts: 3,
      reauthenticateAfterLoginIat: 100,
    });
  });

  it("accepts only a newer Access login after a three-strike lock", () => {
    let device = {
      ...createFamilyDeviceSession("browser-a"),
      activeProfileId: "child-1",
      failedPasscodeAttempts: 3,
      reauthenticateAfterLoginIat: 100,
    };
    applyAccessReauthentication(device, 100);
    expect(device.activeProfileId).toBe("child-1");
    applyAccessReauthentication(device, 101);
    expect(device).toMatchObject({ activeProfileId: "adult", failedPasscodeAttempts: 0 });
    expect(device.reauthenticateAfterLoginIat).toBeUndefined();
  });

  it("accepts exactly the shared six-digit adult passcode format", () => {
    expect(isAdultPasscode("012345")).toBe(true);
    expect(isAdultPasscode("1234")).toBe(false);
    expect(isAdultPasscode("12345")).toBe(false);
    expect(isAdultPasscode("1234567")).toBe(false);
    expect(isAdultPasscode("12ab56")).toBe(false);
  });

  it("fails closed for adult-only actions while a child profile is active", () => {
    expect(() => assertAdultFamilyProfile(false)).not.toThrow();
    try {
      assertAdultFamilyProfile(true);
      throw new Error("expected adultProfileRequired");
    } catch (error) {
      expect(getFamilyErrorCode(error)).toBe(FAMILY_ERROR_CODES.adultProfileRequired);
    }
  });

  it("restores adult mode and resets the counter only after a valid server-side passcode check", () => {
    let device = {
      ...createFamilyDeviceSession("browser-a"),
      activeProfileId: "child-1",
      failedPasscodeAttempts: 2,
    };
    restoreAdultProfile(device);
    expect(device).toEqual({
      deviceId: "browser-a",
      activeProfileId: "adult",
      failedPasscodeAttempts: 0,
      generation: 0,
    });
  });
});

describe("Family OS monster avatar allowlist", () => {
  it("publishes 32 ids covering 8 shapes and 4 color phases including cyan", () => {
    expect(FAMILY_MONSTER_AVATAR_IDS).toHaveLength(32);
    expect(new Set(FAMILY_MONSTER_AVATAR_IDS).size).toBe(32);
    for (let shape = 1; shape <= 8; shape++) {
      let prefix = `monster-${String(shape).padStart(2, "0")}-`;
      for (let phase of ["warm", "cool", "violet", "cyan"] as const) {
        expect(FAMILY_MONSTER_AVATAR_IDS).toContain(`${prefix}${phase}`);
      }
    }
  });
});
