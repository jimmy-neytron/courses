import type { CourseStoreContext } from '@/stores/courses/context'
import type { BlockDraft, LessonBlock } from '@/types/course'
import { findBlock, findLesson } from '@/utils/course-lookup'
import { createIsoTimestamp } from '@/utils/date'

export async function createBlock(
  context: CourseStoreContext,
  lessonId: string,
  draft: BlockDraft,
): Promise<LessonBlock> {
  const location = findLesson(context.courses.value, lessonId)
  if (!location) throw new Error('Урок не найден')

  const block = await context.repository.createBlock(
    location.course.id,
    lessonId,
    draft,
    location.lesson.blocks.length,
  )
  location.lesson.blocks.push(block)
  touch(location)
  context.persist()
  return block
}

export async function updateBlock(
  context: CourseStoreContext,
  blockId: string,
  patch: Partial<LessonBlock>,
): Promise<void> {
  const location = findBlock(context.courses.value, blockId)
  if (!location) return

  await context.repository.updateBlock(blockId, patch)
  Object.assign(location.block, patch, { updatedAt: createIsoTimestamp() })
  touch(location)
  context.persist()
}

export async function deleteBlock(context: CourseStoreContext, blockId: string): Promise<void> {
  const location = findBlock(context.courses.value, blockId)
  if (!location) return

  await context.repository.deleteBlock(blockId)
  location.lesson.blocks = location.lesson.blocks.filter((block) => block.id !== blockId)
  await normalizeBlockPositions(context, location.lesson.blocks)
  touch(location)
  context.persist()
}

export async function moveBlock(
  context: CourseStoreContext,
  blockId: string,
  direction: -1 | 1,
): Promise<void> {
  const location = findBlock(context.courses.value, blockId)
  if (!location) return

  const blocks = location.lesson.blocks
  const index = blocks.findIndex((block) => block.id === blockId)
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || targetIndex >= blocks.length) return

  const [block] = blocks.splice(index, 1)
  if (!block) return
  blocks.splice(targetIndex, 0, block)

  await normalizeBlockPositions(context, blocks)
  touch(location)
  context.persist()
}

async function normalizeBlockPositions(
  context: CourseStoreContext,
  blocks: LessonBlock[],
): Promise<void> {
  await Promise.all(blocks.map(async (block, position) => {
    block.position = position
    await context.repository.updateBlock(block.id, { position })
  }))
}

function touch(location: { course: { updatedAt: string }; lesson: { updatedAt: string } }): void {
  const timestamp = createIsoTimestamp()
  location.lesson.updatedAt = timestamp
  location.course.updatedAt = timestamp
}
