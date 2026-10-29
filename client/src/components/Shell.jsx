import { Link, NavLink } from 'react-router-dom'
import { ArrowUpRight, Fingerprint } from 'lucide-react'

export function Shell({ children }) { return <div className="app-shell"><header className="topbar"><Link to="/" className="brand"><span className="brand-mark"><Fingerprint size={21}/></span><span>AI MYSTERY ROOM<small>PRIVATE INVESTIGATION BUREAU</small></span></Link><nav aria-label="Main navigation"><NavLink to="/">Home</NavLink><NavLink to="/create">Open a Case <ArrowUpRight size={13}/></NavLink></nav><span className="bureau-status"><i/> BUREAU ONLINE</span></header>{children}<footer><span>AI MYSTERY ROOM <b>·</b> EST. AFTER DARK</span><span>EVERY SECRET LEAVES A TRACE.</span></footer></div> }

export function Eyebrow({ children }) { return <div className="eyebrow"><span/> {children}</div> }
export function Notice({ children, onClose }) { if (!children) return null; return <div className="notice" role="alert">{children}{onClose && <button onClick={onClose} aria-label="Dismiss message">×</button>}</div> }
export function LoadingPanel({ title='Reviewing the evidence', text='The case room is being prepared…' }) { return <div className="loading-panel" role="status"><div className="loading-seal"><Fingerprint size={28}/></div><span className="eyebrow">CASE IN PROGRESS</span><h2>{title}</h2><p>{text}</p><div className="loading-track"><i/></div></div> }
