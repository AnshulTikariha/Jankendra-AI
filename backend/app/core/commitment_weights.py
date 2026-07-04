from datetime import date


def compute_commitment_weight(deadline: date, today: date | None = None) -> int:
    current_day = today or date.today()
    days_overdue = (current_day - deadline).days

    if days_overdue <= 0:
        return 1
    if days_overdue <= 3:
        return 2
    if days_overdue <= 7:
        return 3
    if days_overdue <= 14:
        return 5
    return 8


def days_overdue(deadline: date, today: date | None = None) -> int:
    current_day = today or date.today()
    overdue = (current_day - deadline).days
    return overdue if overdue > 0 else 0
