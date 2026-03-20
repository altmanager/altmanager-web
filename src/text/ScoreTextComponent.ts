import { TextComponent } from "./TextComponent";

export interface ScoreTextComponent extends TextComponent {
  type: "score";
  score: {
    name: string;
    objective: string;
  };
}
