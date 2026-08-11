import { DurableObject } from "cloudflare:workers";
import { newWebSocketRpcSession, type RpcTarget } from "capnweb";
import type { JWTPayload } from "jose";
import { createWorkshopLogger } from "./observability.js";

const logger = createWorkshopLogger("workshop.family-device-session");

/** Internal header carrying the verified Access login timestamp for one browser device. */
export const FAMILY_LOGIN_IAT_HEADER = "X-Family-Login-Iat";
/** Internal header carrying the verified Access adult email for one browser device. */
export const FAMILY_ADULT_EMAIL_HEADER = "X-Family-Adult-Email";
/** Internal header carrying the verified Access adult subject for one browser device. */
export const FAMILY_ADULT_SUB_HEADER = "X-Family-Adult-Sub";
/** Response header pairing the client WebSocket with its device session id. */
export const FAMILY_DEVICE_SESSION_ID_HEADER = "X-Family-Device-Session-Id";

export type FamilyAccessApiFactory = (
  ctx: DurableObjectState,
  env: Cloudflare.Env,
  abortSession: (reason: Error) => void,
  accessPayload: JWTPayload,
  deviceId: string,
  loginIat: number,
  deviceSessionId: string,
) => RpcTarget;

let accessApiFactory: FamilyAccessApiFactory | undefined;

/** Registers the Access-mode RPC root factory used by each device WebSocket session. */
export function registerFamilyAccessApiFactory(factory: FamilyAccessApiFactory): void {
  accessApiFactory = factory;
}

/** Owns every live Family OS WebSocket for one browser device cookie. */
export class FamilyDeviceSessionDurableObject extends DurableObject<Cloudflare.Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket.", { status: 426 });
    }

    let factory = accessApiFactory;
    if (!factory) return new Response("Family OS sessions are unavailable.", { status: 503 });

    let email = request.headers.get(FAMILY_ADULT_EMAIL_HEADER);
    let sub = request.headers.get(FAMILY_ADULT_SUB_HEADER);
    let loginIat = Number(request.headers.get(FAMILY_LOGIN_IAT_HEADER));
    let deviceId = this.ctx.id.name;
    if (!email || !sub || !Number.isFinite(loginIat) || !deviceId) {
      return new Response("Invalid Family OS session.", { status: 400 });
    }

    let deviceSessionId = crypto.randomUUID();
    let pair = new WebSocketPair();
    let serverSocket = pair[0];
    serverSocket.accept();

    let rpcSession: ReturnType<typeof newWebSocketRpcSession> | undefined;
    let aborted = false;
    let abortSession = (reason: Error) => {
      logger.warn("aborting family device session", { event: "family.device-session.abort", error: reason });
      if (!rpcSession) {
        aborted = true;
        return;
      }
      rpcSession[Symbol.dispose]();
    };

    let api = factory(this.ctx, this.env, abortSession, { email, sub }, deviceId, loginIat, deviceSessionId);
    rpcSession = newWebSocketRpcSession(serverSocket, api);
    if (aborted) rpcSession[Symbol.dispose]();
    let headers = new Headers();
    headers.set(FAMILY_DEVICE_SESSION_ID_HEADER, deviceSessionId);
    return new Response(null, { status: 101, webSocket: pair[1], headers });
  }
}
