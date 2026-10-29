import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import caseRoutes from './routes/cases.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '20kb' }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'memory mode', geminiConfigured: Boolean(process.env.GEMINI_API_KEY) }))
app.use('/api/cases', caseRoutes)
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: { message: 'The case room encountered an error. Please try again.' } }) })

const port = Number(process.env.PORT) || 5000
if (process.env.MONGODB_URI) mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB unavailable; using memory mode:', err.message))
app.listen(port, () => console.log(`Mystery Room API listening on ${port}`))
