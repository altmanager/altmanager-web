import { TextComponent } from "./TextComponent";

export interface KeybindTextComponent extends TextComponent {
  type: "keybind";
  keybind: string;
}
