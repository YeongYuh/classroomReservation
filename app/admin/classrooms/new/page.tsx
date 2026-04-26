import { ClassroomForm } from '../classroom-form'
import { createClassroom } from '../actions'

export default function NewClassroomPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">新增教室</h1>
      <ClassroomForm action={createClassroom} />
    </div>
  )
}
