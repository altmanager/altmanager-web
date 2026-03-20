import { TextComponent } from "./TextComponent";
import { PlayerProfile } from "./PlayerProfile";

export type ObjectTextComponent =
  | (TextComponent & {
    type?: "object";
    object?: "atlas";
    atlas?: string;
    sprite: string;
  })
  | (TextComponent & {
    type?: "object";
    object: "player";
    player: PlayerProfile | string;
    hat?: boolean;
  });
