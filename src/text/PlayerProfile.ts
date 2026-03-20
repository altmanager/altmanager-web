export interface PlayerProfile {
  name?: string;
  id?: number[];
  properties?: { name: "textures"; value: string; signature?: string }[];
  texture?: string;
  cape?: string;
  elytra?: string;
  model?: "wide" | "slim";
}
