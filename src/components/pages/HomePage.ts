import { html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createRef, ref } from "lit/directives/ref.js";
import { Match } from "navigo";
import { Page } from "./Page";
import { Account } from "../../models/Account";
import { WsClient } from "../../api/WsClient";
import { Modal } from "../Modal";
import { AccountStatus } from "../../models/AccountStatus";

@customElement("home-page")
export class HomePage extends Page {
  private static readonly STATUSES: Record<
    AccountStatus,
    { label: string; style: string }
  > = {
    [AccountStatus.DISCONNECTED]: {
      label: "Offline",
      style: "bg-neutral-400",
    },
    [AccountStatus.CONNECTING]: {
      label: "Connecting",
      style: "bg-amber-500 ring-4 ring-amber-500/30 animate-pulse",
    },
    [AccountStatus.ONLINE]: {
      label: "Online",
      style: "bg-emerald-500 ring-4 ring-emerald-500/30",
    },
  };

  @property({ type: Array })
  public accounts: Account[] = [];

  private readonly api: WsClient;
  private readonly addAccountModal = new Modal("Sign in with Microsoft");

  public constructor(api: WsClient) {
    super("/");
    this.api = api;
  }

  public override async connectedCallback() {
    super.connectedCallback();

    this.api.addEventListener("accountList", (e) => {
      this.accounts = e.detail;
    });
    this.api.listAccounts().then();

    this.addAccountModal.addEventListener("toggle", async (e) => {
      if (e.newState !== "open") {
        return;
      }

      const primary = createRef<HTMLButtonElement>();

      this.addAccountModal.body = html`
        <div class="flex justify-center p-4">
          <svg
            class="size-12 text-white"
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
        </div>
      `;
      this.addAccountModal.footer = [
        html`
          <button
            ${ref(primary)}
            type="button"
            class="inline-flex w-full justify-center rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white outline-2 outline-offset-4 outline-transparent transition-all duration-150 hover:bg-blue-400 focus-visible:outline-offset-2 focus-visible:outline-blue-400/70 disabled:hover:bg-blue-500 disabled:brightness-50 disabled:cursor-not-allowed"
            disabled
          >
            Copy and open
          </button>
        `,
        html`
          <button
            type="button"
            command="close"
            commandfor="${this.addAccountModal.modalId}"
            class="inline-flex w-full justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 outline-2 outline-offset-1 outline-transparent transition-all duration-150 hover:bg-white/20 focus-visible:-outline-offset-2 focus-visible:outline-blue-400/70"
          >
            Cancel
          </button>
        `,
      ];

      const auth = await this.api.addAccount();

      this.addAccountModal.body = html`
        <p class="text-sm text-zinc-400">
          Enter the code below at the Microsoft login page to sign in to your account.
        </p>
        <pre
          class="text-white text-2xl px-4 py-2 mt-2 bg-zinc-900 rounded-lg tracking-wide"
        ><code>${auth.userCode}</code></pre>
      `;

      primary.value!.disabled = false;
      primary.value!.addEventListener("click", async () => {
        await navigator.clipboard.writeText(auth.userCode);
        const url = new URL(auth.verificationUri);
        if (!url.searchParams.has("otc")) {
          url.searchParams.set("otc", auth.userCode);
        }
        window.open(url.href, "_blank");
      });
      this.api.addEventListener(
        "accountList",
        () => this.addAccountModal.close(),
        { once: true },
      );
    });
  }

  public override onOpen(match?: Match) {
    super.onOpen(match);
    document.title = "AltManager";
  }

  public override render() {
    return html`
      <div class="mx-auto max-w-2xl px-2 py-8">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="font-semibold text-white">Accounts</h2>
          <button
            command="show-modal"
            commandfor="${this.addAccountModal.modalId}"
            class="rounded-md p-2 text-white outline-2 outline-offset-1 outline-transparent transition-all duration-150 hover:bg-white/5 focus-visible:-outline-offset-2 focus-visible:outline-blue-400/70 active:bg-white/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-4 fill-current"
              viewBox="0 0 256 256"
              aria-hidden="true"
            >
              <path
                d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"
              >
              </path>
            </svg>
            <span class="sr-only">Add Account</span>
          </button>
        </div>
        <div class="rounded-xl bg-zinc-800">
          ${this.accounts.length === 0
            ? html`
              <div class="p-4">
                <p class="text-white">No accounts</p>
              </div>
            `
            : html`
              <ul role="list" class="divide-y divide-zinc-950/30">
                ${this.accounts.map((a) =>
                  html`
                    <li
                      class="group/account relative flex justify-between gap-x-6 px-6 py-5 outline-2 outline-offset-2 outline-transparent transition-all duration-150 first:rounded-t-xl last:rounded-b-xl hover:bg-white/5 active:bg-white/10 has-focus-visible:-outline-offset-2 has-focus-visible:outline-blue-400/70"
                    >
                      <div class="flex gap-x-4">
                        <img
                          class="size-12 flex-none bg-zinc-800 shadow-sm outline -outline-offset-1 outline-white/10 ${a
                              .status === AccountStatus.DISCONNECTED
                            ? "rounded-full grayscale-100 group-hover/account:grayscale-0 transition"
                            : "rounded-md"}"
                          src="https://mc-heads.net/avatar/${a.uuid}"
                          alt=""
                        />
                        <div class="min-w-0 flex-auto">
                          <a
                            href="/p/${a.uuid}"
                            class="text-sm/6 font-medium text-white focus-visible:outline-none"
                          >${a
                            .username}<span class="absolute inset-0"></span></a>
                          ${a.status === AccountStatus.DISCONNECTED
                            ? html`
                              <p class="text-xs text-neutral-400">Offline</p>
                            `
                            : nothing}
                          <div class="mt-1 ${a.status ===
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
                      <div class="flex items-center gap-6">
                        <div class="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                          ${a.lastServer === null ? nothing : html`
                            <p class="text-sm/6 text-white">${a.lastServer}</p>
                          `} ${a.status ===
                              AccountStatus.DISCONNECTED
                            ? nothing
                            : html`
                              <div class="mt-1 flex items-center gap-x-1.5">
                                <div
                                  class="size-1.5 rounded-full ${HomePage
                                    .STATUSES[a.status].style}"
                                >
                                </div>
                                <p class="text-xs/5 text-zinc-400">
                                  ${HomePage.STATUSES[a.status].label}
                                </p>
                              </div>
                            `}
                        </div>
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
                      </div>
                    </li>
                  `
                )}
              </ul>
            `}
        </div>
        ${this.addAccountModal}
      </div>
    `;
  }
}
