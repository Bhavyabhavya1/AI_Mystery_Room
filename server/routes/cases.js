import { Router } from 'express'
import { z } from 'zod'
import Case from '../models/Case.js'
import { counts, generateMystery } from '../services/generator.js'

const router = Router()
const memory = new Map()
const store = async data => {
  if (Case.db.readyState === 1) return (await Case.create(data)).toObject()
  const id = crypto.randomUUID(); const saved = { ...data, _id: id, discoveredClueIds: [], hintsUsed: 0 }; memory.set(id, saved); return saved
}
const get = async id => Case.db.readyState === 1 ? Case.findById(id).lean() : memory.get(id)
const save = async item => {
  if (Case.db.readyState !== 1) { memory.set(String(item._id), item); return item }
  const doc = await Case.findById(item._id)
  if (!doc) return null
  for (const key of ['discoveredClueIds', 'hintsUsed', 'accusation', 'result']) doc[key] = item[key]
  await doc.save()
  return doc.toObject()
}
const fail = (res, status, message) => res.status(status).json({ error: { message } })
const publicCase = item => ({ id: String(item._id), title: item.title, premise: item.premise, story: item.story, difficulty: item.difficulty, generationMode: item.generationMode || 'gemini',
  suspects: item.suspects, clues: item.clues.map(c => ({ id: c.id, title: c.title, discovered: item.discoveredClueIds.includes(c.id), ...(item.discoveredClueIds.includes(c.id) ? { content: c.content } : {}) })),
  usedHints: item.hints.slice(0, item.hintsUsed), progress: { discovered: item.discoveredClueIds.length, total: item.clues.length, hintsUsed: item.hintsUsed, hintsRemaining: Math.max(0, item.hints.length - item.hintsUsed) }, completed: Boolean(item.result) })

router.post('/', async (req, res, next) => {
  const parsed = z.object({ premise: z.string().trim().min(12).max(600), difficulty: z.enum(['easy', 'medium', 'hard']) }).safeParse(req.body)
  if (!parsed.success) return fail(res, 400, 'Enter a premise of 12–600 characters and select a difficulty.')
  try {
    const data = await generateMystery(parsed.data.premise, parsed.data.difficulty)
    const saved = await store({ ...data, premise: parsed.data.premise, difficulty: parsed.data.difficulty })
    res.status(201).json({ case: publicCase(saved) })
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res) => { const item = await get(req.params.id); if (!item) return fail(res, 404, 'Case not found.'); res.json({ case: publicCase(item) }) })
router.post('/:id/clues/:clueId/discover', async (req, res) => {
  const item = await get(req.params.id); if (!item) return fail(res, 404, 'Case not found.'); if (item.result) return fail(res, 409, 'This case is already closed.')
  const clue = item.clues.find(c => c.id === req.params.clueId); if (!clue) return fail(res, 404, 'Evidence not found.')
  if (!item.discoveredClueIds.includes(clue.id)) item.discoveredClueIds.push(clue.id)
  await save(item); res.json({ clue: { id: clue.id, title: clue.title, content: clue.content }, progress: publicCase(item).progress })
})
router.post('/:id/hints', async (req, res) => {
  const item = await get(req.params.id); if (!item) return fail(res, 404, 'Case not found.'); if (item.result) return fail(res, 409, 'This case is already closed.')
  if (item.hintsUsed >= item.hints.length) return fail(res, 409, 'No hints remain.')
  const hint = item.hints[item.hintsUsed++]; await save(item)
  res.json({ hint, hintsUsed: item.hintsUsed, hintsRemaining: item.hints.length - item.hintsUsed })
})
router.post('/:id/accuse', async (req, res) => {
  const parsed = z.object({ suspectId: z.string().min(1) }).safeParse(req.body); if (!parsed.success) return fail(res, 400, 'Select a suspect first.')
  const item = await get(req.params.id); if (!item) return fail(res, 404, 'Case not found.'); if (item.result) return fail(res, 409, 'This case is already closed.')
  const accused = item.suspects.find(s => s.id === parsed.data.suspectId); if (!accused) return fail(res, 400, 'That suspect is not part of this case.')
  const correct = accused.id === item.culpritId, basePoints = correct ? ({ easy: 100, medium: 150, hard: 200 })[item.difficulty] : 0
  const cluePoints = item.discoveredClueIds.length * 5, hintPenalty = item.hintsUsed * 10
  item.accusation = accused.id; item.result = { correct, culpritName: item.suspects.find(s => s.id === item.culpritId).name, explanation: item.solutionExplanation, score: Math.max(0, basePoints + cluePoints - hintPenalty), basePoints, cluePoints, hintPenalty, discoveredCount: item.discoveredClueIds.length, hintsUsed: item.hintsUsed }
  await save(item); res.json({ result: item.result })
})
router.get('/:id/result', async (req, res) => { const item = await get(req.params.id); if (!item) return fail(res, 404, 'Case not found.'); if (!item.result) return fail(res, 403, 'The result is available after you submit an accusation.'); res.json({ result: item.result }) })

export default router
