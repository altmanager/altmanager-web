import { TextComponent } from "./TextComponent";

export interface NbtTextComponent extends TextComponent {
  type: "nbt";
  nbt: string;
  source: "block" | "entity" | "storage";
  interpret?: boolean;
  separator?: TextComponent;
  block?: string;
  entity?: string;
  storage?: string;
}
