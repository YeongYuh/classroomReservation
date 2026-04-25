export interface RevenueStats {
  totalRevenue: number
  platformFee: number
  teacherAmount: number
}

export interface TopTeacher {
  teacherId: string
  displayName: string
  reservationCount: number
}

export interface HeatmapCell {
  weekday: number // 0=Mon … 6=Sun
  hour: number    // 0-23
  count: number
}

type PaymentRow = { amount: number; platformFee: number; teacherAmount: number }
type TeacherRow = { teacherId: string; displayName: string }

const TOP_N = 5

export function buildRevenueStats(payments: PaymentRow[]): RevenueStats {
  return payments.reduce(
    (acc, p) => ({
      totalRevenue: acc.totalRevenue + p.amount,
      platformFee: acc.platformFee + p.platformFee,
      teacherAmount: acc.teacherAmount + p.teacherAmount,
    }),
    { totalRevenue: 0, platformFee: 0, teacherAmount: 0 },
  )
}

export function buildTopTeachers(rows: TeacherRow[]): TopTeacher[] {
  const map = new Map<string, TopTeacher>()
  for (const { teacherId, displayName } of rows) {
    const entry = map.get(teacherId)
    if (entry) {
      entry.reservationCount++
    } else {
      map.set(teacherId, { teacherId, displayName, reservationCount: 1 })
    }
  }
  return [...map.values()]
    .sort((a, b) => b.reservationCount - a.reservationCount)
    .slice(0, TOP_N)
}

export function buildHeatmap(startTimes: Date[]): HeatmapCell[] {
  // Grid indexed [weekday][hour], weekday: 0=Mon…6=Sun
  const grid: number[][] = Array.from({ length: 7 }, () => Array<number>(24).fill(0))

  for (const d of startTimes) {
    const jsDay = d.getDay() // 0=Sun…6=Sat
    const weekday = jsDay === 0 ? 6 : jsDay - 1 // shift so Mon=0, Sun=6
    grid[weekday][d.getHours()]++
  }

  const cells: HeatmapCell[] = []
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      cells.push({ weekday: w, hour: h, count: grid[w][h] })
    }
  }
  return cells
}
