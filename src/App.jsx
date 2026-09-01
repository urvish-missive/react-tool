import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ContentAnalyzer from './pages/ContentAnalyzer'
import SEOAudit from './pages/SEOAudit'
import KeywordResearch from './pages/KeywordResearch'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/content-analyzer" element={<ContentAnalyzer />} />
          <Route path="/seo-audit" element={<SEOAudit />} />
          <Route path="/keyword-research" element={<KeywordResearch />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
