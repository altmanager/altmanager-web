import { LiteralTextComponent } from "../text/LiteralTextComponent";
import { TextComponent } from "../text/TextComponent";
import { TranslatableTextComponent } from "../text/TranslatableTextComponent";

interface Components {
  "minecraft:rarity": "common" | "uncommon" | "rare" | "epic";
  "minecraft:custom_name": LiteralTextComponent;
  "minecraft:item_name": LiteralTextComponent;
  "minecraft:stored_enchantments": Record<string, number>;
  "minecraft:enchantments": Record<string, number>;
  "minecraft:dyed_color": number | [number, number, number];
  "minecraft:lore": LiteralTextComponent[];
  "minecraft:attribute_modifiers": {
    id: string;
    type: keyof typeof Item["ATTRIBUTE_BENEFIT"];
    slot?:
      | "any"
      | "hand"
      | "armor"
      | "mainhand"
      | "offhand"
      | "head"
      | "head"
      | "chest"
      | "legs"
      | "feet"
      | "body"
      | "saddle";
    operation: "add_value" | "add_multiplied_base" | "add_multiplied_total";
    amount: number;
    display?: {
      type: "default" | "hidden";
    } | {
      type: "override";
      value: LiteralTextComponent;
    };
  }[];
  "minecraft:unbreakable": {};
  "minecraft:damage": number;
  "minecraft:max_damage": number;
}

export class Item {
  /** @internal */
  public static DEFAULT_COMPONENTS: Record<string, Partial<Components>>;
  private static readonly ENCHANT_ORDER = [
    "minecraft:curse_of_binding",
    "minecraft:curse_of_vanishing",
    "minecraft:riptide",
    "minecraft:channeling",
    "minecraft:wind_burst",
    "minecraft:frost_walker",
    "minecraft:sharpness",
    "minecraft:smite",
    "minecraft:bane_of_arthropods",
    "minecraft:impaling",
    "minecraft:power",
    "minecraft:density",
    "minecraft:breach",
    "minecraft:piercing",
    "minecraft:sweeping_edge",
    "minecraft:multishot",
    "minecraft:fire_aspect",
    "minecraft:flame",
    "minecraft:knockback",
    "minecraft:punch",
    "minecraft:protection",
    "minecraft:blast_protection",
    "minecraft:fire_protection",
    "minecraft:projectile_protection",
    "minecraft:feather_falling",
    "minecraft:fortune",
    "minecraft:looting",
    "minecraft:silk_touch",
    "minecraft:luck_of_the_sea",
    "minecraft:efficiency",
    "minecraft:quick_charge",
    "minecraft:lure",
    "minecraft:respiration",
    "minecraft:aqua_affinity",
    "minecraft:soul_speed",
    "minecraft:swift_sneak",
    "minecraft:depth_strider",
    "minecraft:thorns",
    "minecraft:loyalty",
    "minecraft:unbreaking",
    "minecraft:infinity",
    "minecraft:mending",
  ];
  private static readonly SLOT_ORDER = [
    "any",
    "mainhand",
    "offhand",
    "hand",
    "feet",
    "legs",
    "chest",
    "head",
    "body",
    "armor",
    "saddle",
  ] as const;
  private static readonly ATTRIBUTE_BENEFIT = {
    armor: 1,
    armor_toughness: 1,
    attack_damage: 1,
    attack_knockback: 1,
    attack_speed: 1,
    block_break_speed: 1,
    block_interaction_range: 1,
    burning_time: -1,
    camera_distance: 1,
    entity_interaction_range: 1,
    explosion_knockback_resistance: 1,
    fall_damage_multiplier: -1,
    flying_speed: 1,
    follow_range: 1,
    gravity: 0,
    jump_strength: 1,
    knockback_resistance: 1,
    luck: 1,
    max_absorption: 1,
    max_health: 1,
    mining_efficiency: 1,
    movement_efficiency: 1,
    movement_speed: 1,
    oxygen_bonus: 1,
    safe_fall_distance: 1,
    scale: 0,
    spawn_reinforcements: 1,
    sneaking_speed: 1,
    step_height: 1,
    submerged_mining_speed: 1,
    sweeping_damage_ratio: 1,
    tempt_range: 1,
    water_movement_efficiency: 1,
    waypoint_receive_range: 0,
    waypoint_transmit_range: 0,
  };
  private static readonly DEFAULT_NAMESPACE = "minecraft:";

  public readonly id: string;
  public readonly count: number;
  public readonly components: Partial<Components>;

  public constructor(
    id: string,
    count: number = 1,
    components: Partial<Components> = {},
  ) {
    const defaults = Item
      .DEFAULT_COMPONENTS[
        id.startsWith(Item.DEFAULT_NAMESPACE)
          ? id.slice(Item.DEFAULT_NAMESPACE.length)
          : id
      ];
    if (defaults === undefined) {
      throw new Error(`Unknown item ${id}`);
    }
    this.id = id;
    this.count = count;
    this.components = Item.mergeComponents(defaults, components);
  }

  private static mergeComponents(
    defaults: Partial<Components>,
    custom: Partial<Components>,
  ): Partial<Components> {
    const merged = defaults;

    for (const [key, component] of Object.entries(custom)) {
      switch (key) {
        case "minecraft:lore":
          merged[key] = [
            ...(defaults[key] ?? []),
            ...(component as LiteralTextComponent[]),
          ];
          break;

        case "minecraft:enchantments":
        case "minecraft:custom_data":
          merged[key as keyof Components] = {
            ...(defaults[key as keyof Components] ?? {}),
            ...(component as object),
          } as any;
          break;

        default:
          merged[key as keyof Components] = component as any;
      }
    }

    return merged;
  }

  private static enchantmentsText(enchantments: Record<string, number>) {
    return Item.ENCHANT_ORDER
      .filter((id) => id in enchantments)
      .concat(
        Object.keys(enchantments).filter(
          (id) => !Item.ENCHANT_ORDER.includes(id),
        ),
      )
      .map((id) => {
        const level = enchantments[id];
        const base: TranslatableTextComponent = {
          color: "gray",
          translate: `enchantment.${id.replace(":", ".")}`,
        };
        return level === 1 ? base : {
          ...base,
          extra: [
            { text: " " },
            {
              translate: `enchantment.level.${level}`,
            } as TranslatableTextComponent,
          ],
        } as TextComponent;
      });
  }

  private static attributesText(
    attributes: Components["minecraft:attribute_modifiers"],
  ) {
    const lines: TextComponent[] = [];

    const bySlot: Record<string, Components["minecraft:attribute_modifiers"]> =
      {};

    for (const modifier of attributes) {
      const slot = modifier.slot ?? "any";
      (bySlot[slot] ??= []).push(modifier);
    }

    for (const slot of Item.SLOT_ORDER) {
      const modifiers = bySlot[slot];
      if (modifiers === undefined || modifiers.length === 0) {
        continue;
      }
      lines.push({ text: "" } as LiteralTextComponent);
      lines.push({
        translate: `item.modifiers.${slot}`,
        color: "gray",
      } as TranslatableTextComponent);
      for (const modifier of modifiers) {
        const id = modifier.type.startsWith(Item.DEFAULT_NAMESPACE)
          ? modifier.type.slice(Item.DEFAULT_NAMESPACE.length)
          : modifier.type;
        const benefit =
          Item.ATTRIBUTE_BENEFIT[id as keyof typeof Item.ATTRIBUTE_BENEFIT] + 1;
        const colors = ["red", "gray", "blue"];
        const color = modifier.amount > 0
          ? colors[benefit]
          : colors.toReversed()[benefit];
        const operationId = {
          add_value: 0,
          add_multiplied_base: 1,
          add_multiplied_total: 2,
        }[modifier.operation];
        lines.push({
          color,
          translate: `attribute.modifier.${
            modifier.amount > 0 ? "plus" : "take"
          }.${operationId}`,
          with: [
            {
              text: Math.abs(modifier.amount).toString(),
            } as LiteralTextComponent,
            {
              translate: `attribute.name.${id}`,
            } as TranslatableTextComponent,
          ],
        } as TranslatableTextComponent);
      }
    }

    return lines;
  }

  public get rarity() {
    return this.components["minecraft:rarity"] ?? "common";
  }

  public get hasEnchantments() {
    return Object.keys(
      this.components["minecraft:stored_enchantments"] ??
        this.components["minecraft:enchantments"] ?? {},
    ).length > 0;
  }

  public get dyed() {
    return this.components["minecraft:dyed_color"] !== undefined;
  }

  public get dyedColor() {
    if (!this.dyed) {
      return undefined;
    }

    const dyed = this.components["minecraft:dyed_color"];

    if (typeof dyed === "number") {
      return [
        (dyed >> 16) & 0xff,
        (dyed >> 8) & 0xff,
        dyed & 0xff,
      ] as const;
    }

    return dyed;
  }

  public get unbreakable() {
    return this.components["minecraft:unbreakable"] !== undefined;
  }

  public get durability() {
    if (
      this.unbreakable || this.components["minecraft:damage"] === undefined ||
      this.components["minecraft:max_damage"] === undefined ||
      this.components["minecraft:damage"] ===
        this.components["minecraft:max_damage"]
    ) {
      return undefined;
    }

    return [
      this.components["minecraft:max_damage"] -
      this.components["minecraft:damage"],
      this.components["minecraft:max_damage"],
    ] as const;
  }

  private get rarityColor() {
    if (this.hasEnchantments) {
      return this.rarity === "epic" ? "light_purple" : "aqua";
    }
    switch (this.rarity) {
      case "epic":
        return "light_purple";
      case "rare":
        return "aqua";
      case "uncommon":
        return "yellow";
      default:
        return "white";
    }
  }

  public tooltip(): LiteralTextComponent {
    const name: LiteralTextComponent =
      this.components["minecraft:custom_name"] !== undefined
        ? {
          italic: true,
          ...this.components["minecraft:custom_name"],
        }
        : {
          color: this.rarityColor,
          ...this.components["minecraft:item_name"]!,
        };

    const storedEnchantments = Item.enchantmentsText(
      this.components["minecraft:stored_enchantments"] ?? {},
    );
    const enchantments = Item.enchantmentsText(
      this.components["minecraft:enchantments"] ?? {},
    );

    const dyed: TextComponent[] = this.dyed
      ? [
        {
          translate: "item.dyed",
          color: "gray",
        } as TranslatableTextComponent,
        {
          text: "#" + this.dyedColor!.map((c) =>
            c.toString(16).toUpperCase().padStart(2, "0")
          ).join(""),
          color: "gray",
        } as LiteralTextComponent,
      ]
      : [];

    const lore: LiteralTextComponent[] =
      this.components["minecraft:lore"]?.map((line) => ({
        color: "dark_purple",
        italic: true,
        ...line,
      })) ?? [];

    const attributes = Item.attributesText(
      this.components["minecraft:attribute_modifiers"] ?? [],
    );

    const unbreakable = this.unbreakable
      ? [{
        translate: "item.unbreakable",
        color: "blue",
      } as TranslatableTextComponent]
      : [];

    const durability: TranslatableTextComponent[] =
      this.durability !== undefined
        ? [{
          translate: "item.durability",
          with: [{
            text: this.durability[0].toString(),
          } as LiteralTextComponent, {
            text: this.durability[1].toString(),
          }],
        }]
        : [];

    const id: LiteralTextComponent = {
      text: this.id,
      color: "dark_gray",
    };

    const components: TranslatableTextComponent = {
      translate: "item.components",
      color: "dark_gray",
      with: [
        {
          text: Object.keys(this.components).length.toString(),
        } as LiteralTextComponent,
      ],
    };

    return {
      text: "",
      extra: [
        name,
        ...storedEnchantments,
        ...enchantments,
        ...dyed,
        ...lore,
        ...attributes,
        ...unbreakable,
        ...durability,
        id,
        components,
      ].flatMap((item, i) =>
        i === 0 ? [item] : [{ text: "\n" } as LiteralTextComponent, item]
      ),
    };
  }
}
