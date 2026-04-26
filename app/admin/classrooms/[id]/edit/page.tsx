import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ClassroomForm } from '../../classroom-form'
import { updateClassroom } from '../../actions'

export default async function EditClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const classroom = await prisma.classroom.findUnique({ where: { id } })
  if (!classroom) notFound()

  const openHours = (() => {
    try { return JSON.parse(classroom.openHours) } catch { return [] }
  })()

  const action = updateClassroom.bind(null, id)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">編輯教室</h1>
      <ClassroomForm
        action={action}
        defaultValues={{
          name: classroom.name,
          capacity: classroom.capacity,
          location: classroom.location,
          openHours,
        }}
      />
    </div>
  )
}
