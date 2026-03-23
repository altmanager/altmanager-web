import { TextComponent } from "./TextComponent";

export interface TranslatableTextComponent extends TextComponent {
  type?: "translatable";
  translate: string;
  fallback?: string;
  with?: TextComponent[];
}
