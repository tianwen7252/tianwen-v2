/**
 * Shared types for product management sections.
 * Each section exposes a ref conforming to SectionRef,
 * enabling the parent to orchestrate saves across all sections.
 */

export interface ChangeSummaryItem {
  readonly type: 'label' | 'add' | 'edit' | 'delete' | 'reorder'
  readonly description: string
}

export interface SectionRef {
  save(): Promise<void>
  getChangeSummary(): readonly ChangeSummaryItem[]
}
