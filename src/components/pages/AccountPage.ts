import { customElement, state } from "lit/decorators.js";
import { Page } from "./Page";
import { html, nothing } from "lit";
import { Match } from "navigo";
import { Account } from "../../models/Account";
import { WsClient } from "../../api/WsClient";
import { AccountStatus } from "../../models/AccountStatus";
import { Modal } from "../Modal";
import { RecentServers } from "../../RecentServers";
import { createRef, ref } from "lit/directives/ref.js";
import { ClickEvent } from "../../text/ClickEvent";
import { PlayerConsole } from "../PlayerConsole";

@customElement("account-page")
export class AccountPage extends Page {
  private static readonly consoles = new Map<string, PlayerConsole>();

  @state()
  private account?: Account | null;

  private uuid?: string;

  private readonly api: WsClient;
  private readonly recentServers = RecentServers.load();
  private readonly connectModal = new Modal("Connect to a server");
  private console: PlayerConsole | null = null;

  public constructor(api: WsClient) {
    super("/p/:uuid");
    this.api = api;
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
      const console = new PlayerConsole((input) => {
        if (this.account === null || this.account === undefined) {
          return;
        }
        this.api.sendChat(this.account, input);
      }, JSON.parse(localStorage.getItem("consoleInputHistory") ?? "{}")[this.uuid!]);
      AccountPage.consoles.set(this.uuid, console);
      console.addEventListener("submit", (e) => {
        const history = JSON.parse(localStorage.getItem("consoleInputHistory") ?? "{}");
        history[this.uuid!] = console.history.slice(-100);
        localStorage.setItem("consoleInputHistory", JSON.stringify(history));
      });
    }
    this.console = AccountPage.consoles.get(this.uuid)!;
    this.console.disabled = true;
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

    this.connectModal.addEventListener("toggle", (e) => {
      if (e.newState !== "open") {
        return;
      }

      const recent = this.recentServers.list(10);
      const input = createRef<HTMLInputElement>();

      this.connectModal.body = html`
        <div class="mt-6">
          ${recent.size === 0 ? nothing : html`
            <ul class="divide-y divide-zinc-950/30 rounded-xl bg-white/10 mb-6">
              ${Array.from(recent).map((s) =>
                html`
                  <li
                    class="relative flex justify-between gap-x-6 p-4 outline-2 outline-offset-2 outline-transparent transition-all duration-150 first:rounded-t-xl last:rounded-b-xl hover:bg-white/5 active:bg-white/10 has-focus-visible:-outline-offset-2 has-focus-visible:outline-blue-400/70"
                  >
                    <button
                      @click="${(e: ClickEvent) => {
                        if (input.value === undefined) {
                          return;
                        }
                        input.value.value = s;
                        input.value.focus();
                        input.value.form?.requestSubmit();
                        this.connectModal.requestClose();
                      }}"
                      class="text-sm/5 font-medium text-white focus-visible:outline-none"
                    >
                      ${s}<span class="absolute inset-0"></span>
                    </button>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-5 fill-white"
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
            this.recentServers.using(server);
            this.api.connect(this.account, server);
          }}">
            <div class="flex flex-col gap-3 sm:flex-row">
              <input
                ${ref(input)}
                class="w-full rounded-lg bg-white/10 px-3 py-1.5 text-white shadow-sm outline-2 outline-offset-1 outline-transparent transition-all focus:-outline-offset-1 focus:outline-blue-400/70"
                placeholder="Server address"
                autofocus
              />
              <input
                type="submit"
                value="Connect"
                class="inline-flex justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white outline-2 outline-offset-4 outline-transparent transition-all duration-150 hover:bg-blue-400 focus-visible:outline-offset-2 focus-visible:outline-blue-400/70 disabled:cursor-not-allowed disabled:brightness-50 disabled:hover:bg-blue-500"
              />
            </div>
          </form>
        </div>
      `;
    });
  }

  public override render() {
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
        <div class="mx-auto flex max-w-2xl flex-col gap-6 px-2 py-8">
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
              ${this.account.status === AccountStatus.DISCONNECTED
                ? html`
                  <button
                    type="button"
                    class="inline-flex w-full justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white outline-2 outline-offset-4 outline-transparent transition-all duration-150 hover:bg-blue-400 focus-visible:outline-offset-2 focus-visible:outline-blue-400/70 disabled:cursor-not-allowed disabled:brightness-50 disabled:hover:bg-blue-500"
                    command="show-modal"
                    commandfor="${this.connectModal.modalId}"
                  >
                    Connect
                  </button>
                `
                : html`
                  <button
                    @click="${() => {
                      if (this.account === null || this.account === undefined) {
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
      `} ${this.connectModal}
    `;
  }
}
