import { PrismaClient, Role, CourseStatus } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbUrl = `file://${path.join(process.cwd(), 'prisma', 'dev.db')}`
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

const TEST_PASSWORD_HASH = await bcrypt.hash('Test1234!', 10)

async function main() {
  console.warn('🌱 Seeding database...')

  // Clean existing data (order matters for FK constraints)
  await prisma.payment.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.review.deleteMany()
  await prisma.message.deleteMany()
  await prisma.commission.deleteMany()
  await prisma.course.deleteMany()
  await prisma.teacherProfile.deleteMany()
  await prisma.advertisement.deleteMany()
  await prisma.user.deleteMany()

  // Admin
  const admin = await prisma.user.create({
    data: { id: 'admin-001', email: 'admin@platform.com', role: Role.ADMIN, passwordHash: TEST_PASSWORD_HASH },
  })

  // Teacher 1 — verified, active
  const teacher1User = await prisma.user.create({
    data: { id: 'teacher-001', email: 'chloe@yoga.com', role: Role.TEACHER, passwordHash: TEST_PASSWORD_HASH },
  })
  const teacher1 = await prisma.teacherProfile.create({
    data: {
      userId: teacher1User.id,
      displayName: 'Chloe 老師',
      bio: '十年有氧教學經驗，擅長 Zumba 與高強度有氧。',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chloe',
      certUrls: JSON.stringify(['https://example.com/cert1.pdf']),
      youtubeUrl: 'https://youtube.com/watch?v=example1',
      isVerified: true,
      isHidden: false,
    },
  })
  await prisma.commission.create({
    data: { teacherId: teacher1.id, plan: 'PERCENTAGE', rate: 0.15 },
  })

  // Teacher 2 — pending review
  const teacher2User = await prisma.user.create({
    data: { id: 'teacher-002', email: 'max@aerobics.com', role: Role.TEACHER, passwordHash: TEST_PASSWORD_HASH },
  })
  await prisma.teacherProfile.create({
    data: {
      userId: teacher2User.id,
      displayName: 'Max 教練',
      bio: '專業體能訓練師，HIIT 課程設計師。',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=max',
      isVerified: false,
      isHidden: false,
    },
  })

  // Student
  const student = await prisma.user.create({
    data: { id: 'student-001', email: 'alice@example.com', role: Role.STUDENT, passwordHash: TEST_PASSWORD_HASH },
  })

  // Courses (under verified teacher only)
  const now = new Date()

  const course1 = await prisma.course.create({
    data: {
      teacherId: teacher1.id,
      title: 'Zumba 派對舞蹈',
      tags: JSON.stringify(['Zumba', '有氧']),
      description: '跟著節奏動起來！適合所有程度。',
      location: '台北市信義區運動中心 B1',
      startAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      durationMin: 60,
      maxSlots: 20,
      price: 800,
      status: CourseStatus.ACTIVE,
    },
  })

  const course2 = await prisma.course.create({
    data: {
      teacherId: teacher1.id,
      title: '高強度有氧燃脂班',
      tags: JSON.stringify(['HIIT', '高強度有氧', '燃脂']),
      description: '30 分鐘燃燒全身脂肪，科學訓練方法。',
      location: '台北市大安區健身工廠',
      startAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      durationMin: 30,
      maxSlots: 15,
      price: 600,
      status: CourseStatus.ACTIVE,
    },
  })

  await prisma.course.create({
    data: {
      teacherId: teacher1.id,
      title: '空中瑜珈入門',
      tags: JSON.stringify(['空中瑜珈', '瑜珈']),
      description: '利用吊床進行伸展，釋放脊椎壓力。',
      location: '台北市中山區空中瑜珈教室',
      startAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      durationMin: 75,
      maxSlots: 10,
      price: 1200,
      status: CourseStatus.ACTIVE,
    },
  })

  // Paid reservation + payment (course1)
  const reservation = await prisma.reservation.create({
    data: {
      courseId: course1.id,
      userId: student.id,
      status: 'PAID',
      qrCode: 'qr-test-alice-course1',
      paidAt: new Date(),
    },
  })

  await prisma.payment.create({
    data: {
      reservationId: reservation.id,
      method: 'LINEPAY',
      amount: 800,
      platformFee: 120,
      teacherAmount: 680,
      txnId: 'sandbox-txn-001',
      status: 'COMPLETED',
    },
  })

  // Review on course2
  await prisma.review.create({
    data: { courseId: course2.id, userId: student.id, rating: 5, comment: '老師教得很好！' },
  })

  // Advertisement
  await prisma.advertisement.create({
    data: {
      slot: 'HOMEPAGE_BANNER',
      imageUrl: 'https://picsum.photos/seed/aerobics/1200/400',
      linkUrl: '/courses',
      startAt: new Date(),
      endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  })

  console.warn(`✅ Seeded:
  - 1 admin (${admin.email})
  - 2 teachers (1 verified, 1 pending)
  - 1 student (${student.email})
  - 3 courses
  - 1 paid reservation + payment
  - 1 review
  - 1 advertisement`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
