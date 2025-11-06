import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import Layout from './components/Layout'
import KnowledgeBasesPage from './pages/KnowledgeBasesPage'
import DataSourcesPage from './pages/DataSourcesPage'
import DocumentsPage from './pages/DocumentsPage'

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/knowledge-bases" replace />} />
            <Route path="/knowledge-bases" element={<KnowledgeBasesPage />} />
            <Route path="/data-sources" element={<DataSourcesPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
          </Routes>
        </Layout>
      </Box>
    </Router>
  )
}

export default App
