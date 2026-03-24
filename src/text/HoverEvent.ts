import { HoverAction } from "./HoverAction";
import { TextComponent } from "./TextComponent";

export type HoverEvent =
  | { action: HoverAction.SHOW_TEXT; value: TextComponent }
  | {
    action: HoverAction.SHOW_ITEM;
    id: string;
    count?: number;
    components?: Record<string, unknown>;
  }
  | {
    action: HoverAction.SHOW_ENTITY;
    id: string;
    uuid: string | [number, number, number, number];
    name?: TextComponent;
  };
