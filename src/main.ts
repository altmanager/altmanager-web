import "./style.css";
import { AppRoot } from "./components/AppRoot";
import { WsClient } from "./api/WsClient";
import { html, render } from "lit";
import { McText } from "./components/McText";
import { Item } from "./client/Item";

interface Env {
  ALTMANAGER_SERVER: string;
}

async function fetchEnv() {
  const defaultEnv: Env = {
    ALTMANAGER_SERVER: "http://localhost:14454",
  };
  try {
    const res = await fetch("/env.json");
    if (!res.ok) {
      return defaultEnv;
    }
    const env = await res.json();
    return {
      ALTMANAGER_SERVER: env?.ALTMANAGER_SERVER ?? defaultEnv.ALTMANAGER_SERVER,
    };
  } catch (e) {
    console.error("Failed to fetch env.json", e);
    return defaultEnv;
  }
}

const config = await fetchEnv();

function connectionError() {
  document.title = "Error Connecting";
  document.body.replaceChildren();
  render(
    html`
      <div class="mx-auto max-w-2xl px-2 py-8">
        <div
          class="flex gap-4 rounded-lg bg-red-400/15 p-4 outline outline-red-400/25"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-6 fill-red-400"
            viewBox="0 0 256 256"
          >
            <path
              d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z"
            >
            </path>
          </svg>
          <div>
            <h3 class="font-medium text-red-300">Failed to connect to backend</h3>
            <ul class="mt-2 list-disc pl-5 text-red-300/80">
              <li>
                Verify that backend is accessible at <code class="tracking-tight"
                >${config.ALTMANAGER_SERVER}</code>.
              </li>
              <li>
                If your backend server is on a different address or port, set it in
                the <code class="tracking-tight">ALTMANAGER_SERVER</code>
                environment variable.
              </li>
            </ul>
            <div class="mt-4">
              <button
                @click="${() => location.reload()}"
                type="button"
                class="rounded-lg bg-red-400/25 px-4 py-2 text-sm font-semibold text-red-100 outline-2 outline-offset-4 outline-transparent transition-all duration-150 hover:bg-red-400/30 hover:text-white focus-visible:outline-offset-2 focus-visible:outline-blue-400/70 disabled:cursor-not-allowed disabled:brightness-50 disabled:hover:bg-blue-500"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
    document.body,
  );
}

let api;
try {
  api = await WsClient.connect(config.ALTMANAGER_SERVER);
} catch (e) {
  connectionError();
  throw e;
}
api.addEventListener("offline", () => connectionError());
const root = new AppRoot(api);

const [lang, components] = await Promise.all([
  fetch(
    "https://assets.mcasset.cloud/1.21.11/assets/minecraft/lang/en_us.json",
  ).then((r) => r.json()),
  fetch(
    "https://raw.githubusercontent.com/misode/mcmeta/refs/tags/1.21.11-summary/item_components/data.json",
  ).then((r) => r.json()),
]);

McText.lang = lang;
Item.DEFAULT_COMPONENTS = components;

document.body.replaceChildren();
document.body.append(root);

if (!("command" in document.createElement("button"))) {
  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) {
      return;
    }

    const btn = e.target.closest<HTMLButtonElement>("button");

    if (btn === null) {
      return;
    }

    const command = btn.getAttribute("command");
    const commandFor = btn.getAttribute("commandfor");
    if (command === null || commandFor === null) {
      return;
    }

    const target = document.getElementById(commandFor);
    if (target === null) {
      return;
    }

    switch (command) {
      case "show-modal": {
        if (target instanceof HTMLDialogElement) {
          target.showModal();
        }
        break;
      }
      case "close": {
        if (target instanceof HTMLDialogElement) {
          target.returnValue = btn.value;
          target.close();
        }
        break;
      }
      case "show-popover": {
        if (target instanceof HTMLElement) {
          target.showPopover();
        }
        break;
      }
      case "hide-popover": {
        if (target instanceof HTMLElement) {
          target.hidePopover();
        }
        break;
      }
      case "toggle-popover": {
        if (target instanceof HTMLElement) {
          target.togglePopover();
        }
        break;
      }
      default: {
        if (!command.startsWith("--") || !("CommandEvent" in window)) {
          return;
        }

        const CommandEventClass = window.CommandEvent as {
          new (
            type: string,
            init?: {
              bubbles?: boolean;
              cancelable?: boolean;
              composed?: boolean;
              command?: string;
              source?: EventTarget | null;
            },
          ): Event & { command: string; source: EventTarget | null };
        };

        const event = new CommandEventClass("command", {
          bubbles: true,
          cancelable: true,
          composed: true,
          command: command,
          source: btn,
        });

        target.dispatchEvent(event);
        break;
      }
    }
  });
}
