/**
 * Chart color palettes for analytics visualizations.
 * 5 palettes x 20 colors each, designed for bar / line / pie charts.
 * Colors cycle when data points exceed 20.
 */

// ─── Palette 1: Moss Forest ──────────────────────────────────────────────────
// Earthy greens extended from the Moss Theme, accented with warm tones
const MOSS_FOREST = [
  '#7f956a', // moss green
  '#c2785c', // terracotta
  '#5b8f9b', // teal blue
  '#c9a84c', // amber gold
  '#8b6f9b', // muted purple
  '#d4856a', // coral orange
  '#4a7c59', // deep moss
  '#b5935f', // camel
  '#6b9ea8', // lake blue
  '#a3704d', // ochre
  '#9bb385', // sprout green
  '#7c6488', // wisteria
  '#d1a873', // honey
  '#5a7a6b', // pine green
  '#c47a7a', // brick red
  '#8aaa97', // sage
  '#b8896b', // cinnamon
  '#6e8b7a', // bamboo green
  '#a89262', // olive gold
  '#7a9baf', // slate blue
] as const

// ─── Palette 2: Ocean Breeze ─────────────────────────────────────────────────
// Blue-green dominant with warm coral accents
const OCEAN_BREEZE = [
  '#3d85c6', // ocean blue
  '#e06c5a', // coral red
  '#2ea898', // emerald
  '#f0a04b', // sunset orange
  '#7b68ae', // lavender
  '#49b6a8', // jade
  '#d4785a', // terracotta
  '#5a9bd5', // sky blue
  '#c9b458', // sand gold
  '#9b5d8a', // plum
  '#36877a', // deep teal
  '#e8946a', // peach
  '#6a7ec2', // indigo
  '#8cc47a', // green apple
  '#c96b8b', // rose
  '#4dacbd', // ice blue
  '#b88a4c', // bronze
  '#65a37e', // jade green
  '#d68c5e', // apricot
  '#5c84a8', // denim blue
] as const

// ─── Palette 3: Sunset Harvest ───────────────────────────────────────────────
// Warm tones dominant with cool accents for balance
const SUNSET_HARVEST = [
  '#d4713b', // pumpkin
  '#6a9b8a', // celadon
  '#c4564e', // persimmon red
  '#8ab5c2', // light blue
  '#b89a3d', // wheat gold
  '#7a6ea0', // iris purple
  '#d98c5c', // caramel
  '#5a8a72', // turquoise green
  '#c77878', // rose pink
  '#6b94b8', // steel blue
  '#e0a84a', // beeswax
  '#8c6e7a', // smoky purple
  '#a8c46a', // mustard green
  '#b46a5a', // red brick
  '#5aada0', // mint
  '#c2984a', // mango
  '#7882a8', // dusk blue
  '#d49a6a', // tangerine
  '#6aab7a', // bamboo green
  '#a86a78', // dried rose
] as const

// ─── Palette 4: Berry Garden ─────────────────────────────────────────────────
// Purple-red tones balanced with greens
const BERRY_GARDEN = [
  '#9b5a8a', // berry purple
  '#5aaa7a', // emerald
  '#c46a78', // raspberry
  '#6a98b8', // cornflower
  '#d4a04a', // marigold
  '#7a6aaf', // hyacinth
  '#8aba6a', // lime
  '#c47a9a', // peony pink
  '#4a9a8a', // peacock green
  '#b86a5a', // pomegranate
  '#6a88c4', // delphinium
  '#a8b45a', // olive green
  '#d48a78', // salmon pink
  '#5a8aaa', // cerulean
  '#aa8a5a', // roasted tea
  '#8a6aa0', // grape
  '#6ab88a', // mint green
  '#c48a5a', // maple syrup
  '#7a8ac2', // bellflower
  '#b8aa6a', // sesame gold
] as const

// ─── Palette 5: Mineral Stone ────────────────────────────────────────────────
// Low-saturation earth tones, calm and professional
const MINERAL_STONE = [
  '#6a8a8a', // azurite
  '#b87a5a', // hematite
  '#7a8ab0', // slate blue
  '#a09a5a', // brass
  '#8a6a7a', // purple clay
  '#5a9a7a', // turquoise
  '#c4946a', // sandstone
  '#6a7a9a', // grey blue
  '#9a8a6a', // pyrite
  '#7a8a6a', // olivine
  '#a87a7a', // ochre red
  '#6a9aaa', // aquamarine
  '#b8a47a', // amber
  '#7a6a8a', // amethyst
  '#8aaa7a', // jade
  '#aa7a6a', // red agate
  '#5a8a9a', // lapis lazuli
  '#a89a7a', // fossil
  '#6a8a7a', // tourmaline
  '#9a7a8a', // rose quartz
] as const

// ─── Exports ──────────────────────────────────────────────────────────────────

export const CHART_PALETTES = {
  mossForest: MOSS_FOREST,
  oceanBreeze: OCEAN_BREEZE,
  sunsetHarvest: SUNSET_HARVEST,
  berryGarden: BERRY_GARDEN,
  mineralStone: MINERAL_STONE,
} as const

export type PaletteName = keyof typeof CHART_PALETTES

/** Returns the color at `index` from the given palette, cycling if needed. */
export function getColor(palette: readonly string[], index: number): string {
  return palette[index % palette.length]!
}
