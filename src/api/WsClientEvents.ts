import type { Account } from "../models/Account";

export interface WsClientEvents {
  accountList: Account[];
  beginAuth: { verificationUri: string; userCode: string };
  offline: void;
}
