import { TextComponent } from "./TextComponent";

export interface LiteralTextComponent extends TextComponent {
  type?: "text";
  text: string;
}
