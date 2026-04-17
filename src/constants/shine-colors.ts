/**
 * Shared shine color presets for ShineBorder components.
 * Single source of truth — used by modal.tsx, header-checkout, and all
 * components that render ShineBorder directly.
 */

export const SHINE_COLOR_PRESETS: Record<string, string[]> = {
  green: ['#a8c896', '#c8deb8', '#e4fad9'],
  purple: ['#c4a1e0', '#dcc4f0', '#e3d0f5'],
  red: ['#e39a9d', '#f4b6b7', '#f0c4c4'],
  blue: ['#6aa3d4', '#8bbde0', '#b5d4ee'],
  orange: ['#d4a76a', '#e0bf8a', '#edd5aa'],
  gray: ['#bbbbbb', '#cccccc', '#dddddd'],
  gold: ['#F4A900', '#F7C242', '#FADE82'],
  rainbow: ['#A07CFE', '#FE8FB5', '#FFBE7B'],
}

export type ShineColorPreset =
  | 'green'
  | 'purple'
  | 'red'
  | 'blue'
  | 'orange'
  | 'gray'
  | 'gold'
  | 'rainbow'
