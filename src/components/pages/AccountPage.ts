import { customElement, state } from "lit/decorators.js";
import { Page } from "./Page";
import { html, nothing } from "lit";
import { Match } from "navigo";
import { Account } from "../../models/Account";
import { WsClient } from "../../api/WsClient";
import { AccountStatus } from "../../models/AccountStatus";
import { RecentServers } from "../../RecentServers";
import { createRef, ref } from "lit/directives/ref.js";
import { ClickEvent } from "../../text/ClickEvent";
import { PlayerConsole } from "../PlayerConsole";
import { McText } from "../McText";

@customElement("account-page")
export class AccountPage extends Page {
  private static readonly consoles = new Map<string, PlayerConsole>();
  private static readonly playerLists = new Map<string, {
    uuid: string;
    name: string;
    displayName: unknown;
    ping: number;
    priority: number;
    gamemode: number;
    listed: boolean;
  }[]>();

  @state()
  private account?: Account | null;

  @state()
  private playerList: {
    uuid: string;
    name: string;
    displayName: unknown;
    ping: number;
    priority: number;
    gamemode: number;
    listed: boolean;
  }[] = [];

  @state()
  private ping?: number;

  private uuid?: string;

  private readonly api: WsClient;
  private readonly recentServers = RecentServers.load();
  private console: PlayerConsole | null = null;

  public constructor(api: WsClient) {
    super("/p/:uuid");
    this.api = api;
  }

  private static readonly PING_COLORS = {
    50: "text-green-400",
    100: "text-lime-400",
    150: "text-amber-400",
    200: "text-orange-400",
  };

  private static pingColor(ping: number): string {
    for (const [max, color] of Object.entries(this.PING_COLORS)) {
      if (ping <= Number(max)) {
        return color;
      }
    }
    return "text-red-400";
  }

  public override onOpen(match?: Match) {
    super.onOpen(match);
    this.account = undefined;

    if (match === undefined || match.data === null) {
      this.account = null;
      return;
    }

    this.uuid = match.data.uuid;
    this.api.getAccount(match.data.uuid).then();
    if (!AccountPage.consoles.has(this.uuid)) {
      const console = new PlayerConsole(
        (input) => {
          if (this.account === null || this.account === undefined) {
            return;
          }
          this.api.sendChat(this.account, input);
        },
        JSON.parse(
          localStorage.getItem("consoleInputHistory") ?? "{}",
        )[this.uuid!],
      );
      AccountPage.consoles.set(this.uuid, console);
      console.addEventListener("submit", (e) => {
        const history = JSON.parse(
          localStorage.getItem("consoleInputHistory") ?? "{}",
        );
        history[this.uuid!] = console.history.slice(-100);
        localStorage.setItem("consoleInputHistory", JSON.stringify(history));
      });
    }
    this.console = AccountPage.consoles.get(this.uuid)!;
    this.console.disabled = true;
    this.playerList = AccountPage.playerLists.get(this.uuid) ?? [];
    this.ping = this.playerList.find((p) =>
      p.uuid.replaceAll("-", "") === this.uuid?.replaceAll("-", "")
    )?.ping;
  }

  public override firstUpdated() {
    this.api.addEventListener("account", (e) => {
      if (e.detail.requested !== this.uuid) {
        return;
      }

      this.account = e.detail.account;
      if (this.account !== null && this.console !== null) {
        this.console.disabled = this.account.status !== AccountStatus.ONLINE;
      }
    });

    this.api.addEventListener("chat", (e) => {
      const console = AccountPage.consoles.get(e.detail.account);
      if (console === undefined) {
        return;
      }
      console.write(e.detail.message);
    });

    this.api.addEventListener("playerList", (e) => {
      AccountPage.playerLists.set(e.detail.account, e.detail.players);
      if (this.uuid === e.detail.account) {
        this.playerList = e.detail.players;
        this.ping = this.playerList.find((p) =>
          p.uuid.replaceAll("-", "") === this.uuid?.replaceAll("-", "")
        )?.ping;
      }
    });

    this.api.addEventListener("kick", (e) => {
      const console = AccountPage.consoles.get(e.detail.account);
      if (console === undefined) {
        return;
      }
      console.write(e.detail.reason, "Kicked");
    });
  }

  public override render() {
    const input = createRef<HTMLInputElement>();
    if (this.account === undefined) {
      return nothing;
    }

    document.title = this.account === null
      ? "AltManager"
      : this.account.username;

    return html`
      <div class="flex p-2">
        <a
          href="/"
          class="rounded-md p-2 text-white outline-2 outline-offset-1 outline-transparent transition-all duration-150 hover:bg-white/5 focus-visible:-outline-offset-2 focus-visible:outline-blue-400/70 active:bg-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4 fill-current"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path
              d="M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z"
            >
            </path>
          </svg>
          <span class="sr-only">Accounts</span>
        </a>
      </div>
      ${this.account === null ? nothing : html`
        <div class="mx-auto flex max-w-5xl gap-6 px-2 py-8">
          <div class="flex w-2/3 shrink-0 max-w-2xl flex-col gap-6">
            <h2 class="sr-only">Profile</h2>
            <div class="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
              <div class="flex gap-4">
                <img
                  class="size-12 rounded-lg bg-zinc-800 shadow-sm outline -outline-offset-1 outline-white/10"
                  src="https://mc-heads.net/avatar/${this.account.uuid}"
                  alt=""
                />
                <div>
                  <p class="font-medium text-white focus-visible:outline-none">
                    ${this.account.username}
                  </p>
                  ${this.account.status === AccountStatus.DISCONNECTED
                    ? html`
                      <p class="mt-1 text-sm text-zinc-400">Offline</p>
                    `
                    : nothing}
                  <div class="mt-1 flex ${this.account.status ===
                      AccountStatus.ONLINE
                    ? "flex"
                    : "hidden"}" aria-label="health: 15">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-red-400"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-red-400"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-red-400"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-red-400"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-red-400"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-red-400"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-red-400"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-red-400"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.67,108.21,129a8,8,0,0,0,7.58,0C136.21,228.67,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8V104a48,48,0,0,1,41.61-47.56A83.85,83.85,0,0,1,178,56a46.06,46.06,0,0,1,46,46C224,155.61,146.25,204.15,128,214.8Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-zinc-600"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 fill-zinc-600"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"
                      >
                      </path>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                ${this.account.status !== AccountStatus.ONLINE ? nothing : html`
                  <button
                    @click="${() => {
                      if (
                        this.account === null || this.account === undefined
                      ) {
                        return;
                      }
                      this.api.disconnect(this.account);
                    }}"
                    type="button"
                    class="inline-flex w-full justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white outline-2 outline-offset-4 outline-transparent transition-all duration-150 hover:bg-red-400 focus-visible:outline-offset-2 focus-visible:outline-blue-400/70 disabled:cursor-not-allowed disabled:brightness-50 disabled:hover:bg-blue-500"
                  >
                    Disconnect
                  </button>
                `}
                <div class="relative">
                  <button
                    class="rounded-lg p-2 text-white outline-2 outline-offset-1 outline-transparent transition-all duration-150 hover:bg-white/5 focus-visible:-outline-offset-2 focus-visible:outline-blue-400/70 active:bg-white/10 anchor/account-options"
                    command="toggle-popover"
                    commandfor="account-options"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-5 fill-current"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M112,60a16,16,0,1,1,16,16A16,16,0,0,1,112,60Zm16,52a16,16,0,1,0,16,16A16,16,0,0,0,128,112Zm0,68a16,16,0,1,0,16,16A16,16,0,0,0,128,180Z"
                      >
                      </path>
                    </svg>
                    <span class="sr-only">Account Options</span>
                  </button>
                  <ul
                    class="mt-1 w-52 flex-col rounded-xl bg-zinc-700 p-1 shadow ring ring-black/10 ring-inset open:flex anchored-bottom/account-options right-anchor-right"
                    popover
                    closedby="any"
                    id="account-options"
                  >
                    <li>
                      <button
                        class="w-full rounded-lg px-3 py-1 text-left text-sm text-white hover:bg-white/10"
                      >
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <h2 class="mb-2 font-semibold text-white">Console</h2>
              ${this.console}
            </div>
          </div>
          <div class="flex flex-1 shrink-0 flex-col gap-6 w-1/3">
            ${this.account.status === AccountStatus.ONLINE
              ? html`
                <h2 class="sr-only">Server</h2>
                <div class="rounded-xl bg-zinc-800 p-4">
                  <div class="flex justify-between items-center gap-2">
                    <p class="text-white font-medium truncate">
                      <span class="sr-only">Server address </span>${this.account
                        .lastServer}
                    </p>
                    ${this.ping === undefined ? nothing : html`
                      <p class="text-sm tabular-nums shrink-0 ${AccountPage
                        .pingColor(this.ping)}">
                        <span class="sr-only">Latency </span>${this.ping} ms
                      </p>
                    `}
                  </div>
                  <div class="flex justify-between items-center gap-2">
                    <p class="mt-1 text-sm text-zinc-400">
                      <span class="sr-only">Client version </span>1.21.11
                    </p>
                    <p class="mt-1 text-sm text-zinc-400 tabular-nums">
                      <span class="sr-only">Online for</span>
                      <time datetime="PT0M0S">0:00</time>
                    </p>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between">
                    <h2 class="mb-2 font-semibold text-white">Online Players</h2>
                    <p class="text-zinc-400 tabular-nums text-sm">${this
                      .playerList.filter((p) => p.listed).length}</p>
                  </div>
                  <div class="rounded-xl bg-zinc-800 p-4">
                    ${this.playerList.length === 0
                      ? html`
                        <p class="italic text-zinc-500 text-center text-sm">None?</p>
                      `
                      : this.playerList.filter((p) => p.listed).map((p) =>
                        html`
                          <li class="flex justify-between items-center">
                            <p class="text-white font-medium">
                              <span class="sr-only">Username: </span>${p
                                  .displayName === undefined
                                ? p.name
                                : new McText(JSON.stringify(p.displayName))}
                            </p>
                            <div class="flex">
                              <p class="text-sm tabular-nums ${AccountPage
                                .pingColor(p.ping)}">
                                <span class="sr-only">Latency: </span>${p
                                  .ping} ms
                              </p>
                            </div>
                          </li>
                        `
                      )}
                  </div>
                </div>
              `
              : html`
                <div>
                  <h2 class="mb-2 font-semibold text-white">Connect to a server</h2>
                  ${this.recentServers.list(1).size === 0 ? nothing : html`
                    <ul class="divide-y divide-zinc-950/30 rounded-xl bg-zinc-800 mb-6">
                      ${Array.from(this.recentServers.list(5)).map((s) =>
                        html`
                          <li
                            class="text-white relative flex justify-between gap-x-6 p-4 outline-2 outline-offset-2 outline-transparent transition-all duration-150 first:rounded-t-xl last:rounded-b-xl hover:bg-white/5 active:bg-white/10 has-focus-visible:-outline-offset-2 has-focus-visible:outline-blue-400/70 has-disabled:pointer-events-none has-disabled:text-neutral-400"
                          >
                            <button
                              ?disabled="${this.account?.status !==
                                AccountStatus.DISCONNECTED}"
                              @click="${(e: ClickEvent) => {
                                if (
                                  this.account === null ||
                                  this.account === undefined
                                ) {
                                  return;
                                }
                                const cancelEvent = new AbortController();
                                this.api.addEventListener("account", (e) => {
                                  if (
                                    e.detail.account?.uuid !== this.uuid ||
                                    e.detail.account?.status !==
                                      AccountStatus.ONLINE
                                  ) {
                                    return;
                                  }
                                  this.recentServers.using(s);
                                  cancelEvent.abort();
                                }, { signal: cancelEvent.signal });
                                this.api.connect(this.account, s);
                              }}"
                              class="text-sm/5 font-medium focus-visible:outline-none"
                            >
                              ${s}<span class="absolute inset-0"></span>
                            </button>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="size-5 fill-current"
                              viewBox="0 0 256 256"
                              aria-hidden="true"
                            >
                              <path
                                d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"
                              >
                              </path>
                            </svg>
                          </li>
                        `
                      )}
                    </ul>
                  `}
                  <form @submit="${(e: SubmitEvent) => {
                    e.preventDefault();
                    if (this.account === null || this.account === undefined) {
                      return;
                    }
                    const server = input.value?.value.toLowerCase().trim();
                    if (server === undefined || server.length === 0) {
                      return;
                    }
                    const cancelEvent = new AbortController();
                    this.api.addEventListener("account", (e) => {
                      if (
                        e.detail.account?.uuid !== this.uuid ||
                        e.detail.account?.status !== AccountStatus.ONLINE
                      ) {
                        return;
                      }
                      this.recentServers.using(server);
                      cancelEvent.abort();
                    }, { signal: cancelEvent.signal });
                    this.api.connect(this.account, server);
                  }}">
                    <div class="flex flex-col gap-3 sm:flex-row">
                      <input
                        ${ref(input)}
                        ?disabled="${this.account.status ===
                          AccountStatus.CONNECTING}"
                        class="w-full rounded-lg bg-white/10 px-3 py-1.5 text-white shadow-sm outline-2 outline-offset-1 outline-transparent transition-all focus:-outline-offset-1 focus:outline-blue-400/70 disabled:bg-white/5 disabled:text-zinc-400"
                        placeholder="Server address"
                        autofocus
                      />
                      <button
                        type="submit"
                        ?disabled="${this.account.status ===
                          AccountStatus.CONNECTING}"
                        type="submit"
                        class="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white outline-2 outline-offset-4 outline-transparent transition-all duration-150 hover:bg-blue-400 focus-visible:outline-offset-2 focus-visible:outline-blue-400/70 disabled:cursor-not-allowed disabled:brightness-50 disabled:hover:bg-blue-500"
                      >
                        ${this.account.status !== AccountStatus.CONNECTING
                          ? nothing
                          : html`
                            <svg
                              class="size-4 mr-2 text-zinc-100"
                              xmlns="http://www.w3.org/2000/svg"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="9.5"
                                fill="none"
                                stroke-linecap="round"
                                stroke-width="2"
                              >
                                <animateTransform
                                  attributeName="transform"
                                  dur="2s"
                                  from="0 12 12"
                                  repeatCount="indefinite"
                                  to="360 12 12"
                                  type="rotate"
                                />
                                <animate
                                  attributeName="stroke-dasharray"
                                  dur="1.5s"
                                  keyTimes="0;0.5;1"
                                  repeatCount="indefinite"
                                  values="0 150;42 150;42 150"
                                />
                                <animate
                                  attributeName="stroke-dashoffset"
                                  dur="1.5s"
                                  keyTimes="0;0.5;1"
                                  repeatCount="indefinite"
                                  values="0;-16;-59"
                                />
                              </circle>
                              <circle
                                cx="12"
                                cy="12"
                                r="9.5"
                                fill="none"
                                stroke-linecap="round"
                                stroke-width="2"
                                opacity=".1"
                              />
                            </svg>
                          `}Connect
                      </button>
                    </div>
                  </form>
                </div>
              `}
          </div>
        </div>
      `}
    `;
  }
}
