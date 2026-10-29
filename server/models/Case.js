import mongoose from 'mongoose'

const caseSchema = new mongoose.Schema({
  title: { type: String, required: true }, premise: { type: String, required: true }, story: { type: String, required: true }, difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }, generationMode: { type: String, enum: ['gemini', 'local'], default: 'gemini' },
  suspects: [{ id: String, name: String, description: String }], clues: [{ id: String, title: String, content: String }], hints: [String], culpritId: String, solutionExplanation: String,
  discoveredClueIds: { type: [String], default: [] }, hintsUsed: { type: Number, default: 0 }, accusation: String,
  result: { correct: Boolean, culpritName: String, explanation: String, score: Number, basePoints: Number, cluePoints: Number, hintPenalty: Number, discoveredCount: Number, hintsUsed: Number }
}, { timestamps: true })

export default mongoose.model('Case', caseSchema)
