import { Account } from "../models/Account";
import { TypedEventTarget } from "../TypedEventTarget";
import type { WsClientEvents } from "./WsClientEvents";
import { AccountStatus } from "../models/AccountStatus";

export class WsClient extends TypedEventTarget<WsClientEvents> {
  private readonly socket: WebSocket;
  private readonly accounts: Map<string, Account> = new Map();

  public constructor(url: string) {
    super();
    this.socket = new WebSocket(url);

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    });

    this.socket.addEventListener("close", () => {
      this.dispatchEvent("offline", void 0);
    });
  }

  public addAccount(): Promise<{ verificationUri: string; userCode: string }> {
    return new Promise((resolve) => {
      this.addEventListener("beginAuth", (e) => {
        resolve(e.detail);
      }, { once: true });

      this.socket.send(JSON.stringify({ type: "addAccount" }));
    });
  }

  private handleMessage(message: Record<string, unknown>): void {
    switch (message.type) {
      case "accountList": {
        const raw = message.accounts as Array<
          {
            uuid: string;
            username: string;
            skinUrl: string;
            status: AccountStatus;
            lastServer: string | null;
          }
        >;
        this.accounts.clear();
        for (const a of raw) {
          this.accounts.set(
            a.uuid,
            new Account(a.uuid, a.username, a.skinUrl, a.status, a.lastServer),
          );
        }
        this.dispatchEvent("accountList", Array.from(this.accounts.values()));
        break;
      }
      case "beginAuth": {
        const { verificationUri, userCode } = message as {
          verificationUri: string;
          userCode: string;
        };
        this.dispatchEvent("beginAuth", { verificationUri, userCode });
        break;
      }
    }
  }
}
