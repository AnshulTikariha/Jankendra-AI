import type { ApiComplaint } from '../api/types/complaints'
import { parseComplaintTitle } from './raiseComplaintFormat'
import type {
  CitizenComplaintStatus,
  Complaint,
  ComplaintCategory,
} from '../types/complaint'

const complaintCategories: ComplaintCategory[] = [
  'water',
  'roads',
  'drainage',
  'electricity',
  'health',
  'sanitation',
  'other',
]

function mapCategory(category: string): ComplaintCategory {
  const normalized = category.toLowerCase()
  return complaintCategories.includes(normalized as ComplaintCategory)
    ? (normalized as ComplaintCategory)
    : 'other'
}

function mapStatus(status: string): CitizenComplaintStatus {
  if (
    status === 'submitted' ||
    status === 'under_review' ||
    status === 'in_progress' ||
    status === 'resolved'
  ) {
    return status
  }
  return 'submitted'
}

export function mapComplaint(item: ApiComplaint): Complaint {
  const title = parseComplaintTitle(item.description)
  return {
    id: item.id,
    publicReference: item.public_reference,
    wardId: String(item.ward_id),
    wardName: item.ward_name,
    wardCode: item.ward_code ?? undefined,
    category: mapCategory(item.category),
    title,
    description: item.description,
    locationDetail: item.location_detail ?? undefined,
    status: mapStatus(item.status),
    clusterCount: item.cluster_count,
    source: item.source === 'staff' ? 'staff' : 'citizen',
    submittedAt: item.submitted_at,
    reporterPhone: item.reporter_phone ?? '',
    departmentSuggestion: item.department_suggestion ?? undefined,
  }
}
