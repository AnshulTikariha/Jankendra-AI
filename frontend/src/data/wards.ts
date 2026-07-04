export type WardOption = {
  id: number
  name: string
}

/** Integer ids match insertion order in backend/scripts/seed_demo_data.py */
export const wardOptions: WardOption[] = [
  { id: 1, name: 'Ward 42' },
  { id: 2, name: 'Ward 43' },
  { id: 3, name: 'Ward 44' },
  { id: 4, name: 'Ward 45' },
  { id: 5, name: 'Ward 46' },
  { id: 6, name: 'Ward 47' },
]
