import { TextComponent } from "./TextComponent";

export interface SelectorTextComponent extends TextComponent {
  type: "selector";
  selector: string;
  separator?: TextComponent;
}
