import { customElement } from "lit/decorators.js";
import { Component } from "./Component";
import { Account } from "../models/Account";
import { WsClient } from "../api/WsClient";
import { html, render } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { McText } from "./McText";

@customElement("player-console")
export class PlayerConsole extends Component {
  private readonly out = createRef<HTMLDivElement>();
  private readonly in = createRef<HTMLInputElement>();
  private readonly inputConsumer: (input: string) => unknown;

  public constructor(inputConsumer: (input: string) => unknown = () => {}) {
    super();
    this.inputConsumer = inputConsumer;
  }

  public override firstUpdated() {
    if (this.out.value === undefined || this.in.value === undefined) {
      throw new Error("Interface not available.");
    }
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
      line.textContent = `[${channel}] `;
    }
    line.append(mcText);
    out.prepend(line);
  }

  public override render() {
    return html`
      <div
        ${ref(this.out)}
        class="h-96 overflow-auto rounded-t-xl border border-b-0 border-white/10 bg-zinc-950 p-2 font-mono text-sm text-zinc-200 flex flex-col-reverse"
      >
      </div>
      <form @submit="${(e: SubmitEvent) => {
        e.preventDefault();
        if (this.in.value === undefined) {
          return;
        }
        this.inputConsumer(this.in.value.value.trim());
        this.in.value.value = "";
      }}">
        <input
          ${ref(this.in)}
          id="chat"
          class="w-full rounded-b-xl border border-white/10 bg-zinc-950 px-2 py-1 font-mono tracking-tight text-white ring-16 ring-transparent outline-2 outline-offset-2 outline-transparent transition-all ring-inset placeholder:text-zinc-500 focus:ring-white/3 focus:outline-offset-0 focus:outline-blue-400/70"
          placeholder="Type to chat or run commands"
        />
        <input type="submit" class="sr-only">
      </form>
    `;
  }
}
