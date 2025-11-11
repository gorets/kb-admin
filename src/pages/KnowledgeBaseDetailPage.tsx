import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Paper,
  Chip,
} from '@mui/material'
import { useKnowledgeBase, useSearchKnowledgeBase, useQueryKnowledgeBase, useDeleteKnowledgeBase } from '../hooks/useKnowledgeBases'
import KnowledgeBaseDialog from '../components/KnowledgeBaseDialog'

type TabValue = 'ai-answer' | 'vector-search'

const KnowledgeBaseDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: knowledgeBase, isLoading } = useKnowledgeBase(id!)
  const searchMutation = useSearchKnowledgeBase()
  const queryMutation = useQueryKnowledgeBase()
  const deleteKnowledgeBaseMutation = useDeleteKnowledgeBase()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('ai-answer')

  // Form state
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(20)
  const [threshold, setThreshold] = useState(0.35)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [strategy, setStrategy] = useState<'HYBRID' | 'VECTOR' | 'BM25'>('HYBRID')

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!knowledgeBase) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          Knowledge Base not found
        </Typography>
      </Container>
    )
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this knowledge base?')) {
      try {
        await deleteKnowledgeBaseMutation.mutateAsync(id!)
        navigate('/knowledge-bases')
      } catch (error) {
        console.error('Error deleting knowledge base:', error)
      }
    }
  }

  const handleSubmitQuery = async () => {
    if (!query.trim()) return

    const params = {
      knowledgeBaseId: id!,
      query,
      topK,
      threshold,
      strategy,
    }

    if (activeTab === 'ai-answer') {
      await queryMutation.mutateAsync({
        ...params,
        maxTokens,
      })
    } else {
      await searchMutation.mutateAsync(params)
    }
  }

  const getResults = () => {
    if (activeTab === 'ai-answer' && queryMutation.data) {
      return queryMutation.data
    }
    if (activeTab === 'vector-search' && searchMutation.data) {
      return searchMutation.data
    }
    return null
  }

  const results = getResults()
  const isLoadingResults = activeTab === 'ai-answer' ? queryMutation.isPending : searchMutation.isPending

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">{knowledgeBase.name}</Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={() => setEditDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={deleteKnowledgeBaseMutation.isPending}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Knowledge Base Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Knowledge Base Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {knowledgeBase.description || 'No description'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Knowledge Base ID
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {knowledgeBase.id}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Data Sources
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {knowledgeBase.dataSources && knowledgeBase.dataSources.length > 0 ? (
                  knowledgeBase.dataSources.map((dsId) => (
                    <Chip key={dsId} label={dsId} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data sources
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Test Query Form */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Query
            </Typography>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="AI ANSWER" value="ai-answer" />
              <Tab label="VECTOR SEARCH" value="vector-search" />
            </Tabs>

            {/* Query Input */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ mb: 3 }}
            />

            {/* Parameters */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
              <TextField
                type="number"
                label="Top K"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
              />
              <TextField
                type="number"
                label="Threshold"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 1, step: 0.05 }}
              />
              {activeTab === 'ai-answer' && (
                <TextField
                  type="number"
                  label="Max Tokens"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  inputProps={{ min: 100, max: 4000 }}
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Search Strategy</InputLabel>
                <Select
                  value={strategy}
                  label="Search Strategy"
                  onChange={(e) => setStrategy(e.target.value as 'HYBRID' | 'VECTOR' | 'BM25')}
                >
                  <MenuItem value="HYBRID">HYBRID</MenuItem>
                  <MenuItem value="VECTOR">VECTOR</MenuItem>
                  <MenuItem value="BM25">BM25</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Submit Button */}
            <Button
              variant="contained"
              onClick={handleSubmitQuery}
              disabled={!query.trim() || isLoadingResults}
              fullWidth
            >
              {isLoadingResults ? <CircularProgress size={24} /> : 'Submit Query'}
            </Button>

            {/* Results */}
            {results && (
              <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Results
                </Typography>

                {activeTab === 'ai-answer' && 'answer' in results && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      AI Answer:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {results.answer}
                    </Typography>
                  </Box>
                )}

                {results.chunks && results.chunks.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Chunks ({results.chunks.length}):
                    </Typography>
                    {results.chunks.map((chunk: any, index: number) => (
                      <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'white' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Document: {chunk.documentId}
                          </Typography>
                          <Chip label={`Score: ${chunk.score?.toFixed(3)}`} size="small" />
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {chunk.content}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Edit Dialog */}
      {editDialogOpen && (
        <KnowledgeBaseDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          knowledgeBase={knowledgeBase}
        />
      )}
    </Container>
  )
}

export default KnowledgeBaseDetailPage
