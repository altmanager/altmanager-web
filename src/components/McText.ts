import { html, nothing, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { Component } from "./Component";
import { TextComponent } from "../text/TextComponent";
import { LiteralTextComponent } from "../text/LiteralTextComponent";
import { TranslatableTextComponent } from "../text/TranslatableTextComponent";
import { ScoreTextComponent } from "../text/ScoreTextComponent";
import { SelectorTextComponent } from "../text/SelectorTextComponent";
import { KeybindTextComponent } from "../text/KeybindTextComponent";
import { NbtTextComponent } from "../text/NbtTextComponent";
import { HoverAction } from "../text/HoverAction";
import { ClickAction } from "../text/ClickAction";
import { ClickEvent } from "../text/ClickEvent";
import { Item } from "../client/Item";

@customElement("mc-text")
export class McText extends Component {
  public static lang: Record<string, string> = {};
  private static readonly COLORS: Record<string, string> = {
    black: "text-black",
    dark_blue: "text-blue-700",
    dark_green: "text-green-700",
    dark_aqua: "text-cyan-700",
    dark_red: "text-red-700",
    dark_purple: "text-fuchsia-700",
    gold: "text-amber-500",
    gray: "text-zinc-400",
    dark_gray: "text-zinc-600",
    blue: "text-blue-500",
    green: "text-green-400",
    aqua: "text-cyan-400",
    red: "text-red-500",
    light_purple: "text-fuchsia-500",
    yellow: "text-yellow-300",
    white: "text-white",
  };
  private static idCounter = 0;

  @property({ type: String })
  public json: string = "";

  private static uuidToString(
    uuid: string | [number, number, number, number],
  ): string {
    const hex = typeof uuid === "string"
      ? uuid.replaceAll("-", "")
      : Array.from(
        new Uint8Array(
          uuid.flatMap((value) => [
            (value >>> 24) & 0xff,
            (value >>> 16) & 0xff,
            (value >>> 8) & 0xff,
            value & 0xff,
          ]),
        ),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join("-");
  }

  protected styleComponent(
    component: TextComponent,
  ): { styles?: Record<string, string>; classes?: string[] } {
    const styles: Record<string, string> = {};
    const classes: string[] = [];

    if (component.color) {
      if (component.color in McText.COLORS) {
        classes.push(McText.COLORS[component.color]);
      } else {
        styles["color"] = component.color;
      }
    }
    if (component.shadow_color !== undefined) {
      styles["text-shadow"] = `1px 1px 0 ${
        McText.resolveShadowColor(component.shadow_color)
      }`;
    }
    if (component.bold) {
      classes.push("font-bold");
    }
    if (component.italic) {
      classes.push("italic");
    }
    if (component.underlined) {
      classes.push("underline");
    }
    if (component.strikethrough) {
      classes.push("line-through");
    }
    if (component.obfuscated) {
      classes.push("bg-current");
    }

    return { styles, classes };
  }

  private tooltipHandlers(tooltipId: string) {
    return {
      mouseenter: () => {
        const tip = this.renderRoot.querySelector(`#${tooltipId}`);
        if (tip instanceof HTMLElement) tip.classList.remove("hidden");
      },
      mouseleave: () => {
        const tip = this.renderRoot.querySelector(`#${tooltipId}`);
        if (tip instanceof HTMLElement) tip.classList.add("hidden");
      },
      mousemove: (e: MouseEvent) => {
        const tip = this.renderRoot.querySelector(`#${tooltipId}`);
        if (tip instanceof HTMLElement) {
          const tooltipHeight = tip.offsetHeight;
          let top = e.clientY + 12;
          if (top < 0) {
            top = 0;
          }
          const maxTop = window.innerHeight - tooltipHeight;
          if (top > maxTop) {
            top = maxTop;
          }
          tip.style.left = `${e.clientX + 12}px`;
          tip.style.top = `${top}px`;
        }
      },
    };
  }

  public override render() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.json);
    } catch {
      return nothing;
    }

    const component = McText.parse(parsed);
    const { styles = {}, classes = [] } = this.styleComponent(component);
    const hasHover = component.hover_event !== undefined;
    const tooltipId = hasHover ? `mc-hover-${++McText.idCounter}` : nothing;
    const clickEvent = component.click_event;
    if (clickEvent) {
      classes.push("cursor-pointer");
    }

    const handlers = hasHover
      ? this.tooltipHandlers(tooltipId as string)
      : null;

    const inner = html`
      ${this.resolveContent(component)}${component.extra?.map((child) =>
        html`
          <mc-text json="${JSON.stringify(child)}"></mc-text>
        `
      )}${hasHover
        ? html`
          <div
            id="${tooltipId as string}"
            role="tooltip"
            class="fixed hidden rounded-md text-white bg-zinc-950/80 backdrop-blur px-2 py-1 ring ring-inset ring-white/5 shadow"
          >
            ${this.renderHover(component)}
          </div>
        `
        : nothing}
    `;

    if (clickEvent?.action === ClickAction.OPEN_URL) {
      return html`
        <a
          href="${clickEvent.url}"
          target="_blank"
          rel="noopener noreferrer"
          style="${styleMap(styles)}"
          class="${classes.join(" ") ?? nothing}"
          aria-describedby="${hasHover ? tooltipId : nothing}"
          @mouseenter="${handlers?.mouseenter ?? nothing}"
          @mouseleave="${handlers?.mouseleave ?? nothing}"
          @mousemove="${handlers?.mousemove ?? nothing}"
        >${inner}</a>
      `;
    }

    return html`
      <span
        style="${styleMap(styles)}"
        class="${classes.join(" ") ?? nothing}"
        aria-describedby="${hasHover ? tooltipId : nothing}"
        @click="${clickEvent
          ? () => McText.handleClick(this, clickEvent)
          : nothing}"
        @mouseenter="${handlers?.mouseenter ?? nothing}"
        @mouseleave="${handlers?.mouseleave ?? nothing}"
        @mousemove="${handlers?.mousemove ?? nothing}"
      >${inner}</span>
    `;
  }

  private renderHover(
    component: TextComponent,
  ): TemplateResult | typeof nothing {
    const hoverEvent = component.hover_event!;
    if (hoverEvent.action === HoverAction.SHOW_TEXT) {
      return html`
        <mc-text json="${JSON.stringify(hoverEvent.value)}"></mc-text>
      `;
    }
    if (hoverEvent.action === HoverAction.SHOW_ITEM) {
      return html`
        <mc-text json="${JSON.stringify(
          new Item(hoverEvent.id, hoverEvent.count, hoverEvent.components)
            .tooltip(),
        )}"></mc-text></p>
      `;
    }
    if (hoverEvent.action === HoverAction.SHOW_ENTITY) {
      return hoverEvent.name
        ? html`
          <mc-text json="${JSON.stringify({
            text: "",
            extra: [
              hoverEvent.name,
              "\n",
              {
                text: McText.uuidToString(hoverEvent.uuid),
                color: "dark_gray",
              },
            ],
          })}"></mc-text>
        `
        : html`
          ${hoverEvent.id}
        `;
    }
    return nothing;
  }

  private resolveContent(component: TextComponent): TemplateResult | string {
    if ("text" in component) {
      if (component.font !== undefined && component.font !== "minecraft:default") {
        return "";
      }
      return McText.renderText((component as LiteralTextComponent).text);
    }
    if ("translate" in component) {
      return this.resolveTranslate(component as TranslatableTextComponent);
    }
    if ("score" in component) {
      const c = component as ScoreTextComponent;
      return McText.renderText(`${c.score.name}:${c.score.objective}`);
    }
    if ("selector" in component) {
      return McText.renderText((component as SelectorTextComponent).selector);
    }
    if ("keybind" in component) {
      return McText.renderText((component as KeybindTextComponent).keybind);
    }
    if ("nbt" in component) {
      return McText.renderText((component as NbtTextComponent).nbt);
    }
    return "";
  }

  private resolveTranslate(
    component: TranslatableTextComponent,
  ): TemplateResult {
    const template = McText.lang[component.translate] ?? component.fallback ??
      component.translate;
    const parts = template.split(/(%s|%\d+\$s)/g);
    let argIndex = 0;

    return html`
      ${parts.map((part) => {
        if (part === "%s") {
          const arg = component.with?.[argIndex++];
          return arg !== undefined
            ? html`
              <mc-text json="${JSON.stringify(arg)}"></mc-text>
            `
            : nothing;
        }
        if (/^%\d+\$s$/.test(part)) {
          const index = parseInt(part.slice(1)) - 1;
          const arg = component.with?.[index];
          return arg !== undefined
            ? html`
              <mc-text json="${JSON.stringify(arg)}"></mc-text>
            `
            : nothing;
        }
        return McText.renderText(part);
      })}
    `;
  }

  private static renderText(text: string): TemplateResult {
    const lines = text
      .replaceAll("\uFFFD", "")
      .split("\n");
    return html`
      ${lines.map((line, i) =>
        html`
          ${line}${i < lines.length - 1
            ? html`
              <br>
            `
            : nothing}
        `
      )}
    `;
  }

  private static parse(raw: unknown): TextComponent {
    if (typeof raw === "string") {
      return { text: raw } as LiteralTextComponent;
    }
    if (Array.isArray(raw)) {
      return { extra: raw as TextComponent[] } as LiteralTextComponent;
    }
    return raw as TextComponent;
  }

  private static resolveShadowColor(
    color: number | [number, number, number, number],
  ): string {
    if (!Array.isArray(color)) {
      return McText.resolveShadowColor([
        (color >>> 16) & 0xff,
        (color >>> 8) & 0xff,
        color & 0xff,
        ((color >>> 24) & 0xff) / 255,
      ]);
    }
    const [r, g, b, a] = color;
    return `rgba(${r},${g},${b},${a})`;
  }

  private static handleClick(el: McText, clickEvent: ClickEvent): void {
    if (clickEvent.action === ClickAction.COPY_TO_CLIPBOARD) {
      navigator.clipboard.writeText(clickEvent.value).then();
      return;
    }
    el.dispatchEvent(
      new CustomEvent("mc-click", {
        bubbles: true,
        composed: true,
        detail: clickEvent,
      }),
    );
  }
}
