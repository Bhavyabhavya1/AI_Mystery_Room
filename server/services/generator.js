import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

const counts = { easy: [3, 5, 2], medium: [4, 7, 3], hard: [5, 9, 3] }
const generatedSchema = z.object({
  title: z.string().min(3), story: z.string().min(40),
  suspects: z.array(z.object({ id: z.string(), name: z.string(), description: z.string().min(10) })),
  clues: z.array(z.object({ id: z.string(), title: z.string(), content: z.string().min(12) })),
  hints: z.array(z.string().min(8)), culpritId: z.string(), solutionExplanation: z.string().min(20)
})

// A varied local generator keeps the game playable if Gemini isn't configured or reachable.
// Each template has its own culprit, motive, evidence chain, suspects, and progressive hints.
const localSuspectPool = [
  { id: 'a', name: 'Mina Rowe', description: 'The records keeper who signed the room’s closing log.', signature: 'blue-black archive ink' },
  { id: 'b', name: 'Dev Malik', description: 'The facilities lead who knows the building’s service routes.', signature: 'copper dust from his tool roll' },
  { id: 'c', name: 'Iris Bell', description: 'A visiting specialist who had temporary access to the secured room.', signature: 'a distinctive cedar hand cream' },
  { id: 'd', name: 'Noah Venn', description: 'The night attendant who was responsible for the final security check.', signature: 'fine gray fibers from his uniform cuff' },
  { id: 'e', name: 'Talia Chen', description: 'A researcher whose recent work depended on the object in the case.', signature: 'graphite from her annotated field notebook' },
  { id: 'f', name: 'Rafi Stone', description: 'A donor representative who requested a private visit after hours.', signature: 'green sealing wax from his correspondence' },
  { id: 'g', name: 'June Park', description: 'The collection conservator who handled the display during the week.', signature: 'a trace of archival cotton from her gloves' },
  { id: 'h', name: 'Owen Price', description: 'A courier who knew the timing of the building’s daily deliveries.', signature: 'red packing twine from his dispatch bag' },
  { id: 'i', name: 'Sera Quinn', description: 'The deputy director who approved access and controlled the incident reports.', signature: 'violet carbon ink from her office forms' },
  { id: 'j', name: 'Arun Wells', description: 'A technician who tested the room’s alarm and camera systems.', signature: 'black insulation tape from his repair kit' }
]
const localMotives = [
  'they planned to sell the missing object to settle a private debt',
  'the object disproved a claim they had made about their work',
  'they wanted to hide a mistake before the next inspection',
  'they hoped to keep the object out of a transfer they opposed',
  'they needed the object to support a false ownership claim'
]
const localFallback = (premise, difficulty) => {
  const [suspectCount, clueCount, hintCount] = counts[difficulty]
  const suspects = [...localSuspectPool].sort(() => Math.random() - 0.5).slice(0, suspectCount)
  const culprit = suspects[Math.floor(Math.random() * suspects.length)]
  const motive = localMotives[Math.floor(Math.random() * localMotives.length)]
  const caseNo = Math.floor(1000 + Math.random() * 9000)
  const evidence = [
    ['The closing register', `The entry register places ${culprit.name} back at the secured room after they claimed to have left for the night.`],
    ['A trace at the seal', `A trace of ${culprit.signature} was caught in the broken seal, linking ${culprit.name} to the point of entry.`],
    ['The timing discrepancy', `A witness remembers ${culprit.name} nearby when the interruption began, contradicting their stated timeline.`],
    ['A private note', `A note in ${culprit.name}’s work area explains the motive: ${motive}.`],
    ['The alarm sequence', `The alarm was briefly paused using the procedure taught only to staff who completed the latest security drill; ${culprit.name} attended it.`],
    ['A rehearsed explanation', `${culprit.name} described a detail inside the secured room that had not been shared with investigators.`],
    ['The service route', `A fresh mark leads from the secured room to the service exit. The access record shows ${culprit.name} used that route.`],
    ['A missing wrapper', `The material used to protect the missing object is absent from the supply cabinet assigned to ${culprit.name}.`],
    ['The amended report', `An incident report was edited before the loss was announced. The revision history records ${culprit.name} as its author.`]
  ].slice(0, clueCount).map(([title, content], index) => ({ id: `clue-${index + 1}`, title, content }))
  return {
    title: `Case File ${caseNo} · ${premise.trim().slice(0, 48)}`,
    story: `${premise.trim()}\n\nYour report brought the bureau to the scene. The reported item disappeared during a brief interruption, and the room was secured before anyone could leave. The people present gave conflicting accounts. Examine the timeline and physical traces to find who had both access and a reason to act.`,
    suspects, clues: evidence,
    hints: [`Start with the timeline around the moment the room was secured.`, `One trace ties a suspect to the point of entry; compare it with the suspect profiles.`, `The private note gives the motive. Match it with the access and timing evidence.`].slice(0, hintCount),
    culpritId: culprit.id,
    solutionExplanation: `${culprit.name} had access and a reason to take the reported item: ${motive}. The register and service-route record establish opportunity, while the trace at the seal and the private note connect ${culprit.name} to the theft.`,
    generationMode: 'local'
  }
}

export async function generateMystery(premise, difficulty) {
  if (!process.env.GEMINI_API_KEY) return localFallback(premise, difficulty)
  const [suspectCount, clueCount, hintCount] = counts[difficulty]
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 15000, retryOptions: { attempts: 1 } } })
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-3.8-flash', contents: `Create a fresh, fair, logically solvable detective mystery from this premise: ${premise}. Difficulty ${difficulty}. Return ONLY JSON with keys title, story, suspects, clues, hints, culpritId, solutionExplanation. Need exactly ${suspectCount} suspects (id,name,description), ${clueCount} clues (id,title,content), and ${hintCount} progressive hints. Invent a new scenario, people, culprit, and evidence for this premise; do not reuse a stock example. The culprit must have a valid suspect id, and the explanation must use multiple clues to establish motive and opportunity. Avoid graphic content.` })
      const raw = response.text?.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      if (!raw) throw new Error('Gemini returned an empty response')
      const data = generatedSchema.parse(JSON.parse(raw))
      if (data.suspects.length !== suspectCount || data.clues.length !== clueCount || data.hints.length !== hintCount || !data.suspects.some(s => s.id === data.culpritId)) throw new Error('Generated case did not meet difficulty requirements')
      return { ...data, generationMode: 'gemini' }
    } catch (error) {
      console.warn(`Gemini case generation failed (attempt ${attempt + 1}/2): ${error.name}${error.status ? ` HTTP ${error.status}` : ''}`)
      if (error.status >= 500 || error.name === 'TypeError' || error.name === 'AbortError') break
    }
  }
  return localFallback(premise, difficulty)
}

export { counts }
