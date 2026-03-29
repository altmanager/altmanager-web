import { customElement, property } from "lit/decorators.js";
import { html, nothing } from "lit";
import { Component } from "./Component";

@customElement("player-health")
export class PlayerHealth extends Component {
  private static readonly MAX_HEALTH = 20;
  private static readonly MIN_HEALTH = 0;
  private static readonly BAR_SIZE = 10;
  private static readonly BAR_HEALTH = PlayerHealth.MAX_HEALTH /
    PlayerHealth.BAR_SIZE;

  @property({ type: Number })
  public health: number;

  public constructor(health: number) {
    super();
    this.health = Math.max(
      Math.min(PlayerHealth.MAX_HEALTH, Math.round(health)),
      PlayerHealth.MIN_HEALTH,
    );
  }

  public override render() {
    const full = Math.floor(this.health / PlayerHealth.BAR_HEALTH);
    const half =
      this.health % PlayerHealth.BAR_HEALTH >= (PlayerHealth.BAR_HEALTH / 2);
    const empty = PlayerHealth.BAR_SIZE - full - (half ? 1 : 0);

    return html`
      <div class="flex" aria-label="health: ${this.health}">
        ${new Array(full).fill(html`
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
        `)}${half
          ? html`
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
          `
          : nothing}${new Array(empty).fill(html`
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
          `)}
      </div>
    `;
  }
}
