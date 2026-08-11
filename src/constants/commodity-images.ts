/**
 * Catalogue of every PNG that ships under public/images/commodities/.
 * Used by the commodity image picker in product settings so the user
 * can select a built-in artwork and have its key persisted on the
 * commodity record (resolved at render time via resolveProductImage).
 *
 * If you add or remove a file under public/images/commodities/, update
 * this list to match — the unit test pins the count to keep them in
 * sync.
 */

export const COMMODITY_IMAGE_KEYS = [
  // ── Bento (rice plates) ──
  'beijing-sauce-pork-rice',
  'boneless-chicken-cutlet-rice',
  'braised-chicken-leg-rice',
  'braised-pork-belly-rice',
  'fish-fillet-rice',
  'fried-chicken-leg-rice',
  'garlic-pork-rice',
  'large-chicken-rice',
  'poached-chicken-leg-rice',
  'pork-ribs-rice',
  'shredded-chicken-rice',
  'small-chicken-rice',
  'sweet-sour-chicken-rice',
  'vegetable-rice',
  // ── Single dishes ──
  'beijing-sauce-pork',
  'boneless-chicken-cutlet',
  'braised-chicken-leg',
  'braised-pork-belly',
  'chicken-breast-salad',
  'fish-fillet',
  'fried-chicken-leg',
  'garlic-pork',
  'poached-chicken-leg',
  'pork-ribs',
  'shredded-chicken',
  'sweet-sour-chicken',
  'vegetable',
  // ── Sides / add-ons ──
  'add-egg',
  'add-egg-2',
  'add-vegetable',
  'add-vegetable-large',
  'steamed-rice',
  'steamed-rice-small',
  'white-fungus-soup',
  // ── Drinks ──
  'apple-juice',
  'bottled-water',
  'cola-zero',
  'fruit-vinegar-drink',
  'fruit-vinegar-drink-x3',
  'green-tea',
  'honey-milk',
  'lotte-yogurt',
  'vitalon',
  // ── Dumplings ──
  'chive-dumpling',
  'corn-dumpling',
  'healthy-dumpling',
  'scallop-dumpling',
  'signature-dumpling',
] as const

export type CommodityImageKey = (typeof COMMODITY_IMAGE_KEYS)[number]
