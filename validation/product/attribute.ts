import { z } from "zod";

// Product-specific attribute schemas
export const TShirtAttributesSchema = z.object({
  sleeveType: z.enum(["long", "short", "3/4", "full", "none"]),
  collarType: z.enum(["round", "v-neck", "polo", "square", "none"]),
  fit: z.enum(["regular", "slim", "oversized"]),
  fabricWeight: z.enum(["light", "medium", "heavy", "very heavy"]).optional(),
  careInstructions: z.string().optional(),
  stretchability: z
    .enum([
      "non-stretch",
      "little-stretch",
      "medium-stretch",
      "very-stretch",
      "other",
    ])
    .optional(),
  pattern: z
    .enum([
      "solid",
      "striped",
      "printed",
      "logo-only",
      "back-printed-only",
      "front-printed-only",
      "other",
    ])
    .optional(),
});

// Pant attributes schema
export const PantAttributesSchema = z.object({
  waistType: z.enum(["low", "mid", "high", "others"]).optional(),
  stretchType: z.enum([
    "non-stretch",
    "little-stretch",
    "medium-stretch",
    "super-stretch",
    "other",
  ]),
  washType: z.enum(["dark-wash", "medium-wash", "distressed", "other"]),
  legStyle: z.enum([
    "skinny",
    "slim",
    "straight",
    "regular",
    "bootcut",
    "wide",
    "other",
  ]),
  pantType: z.enum(["full pant", "half pant", "low-pant", "3/4", "other"]),
  inseam: z.number().int().optional(),
  pocketTypes: z.array(z.enum(["front", "back", "coin"])),
});

// Shoe attributes schema
export const ShoeAttributesSchema = z.object({
  width: z.enum(["narrow", "medium", "wide"]).optional(),
  shoeType: z.enum([
    "sneakers",
    "boots",
    "sandals",
    "sport",
    "dress-shoes",
    "loafers",
    "flats",
    "ankle-boots",
    "ballet-flats",
    "slipper",
    "formal-shoes",
    "other",
  ]),
  closureType: z.enum([
    "laces",
    "velcro",
    "slip-on",
    "buckle",
    "zipper",
    "none",
  ]),
  outsole: z
    .enum(["rubber", "eva", "tup", "leather", "other", "none"])
    .optional(),
  insole: z.enum(["memory-foam", "ortholite", "other", "none"]).optional(),
  occasion: z.enum(["casual", "sports", "formal"])
});

// Shirt attributes schema
export const ShirtAttributesSchema = z.object({
  collarType: z.enum([
    "spread",
    "button-down",
    "mandarin",
    "wing",
    "club",
    "other",
    "none",
  ]),
  sleeveLength: z.enum(["short", "half", "long", "full", "none", "3/4"]),
  fit: z.enum(["slim", "regular", "relaxed", "oversized", "loose", "other"]),
  pocketStyle: z.enum(["chest", "no pockets"]),
  placketType: z.enum(["hidden", "buttoned"]),
  pattern: z.enum([
    "solid",
    "striped",
    "checked",
    "printed",
    "logo-only",
    "back-printed-only",
    "front-printed-only",
    "other",
  ]),
});

// Jacket attributes schema
export const JacketAttributesSchema = z.object({
  closureType: z.enum(["zipper", "buttons", "snap", "none"]),
  insulation: z.enum(["down", "synthetic", "fleece", "none"]).optional(),
  hooded: z.boolean(),
  pocketTypes: z.array(z.enum(["chest", "side", "interior"])),
  waterproof: z.boolean(),
  weightClass: z.enum(["light", "medium", "heavy", "very heavy"]).optional(),
});

// Hoodie attributes schema
export const HoodieAttributesSchema = z.object({
  fit: z.enum(["regular", "slim", "oversized"]),
  hoodType: z.enum(["fitted", "adjustable", "oversized"]).optional(),
  pocketStyle: z.enum(["kangaroo", "zippered", "split"]),
  fabricWeight: z.enum(["light", "medium", "heavy", "very heavy"]).optional(),
  sleeveStyle: z.enum(["raglan", "set-in", "other"]).optional(),
  drawstring: z.enum(["cotton", "nylon"]).optional(),
});

// Undergarment attributes schema
export const UndergarmentAttributesSchema = z.object({
  type: z.enum(["boxers", "briefs", "trunks", "thong", "bikini", "other"]),
  waistband: z.enum(["elastic", "ribbed", "covered-elastic", "drawstring"]),
  breathability: z.enum(["moisture-wicking", "cotton"]).optional(),
  supportLevel: z.enum(["light", "medium", "high"]).optional(),
  legLength: z.enum(["short", "medium", "long"]),
});

// Generic attributes schema
export const GenericAttributesSchema = z.object({
  attributes: z.record(z.string(), z.any()),
});

export const attributeSchemaMap = {
  "T-Shirt": TShirtAttributesSchema,
  Pant: PantAttributesSchema,
  Shoe: ShoeAttributesSchema,
  Shirt: ShirtAttributesSchema,
  Jacket: JacketAttributesSchema,
  // Hoodie: HoodieAttributesSchema,
  Undergarment: UndergarmentAttributesSchema,
  Generic: GenericAttributesSchema,
} as const;

export type CategoryName = keyof typeof attributeSchemaMap;
