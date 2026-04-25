export interface ReservationForDisplay {
  id: string
  courseId: string
  status: 'PENDING' | 'PAID' | 'ATTENDED' | 'CANCELLED'
  qrCode: string | null
  paidAt: Date | null
  hasReview: boolean
  course: {
    title: string
    location: string
    startAt: Date
    durationMin: number
    price: string
    teacher: { displayName: string; avatarUrl: string | null }
  }
}

export interface CategorizedReservations {
  upcoming: ReservationForDisplay[]
  history: ReservationForDisplay[]
}

export function categorizeReservations(
  reservations: ReservationForDisplay[],
  now: Date = new Date()
): CategorizedReservations {
  const upcoming: ReservationForDisplay[] = []
  const history: ReservationForDisplay[] = []

  for (const res of reservations) {
    if (res.status === 'PENDING') continue

    if (res.status === 'ATTENDED' || res.status === 'CANCELLED') {
      history.push(res)
    } else {
      // PAID — split by whether the course has started
      if (res.course.startAt > now) {
        upcoming.push(res)
      } else {
        history.push(res)
      }
    }
  }

  upcoming.sort((a, b) => a.course.startAt.getTime() - b.course.startAt.getTime())

  return { upcoming, history }
}
