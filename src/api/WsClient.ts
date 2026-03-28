import { Account } from "../models/Account";
import { TypedEventTarget } from "../TypedEventTarget";
import type { WsClientEvents } from "./WsClientEvents";
import { AccountStatus } from "../models/AccountStatus";

export class WsClient extends TypedEventTarget<WsClientEvents> {
  private readonly socket: WebSocket;
  private readonly accounts: Map<string, Account> = new Map();

  private constructor(url: URL | string) {
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

  public static connect(url: URL | string): Promise<WsClient> {
    const client = new WsClient(url);
    return new Promise((resolve, reject) => {
      client.socket.addEventListener("open", () => resolve(client));
      client.socket.addEventListener("error", (e) => reject(e), { once: true });
    });
  }

  public listAccounts(): Promise<Account[]> {
    return new Promise((resolve) => {
      this.socket.send(JSON.stringify({ type: "accounts:list" }));

      this.addEventListener("accountList", (e) => {
        resolve(e.detail);
      }, { once: true });
    });
  }

  public getAccount(uuid: string): Promise<Account | null> {
    return new Promise((resolve) => {
      this.socket.send(JSON.stringify({ type: "accounts:get", account: uuid }));

      const subscribe = () => {
        this.addEventListener("account", (e) => {
          if (e.detail.requested !== uuid) {
            subscribe();
            return;
          }
          resolve(e.detail.account);
        }, { once: true });
      };

      subscribe();
    });
  }

  public addAccount(): Promise<{ verificationUri: string; userCode: string }> {
    return new Promise((resolve) => {
      this.socket.send(JSON.stringify({ type: "accounts:add" }));

      this.addEventListener("beginAuth", (e) => {
        resolve(e.detail);
      }, { once: true });
    });
  }

  public connect(account: Account, address: string): void {
    this.socket.send(
      JSON.stringify({
        type: "player:connect",
        account: account.uuid,
        server: address,
      }),
    );
  }

  public disconnect(account: Account): void {
    this.socket.send(
      JSON.stringify({ type: "player:disconnect", account: account.uuid }),
    );
  }

  public sendChat(account: Account, message: string): void {
    if (account.status !== AccountStatus.ONLINE) {
      return;
    }
    this.socket.send(
      JSON.stringify({ type: "player:chat", account: account.uuid, message }),
    );
  }

  private handleMessage(message: Record<string, unknown>): void {
    switch (message.type) {
      case "accounts:list": {
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
      case "accounts:one": {
        const raw = message as {
          account: {
            uuid: string;
            username: string;
            skinUrl: string;
            status: AccountStatus;
            lastServer: string | null;
          } | null;
          request: string;
        };
        if (raw.account === null) {
          this.accounts.delete(raw.request);
          this.dispatchEvent("account", {
            account: null,
            requested: raw.request,
          });
          break;
        }
        const account = new Account(
          raw.account.uuid,
          raw.account.username,
          raw.account.skinUrl,
          raw.account.status,
          raw.account.lastServer,
        );
        this.accounts.set(account.uuid, account);
        this.dispatchEvent("account", { account, requested: raw.request });
        break;
      }
      case "accounts:auth": {
        const { verificationUri, userCode } = message as {
          verificationUri: string;
          userCode: string;
        };
        this.dispatchEvent("beginAuth", { verificationUri, userCode });
        break;
      }
      case "player:chat": {
        const { account, message: chat } = message as {
          account: string;
          message: unknown;
        };
        this.dispatchEvent("chat", { account, message: chat });
        break;
      }
      case "player:kick": {
        const { account, reason } = message as {
          account: string;
          reason: unknown;
        };
        this.dispatchEvent("kick", { account, reason });
        break;
      }
      case "player:server-players-list": {
        const { account, players } = message as {
          account: string;
          players: {
            uuid: string;
            name: string;
            displayName: unknown;
            ping: number;
            priority: number;
            gamemode: number;
            listed: boolean;
          }[];
        };

        this.dispatchEvent("playerList", { account, players });
        break;
      }
    }
  }
}
