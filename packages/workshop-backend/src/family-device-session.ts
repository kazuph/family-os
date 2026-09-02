import { DurableObject } from "cloudflare:workers";
import { RpcSession, type RpcTarget, type RpcTransport } from "capnweb";
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

const SESSION_RESET_CLOSE_CODE = 1012;
const SESSION_RESET_CLOSE_REASON = "session reset";
const SESSION_REVOKED_CLOSE_CODE = 1008;
const SESSION_REVOKED_CLOSE_REASON = "family session revoked";
const RPC_FAILURE_CLOSE_CODE = 1011;
const RPC_FAILURE_CLOSE_REASON = "rpc session failed";
const HEARTBEAT_REQUEST = "ping";
const HEARTBEAT_RESPONSE = "pong";

type FamilyDeviceAttachment = {
  email: string;
  sub: string;
  loginIat: number;
  deviceId: string;
  deviceSessionId: string;
  instanceId: string;
};

class HibernatableWebSocketTransport implements RpcTransport {
  #messages: string[] = [];
  #receiver?: ReturnType<typeof Promise.withResolvers<string>>;
  #closed?: Error;

  constructor(private socket: WebSocket) {}

  send(message: string): void {
    if (this.#closed) throw this.#closed;
    this.socket.send(message);
  }

  receive(): Promise<string> {
    if (this.#closed) return Promise.reject(this.#closed);
    let message = this.#messages.shift();
    if (message !== undefined) return Promise.resolve(message);
    if (this.#receiver) throw new Error("Concurrent RPC receives are not supported.");
    this.#receiver = Promise.withResolvers<string>();
    return this.#receiver.promise;
  }

  abort(reason: unknown): void {
    this.close(reason instanceof Error ? reason : new Error(String(reason)),
        RPC_FAILURE_CLOSE_CODE, RPC_FAILURE_CLOSE_REASON);
  }

  deliver(message: string): void {
    if (this.#closed) return;
    if (this.#receiver) {
      let receiver = this.#receiver;
      this.#receiver = undefined;
      receiver.resolve(message);
    } else {
      this.#messages.push(message);
    }
  }

  close(reason: Error, code: number, closeReason: string): void {
    if (this.#closed) return;
    this.#closed = reason;
    this.#messages.length = 0;
    this.#receiver?.reject(reason);
    this.#receiver = undefined;
    try {
      this.socket.close(code, closeReason);
    } catch {
      // The peer may already have completed the close handshake.
    }
  }
}

type LiveSession = {
  transport: HibernatableWebSocketTransport;
  closer: Disposable;
};

/** Registers the Access-mode RPC root factory used by each device WebSocket session. */
export function registerFamilyAccessApiFactory(factory: FamilyAccessApiFactory): void {
  accessApiFactory = factory;
}

/** Owns every live Family OS WebSocket for one browser device cookie. */
export class FamilyDeviceSessionDurableObject extends DurableObject<Cloudflare.Env> {
  #sessions = new Map<WebSocket, LiveSession>();
  #resettingSockets = new WeakSet<WebSocket>();
  #instanceId = crypto.randomUUID();

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(HEARTBEAT_REQUEST, HEARTBEAT_RESPONSE));
    logger.info("family device session instance initialized", {
      event: "family.device-session.instance.initialized",
      durableObjectId: ctx.id.toString(),
      executionId: this.#instanceId,
    });
  }

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
    let attachment: FamilyDeviceAttachment = {
      email, sub, loginIat, deviceId, deviceSessionId, instanceId: this.#instanceId,
    };
    serverSocket.serializeAttachment(attachment);
    this.ctx.acceptWebSocket(serverSocket);

    let liveSession: LiveSession | undefined;
    let aborted = false;
    let abortSession = (reason: Error) => {
      logger.warn("aborting family device session", { event: "family.device-session.abort", error: reason });
      if (!liveSession) {
        aborted = true;
        return;
      }
      liveSession.transport.close(reason, SESSION_REVOKED_CLOSE_CODE, SESSION_REVOKED_CLOSE_REASON);
      liveSession.closer[Symbol.dispose]();
    };

    let api = factory(this.ctx, this.env, abortSession, { email, sub }, deviceId, loginIat, deviceSessionId);
    let transport = new HibernatableWebSocketTransport(serverSocket);
    let rpcSession = new RpcSession(transport, api);
    liveSession = {transport, closer: rpcSession.getRemoteMain()};
    this.#sessions.set(serverSocket, liveSession);
    if (aborted) abortSession(new Error("family session revoked during connection setup"));
    let headers = new Headers();
    headers.set(FAMILY_DEVICE_SESSION_ID_HEADER, deviceSessionId);
    return new Response(null, { status: 101, webSocket: pair[1], headers });
  }

  webSocketMessage(socket: WebSocket, message: ArrayBuffer | string): void {
    let attachment = socket.deserializeAttachment() as FamilyDeviceAttachment | null;
    let liveSession = this.#sessions.get(socket);
    if (!attachment || attachment.instanceId !== this.#instanceId || !liveSession) {
      if (this.#resettingSockets.has(socket)) return;
      this.#resettingSockets.add(socket);
      logger.info("resetting hibernated family device session", {
        event: "family.device-session.hibernate.reset",
        durableObjectId: this.ctx.id.toString(),
        executionId: this.#instanceId,
        operation: attachment?.deviceSessionId ?? "unknown-session",
      });
      this.#sessions.delete(socket);
      liveSession?.transport.close(new Error(SESSION_RESET_CLOSE_REASON),
          SESSION_RESET_CLOSE_CODE, SESSION_RESET_CLOSE_REASON);
      liveSession?.closer[Symbol.dispose]();
      if (!liveSession) socket.close(SESSION_RESET_CLOSE_CODE, SESSION_RESET_CLOSE_REASON);
      return;
    }
    if (typeof message !== "string") {
      liveSession.transport.close(new TypeError("Cap'n Web messages must be text."), 1003,
          "text messages required");
      return;
    }
    liveSession.transport.deliver(message);
  }

  webSocketClose(socket: WebSocket, code: number, reason: string, wasClean: boolean): void {
    let liveSession = this.#sessions.get(socket);
    this.#sessions.delete(socket);
    liveSession?.transport.close(
        new Error(`WebSocket closed (${code}, ${wasClean ? "clean" : "unclean"}): ${reason}`),
        code, reason);
    liveSession?.closer[Symbol.dispose]();
  }

  webSocketError(socket: WebSocket, error: unknown): void {
    let liveSession = this.#sessions.get(socket);
    this.#sessions.delete(socket);
    let reason = error instanceof Error ? error : new Error(String(error));
    liveSession?.transport.close(reason, RPC_FAILURE_CLOSE_CODE, RPC_FAILURE_CLOSE_REASON);
    liveSession?.closer[Symbol.dispose]();
    logger.warn("family device session WebSocket failed", {
      event: "family.device-session.websocket.error",
      error: reason,
    });
  }
}
