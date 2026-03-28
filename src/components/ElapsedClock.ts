import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Component } from "./Component";

@customElement("elapsed-clock")
export class ElapsedClock extends Component {
  @property({ type: Number })
  public readonly startTime: number;

  @state()
  private elapsedMs: number;

  private timerId?: ReturnType<typeof setTimeout>;

  public constructor(startTime: Date) {
    super();
    this.startTime = startTime.getTime();
    this.elapsedMs = Date.now() - this.startTime;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.tick();
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.timerId !== undefined) {
      clearTimeout(this.timerId);
    }
  }

  private tick() {
    const now = Date.now();
    const elapsed = now - this.startTime;

    if (Math.floor(elapsed / 1000) !== Math.floor(this.elapsedMs / 1000)) {
      this.elapsedMs = elapsed;
    }

    const msUntilNextSecond = 1000 - (now % 1000);

    this.timerId = window.setTimeout(() => this.tick(), msUntilNextSecond);
  }

  private static periodToString(ms: number): { human: string; iso: string } {
    const milliseconds = Math.abs(ms);

    const totalSeconds = Math.floor(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const human = hours > 0
      ? `${hours}:${minutes.toString().padStart(1, "0")}:${
        seconds.toString().padStart(2, "0")
      }`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;

    const iso = `PT${hours > 0 ? hours + "H" : ""}${
      minutes > 0 ? minutes + "M" : ""
    }${seconds}S`;

    return { human, iso };
  }

  render() {
    const { human, iso } = ElapsedClock.periodToString(this.elapsedMs);

    return html`
      <time datetime="${iso}">${human}</time>
    `;
  }
}
