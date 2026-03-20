import { ClickEvent } from "./ClickEvent";
import { HoverEvent } from "./HoverEvent";

export interface TextComponent {
  color?: string;
  font?: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
  shadow_color?: number;
  insertion?: string;
  click_event?: ClickEvent;
  hover_event?: HoverEvent;
  extra?: TextComponent[];
}
