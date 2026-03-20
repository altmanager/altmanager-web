import type { Account } from "../models/Account";

export interface WsClientEvents {
  accountList: Account[];
  account: { account: Account | null; requested: string };
  beginAuth: { verificationUri: string; userCode: string };
  offline: void;
}
