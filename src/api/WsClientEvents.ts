import type { Account } from "../models/Account";

export interface WsClientEvents {
  accountList: Account[];
  account: { account: Account | null; requested: string };
  beginAuth: { verificationUri: string; userCode: string };
  offline: void;
  chat: { account: string; message: unknown };
  kick: { account: string; reason: unknown };
  playerList: {
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
}
