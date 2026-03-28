import { html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createRef, ref } from "lit/directives/ref.js";
import { Component } from "./Component";
import { McText } from "./McText";
import { ClickEvent } from "../text/ClickEvent";
import { ClickAction } from "../text/ClickAction";

@customElement("player-console")
export class PlayerConsole extends Component {
  private readonly out = createRef<HTMLDivElement>();
  private readonly in = createRef<HTMLInputElement>();
  private readonly inputConsumer: (input: string) => unknown;
  private lifeCycle: AbortController | null = null;
  public readonly history: string[];
  private historyCurrent: string = "";
  private historyIndex: number = -1;

  @property({ type: Boolean })
  public disabled = false;

  public constructor(
    inputConsumer: (input: string) => unknown = () => {},
    history: string[] = [],
  ) {
    super();
    this.inputConsumer = inputConsumer;
    this.history = history;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.lifeCycle = new AbortController();

    document.addEventListener("keydown", (e) => {
      if (
        e.ctrlKey || e.metaKey || e.altKey ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
          document.activeElement?.tagName?.toUpperCase()!,
        ) || (document.activeElement as HTMLElement)?.isContentEditable ||
        e.key.length !== 1
      ) {
        return;
      }
      this.in.value?.focus();
    }, { signal: this.lifeCycle.signal });
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.lifeCycle?.abort();
  }

  public override firstUpdated() {
    if (this.out.value === undefined) {
      return;
    }

    this.out.value.addEventListener(
      "mc-click" as any,
      (e: CustomEvent<ClickEvent>) => {
        if (this.in.value === undefined) {
          return;
        }
        const click = e.detail;
        switch (click.action) {
          case ClickAction.SUGGEST_COMMAND: {
            this.in.value.value = click.command;
            this.in.value.focus();
            break;
          }
          case ClickAction.RUN_COMMAND: {
            this.inputConsumer(click.command);
            break;
          }
        }
      },
    );
  }

  public write(message: unknown, channel?: string) {
    if (this.out.value === undefined) {
      return;
    }
    const out = this.out.value;
    const mcText = new McText();
    mcText.json = JSON.stringify(message);
    const line = document.createElement("p");
    if (channel !== undefined) {
      const span = document.createElement("span");
      span.classList.add("text-zinc-400");
      span.textContent = `[${channel}] `;
      line.append(span);
    }
    line.append(mcText);
    out.prepend(line);
  }

  public override render() {
    return html`
      <div
        ${ref(this.out)}
        aria-live="polite"
        class="flex h-96 flex-col-reverse overflow-auto rounded-t-xl border border-b-0 border-white/10 bg-zinc-950 p-2 font-mono text-sm text-zinc-200"
      >
      </div>
      <form @submit="${(e: SubmitEvent) => {
        e.preventDefault();
        if (this.in.value === undefined) {
          return;
        }
        const message = this.in.value.value.trim();
        this.inputConsumer(message);
        const last = this.history.at(-1);
        if (last !== message) {
          this.history.push(message);
        }
        this.historyIndex = -1;
        this.in.value.value = "";
      }}">
        <input
          ${ref(this.in)}
          ?disabled="${this.disabled}"
          id="chat"
          class="w-full rounded-b-xl border border-white/10 bg-zinc-950 px-2 py-1 font-mono tracking-tight text-white ring-16 ring-transparent outline-2 outline-offset-2 outline-transparent transition-all ring-inset placeholder:text-zinc-500 focus:ring-white/3 focus:outline-offset-0 focus:outline-blue-400/70"
          placeholder="${this.disabled
            ? nothing
            : "Type to chat or run commands"}"
          @keydown="${(e: KeyboardEvent) => {
            const input = e.target as HTMLInputElement;
            switch (e.key) {
              case "ArrowUp": {
                if (this.historyIndex === -1) {
                  this.historyCurrent = input.value;
                }
                if (this.historyIndex >= this.history.length - 1) {
                  return;
                }
                e.preventDefault();
                ++this.historyIndex;
                input.value =
                  this.history[this.history.length - this.historyIndex - 1];
                break;
              }
              case "ArrowDown": {
                if (this.historyIndex <= -1) {
                  return;
                }
                e.preventDefault();
                --this.historyIndex;
                if (this.historyIndex === -1) {
                  input.value = this.historyCurrent;
                  return;
                }
                input.value =
                  this.history[this.history.length - this.historyIndex - 1];
                break;
              }
            }
          }}"
        />
        <input type="submit" class="sr-only">
      </form>
    `;
  }
}
