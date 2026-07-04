import type { ComplaintCategory } from '../types/complaint'

export const subCategoriesByCategory: Record<ComplaintCategory, string[]> = {
  water: ['no_supply', 'low_pressure', 'contamination', 'pipeline_leak'],
  roads: ['pothole', 'footpath_damage', 'road_surface', 'traffic_signal'],
  drainage: ['blocked_drain', 'standing_water', 'sewage_overflow', 'open_manhole'],
  electricity: ['power_outage', 'street_light', 'unsafe_wiring', 'transformer_issue'],
  health: ['mosquito_breeding', 'clinic_access', 'waste_hazard', 'stray_animals'],
  sanitation: ['garbage_collection', 'open_dumping', 'public_toilet', 'dead_animal'],
  other: ['general'],
}
