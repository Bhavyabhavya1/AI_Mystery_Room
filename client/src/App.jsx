import { Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell.jsx'
import Home from './pages/Home.jsx'
import Create from './pages/Create.jsx'
import Investigation from './pages/Investigation.jsx'
import Accusation from './pages/Accusation.jsx'
import Result from './pages/Result.jsx'

function NotFound(){return <Shell><main className="center-page"><div className="loading-panel"><h2>This file is missing.</h2><p>Return to the bureau to open a new investigation.</p><a href="/" className="button button-primary">Back to the bureau</a></div></main></Shell>}
export default function App(){return <Routes><Route path="/" element={<Shell><Home/></Shell>}/><Route path="/create" element={<Shell><Create/></Shell>}/><Route path="/case/:id" element={<Investigation/>}/><Route path="/case/:id/accuse" element={<Accusation/>}/><Route path="/case/:id/result" element={<Result/>}/><Route path="*" element={<NotFound/>}/></Routes>}
