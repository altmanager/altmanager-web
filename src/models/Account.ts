import { AccountStatus } from "./AccountStatus";

export class Account {
  public readonly uuid: string;
  public readonly username: string;
  public readonly skinUrl: string;
  public readonly status: AccountStatus;
  public readonly lastServer: string | null;
  public readonly onlineSince: Date | null;

  public constructor(
    uuid: string,
    username: string,
    skinUrl: string,
    status: AccountStatus,
    lastServer: string | null,
    onlineSince: Date | null,
  ) {
    this.uuid = uuid;
    this.username = username;
    this.skinUrl = skinUrl;
    this.status = status;
    this.lastServer = lastServer;
    this.onlineSince = onlineSince;
  }
}
