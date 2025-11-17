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
  Link,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Paper,
  Chip,
} from '@mui/material'
import {
  useKnowledgeBase,
  useSearchKnowledgeBase,
  useQueryKnowledgeBase,
  useDeleteKnowledgeBase,
  useUpdateKnowledgeBase,
} from '../hooks/useKnowledgeBases'
import KnowledgeBaseDialog from '../components/KnowledgeBaseDialog'
import type { CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest } from '../types'

type TabValue = 'ai-answer' | 'vector-search'

type SourceEntry = {
  documentId?: string
  documentTitle?: string
  documentUrl?: string
  url?: string
  score?: number
  source?: string
  dataSourceType?: string
}

type QueryMetadata = {
  provider?: string
  model?: string
  cost?: number | string
  costCurrency?: string
  tokens?: {
    total?: number
    input?: number
    output?: number
  }
  retrievedChunks?: {
    count?: number
    tokens?: number
  }
  timing?: Record<string, number | undefined>
}

const normalizeResultItems = (data: unknown): unknown[] => {
  if (!data || typeof data !== 'object') {
    return []
  }

  if ('chunks' in data && Array.isArray((data as { chunks: unknown }).chunks)) {
    return (data as { chunks: unknown[] }).chunks
  }

  if ('documents' in data && Array.isArray((data as { documents: unknown }).documents)) {
    return (data as { documents: unknown[] }).documents
  }

  if ('results' in data && Array.isArray((data as { results: unknown }).results)) {
    return (data as { results: unknown[] }).results
  }

  return []
}

const extractAnswerText = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') {
    return null
  }

  console.log('data', data);

  if ('answer' in data) {
    const answerValue = (data as { answer?: unknown }).answer
    if (typeof answerValue === 'string') {
      return answerValue
    }
    if (answerValue && typeof answerValue === 'object') {
      const answerObject = answerValue as { text?: unknown; content?: unknown }
      if (typeof answerObject.text === 'string') {
        return answerObject.text
      }
      if (typeof answerObject.content === 'string') {
        return answerObject.content
      }
    }
  }

  if ('result' in data && typeof (data as { result?: unknown }).result === 'string') {
    return (data as { result: string }).result
  }

  return null
}

const extractSources = (data: unknown): SourceEntry[] => {
  if (!data || typeof data !== 'object') {
    return []
  }

  if ('sources' in data && Array.isArray((data as { sources?: unknown }).sources)) {
    return ((data as { sources: unknown[] }).sources as SourceEntry[]).filter(Boolean)
  }

  if ('metadata' in data && typeof (data as { metadata?: unknown }).metadata === 'object') {
    const metadata = (data as { metadata?: unknown }).metadata as { sources?: unknown }
    if (metadata && 'sources' in metadata && Array.isArray((metadata as { sources?: unknown }).sources)) {
      return ((metadata as { sources: unknown[] }).sources as SourceEntry[]).filter(Boolean)
    }
  }

  return []
}

const extractQueryMetadata = (data: unknown): QueryMetadata | null => {
  if (!data || typeof data !== 'object' || !('metadata' in data)) {
    return null
  }

  const rawMetadata = (data as { metadata?: unknown }).metadata
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return null
  }

  const meta = rawMetadata as Record<string, unknown>
  const timing = meta.timing && typeof meta.timing === 'object' ? (meta.timing as Record<string, unknown>) : undefined
  const tokens = meta.tokens && typeof meta.tokens === 'object' ? (meta.tokens as Record<string, unknown>) : undefined
  const retrievedChunks =
    meta.retrievedChunks && typeof meta.retrievedChunks === 'object'
      ? (meta.retrievedChunks as Record<string, unknown>)
      : undefined

  return {
    provider: typeof meta.provider === 'string' ? meta.provider : undefined,
    model: typeof meta.model === 'string' ? meta.model : undefined,
    cost: typeof meta.cost === 'number' || typeof meta.cost === 'string' ? meta.cost : undefined,
    costCurrency: typeof meta.costCurrency === 'string' ? meta.costCurrency : undefined,
    tokens: tokens
      ? {
          total: typeof tokens.total === 'number' ? tokens.total : undefined,
          input: typeof tokens.input === 'number' ? tokens.input : undefined,
          output: typeof tokens.output === 'number' ? tokens.output : undefined,
        }
      : undefined,
    retrievedChunks: retrievedChunks
      ? {
          count: typeof retrievedChunks.count === 'number' ? retrievedChunks.count : undefined,
          tokens: typeof retrievedChunks.tokens === 'number' ? retrievedChunks.tokens : undefined,
        }
      : undefined,
    timing: timing
      ? Object.entries(timing).reduce<Record<string, number | undefined>>((acc, [key, value]) => {
          acc[key] = typeof value === 'number' ? value : undefined
          return acc
        }, {})
      : undefined,
  }
}

const KnowledgeBaseDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: knowledgeBase, isLoading } = useKnowledgeBase(id!)
  const searchMutation = useSearchKnowledgeBase()
  const queryMutation = useQueryKnowledgeBase()
  const deleteKnowledgeBaseMutation = useDeleteKnowledgeBase()
  const updateKnowledgeBaseMutation = useUpdateKnowledgeBase()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('ai-answer')

  // Form state
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(10)
  const [threshold, setThreshold] = useState(0.5)
  const [maxOutputTokens, setMaxOutputTokens] = useState(1000)
  const [strategy, setStrategy] = useState<'hybrid' | 'vector' | 'bm25'>('hybrid')
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})

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

  const handleUpdateKnowledgeBase = async (data: CreateKnowledgeBaseRequest) => {
    if (!knowledgeBase) {
      return
    }

    try {
      const updatePayload: UpdateKnowledgeBaseRequest = {
        knowledgeBaseId: knowledgeBase.id,
        name: data.name,
        description: data.description,
        dataSources: data.dataSources,
      }

      await updateKnowledgeBaseMutation.mutateAsync({
        id: knowledgeBase.id,
        data: updatePayload,
      })
      setEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating knowledge base:', error)
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
        maxOutputTokens,
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

  const resultItems = normalizeResultItems(results)
  const isLoadingResults = activeTab === 'ai-answer' ? queryMutation.isPending : searchMutation.isPending

  const answerText = extractAnswerText(results)
  const sources = extractSources(results)
  const metadata = extractQueryMetadata(results)

  const hasSources = sources.length > 0

  const getItemKey = (chunk: { documentId?: string }, index: number) => {
    return (chunk.documentId && `${chunk.documentId}-${index}`) || `result-${index}`
  }

  const isExpanded = (key: string) => Boolean(expandedResults[key])

  const toggleExpanded = (key: string) => {
    setExpandedResults((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const renderContent = (contentValue?: string, expanded?: boolean) => {
    if (!contentValue) {
      return 'No preview available.'
    }

    const MAX_LENGTH = 400

    if (expanded || contentValue.length <= MAX_LENGTH) {
      return contentValue
    }

    return `${contentValue.slice(0, MAX_LENGTH).trim()}…`
  }

  const resolveChunkContent = (chunk: Record<string, unknown>) => {
    const candidates = ['content', 'pageContent', 'text', 'snippet', 'body', 'summary']
    for (const key of candidates) {
      const value = chunk[key]
      if (typeof value === 'string' && value.trim().length > 0) {
        return value
      }
    }
    return undefined
  }

  const formatCost = (value?: number | string, currency?: string) => {
    if (value === undefined || value === null) {
      return null
    }

    const numericValue = typeof value === 'string' ? Number(value) : value
    if (Number.isNaN(numericValue)) {
      return value.toString()
    }

    const formatted = numericValue >= 1 ? numericValue.toFixed(2) : numericValue.toPrecision(2)
    return `${formatted}${currency ? ` ${currency}` : ''}`
  }

  const formatTokenSummary = (tokenStats?: QueryMetadata['tokens']) => {
    if (!tokenStats) {
      return null
    }

    const parts: string[] = []
    if (typeof tokenStats.total === 'number') {
      parts.push(`Total ${tokenStats.total}`)
    }
    const ioParts: string[] = []
    if (typeof tokenStats.input === 'number') {
      ioParts.push(`input ${tokenStats.input}`)
    }
    if (typeof tokenStats.output === 'number') {
      ioParts.push(`output ${tokenStats.output}`)
    }
    if (ioParts.length > 0) {
      parts.push(`(${ioParts.join(' · ')})`)
    }

    return parts.join(' ')
  }

  const formatDuration = (ms?: number) => {
    if (typeof ms !== 'number' || Number.isNaN(ms)) {
      return null
    }

    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)} s`
    }

    return `${ms.toFixed(1)} ms`
  }

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
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {knowledgeBase.description || 'No description'}
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
                  label="Max Output Tokens"
                  value={maxOutputTokens}
                  onChange={(e) => setMaxOutputTokens(parseInt(e.target.value))}
                  inputProps={{ min: 100, max: 4000 }}
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Search Strategy</InputLabel>
                <Select
                  value={strategy}
                  label="Search Strategy"
                  onChange={(e) => setStrategy(e.target.value as 'hybrid' | 'vector' | 'bm25')}
                >
                  <MenuItem value="hybrid">HYBRID</MenuItem>
                  <MenuItem value="vector">VECTOR</MenuItem>
                  <MenuItem value="bm25">BM25</MenuItem>
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

                {activeTab === 'ai-answer' && answerText && (
                  <Box sx={{ mb: (hasSources || metadata) ? 2 : 0 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      AI Answer:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {answerText}
                    </Typography>
                  </Box>
                )}

                {activeTab === 'ai-answer' && (hasSources || metadata) && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {hasSources && (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Sources ({sources.length})
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                          {sources.map((source, index) => {
                            const sourceKey = source.documentId ?? `${source.documentTitle ?? 'source'}-${index}`
                            const label = source.documentTitle ?? source.documentId ?? 'Untitled source'
                            const url = source.documentUrl ?? (source as { url?: string }).url
                            const providerLabel = source.source ?? source.dataSourceType

                            return (
                              <Paper key={sourceKey} sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 0.75 }}>
                                  {url ? (
                                    <Link href={url} target="_blank" rel="noopener" variant="body2" sx={{ fontWeight: 500 }}>
                                      {label}
                                    </Link>
                                  ) : (
                                    <Typography variant="body2" fontWeight={500}>
                                      {label}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {typeof source.score === 'number' && (
                                      <Chip label={`Score: ${source.score.toFixed(3)}`} size="small" />
                                    )}
                                    {providerLabel && (
                                      <Chip label={providerLabel} size="small" color="default" variant="outlined" />
                                    )}
                                  </Box>
                                </Box>
                              </Paper>
                            )
                          })}
                        </Box>
                      </Paper>
                    )}

                    {metadata && (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Metadata
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 1 }}>
                          {(metadata.provider || metadata.model) && (
                            <Typography variant="body2">
                              {metadata.provider && `Provider: ${metadata.provider}`}
                              {metadata.provider && metadata.model && ' · '}
                              {metadata.model && `Model: ${metadata.model}`}
                            </Typography>
                          )}
                          {metadata.tokens && (
                            <Typography variant="body2">
                              Tokens: {formatTokenSummary(metadata.tokens)}
                            </Typography>
                          )}
                          {metadata.retrievedChunks && (metadata.retrievedChunks.count || metadata.retrievedChunks.tokens) && (
                            <Typography variant="body2">
                              Retrieved chunks: {metadata.retrievedChunks.count ?? '—'}
                              {typeof metadata.retrievedChunks.tokens === 'number' &&
                                ` (${metadata.retrievedChunks.tokens} tokens)`}
                            </Typography>
                          )}
                          {metadata.cost !== undefined && (
                            <Typography variant="body2">
                              Cost: {formatCost(metadata.cost, metadata.costCurrency) ?? 'n/a'}
                            </Typography>
                          )}
                          {metadata.timing && Object.keys(metadata.timing).length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2" gutterBottom>
                                Timing:
                              </Typography>
                              {Object.entries(metadata.timing)
                                .filter(([, value]) => typeof value === 'number')
                                .map(([stage, value]) => (
                                  <Typography key={stage} variant="caption" sx={{ display: 'block' }} color="text.secondary">
                                    {`${stage}: ${formatDuration(value as number) ?? 'n/a'}`}
                                  </Typography>
                                ))}
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}

                {resultItems.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Matches ({resultItems.length}):
                    </Typography>
                    {resultItems.map((item, index: number) => {
                      const chunk = item as Record<string, unknown>

                      const key = getItemKey(
                        { documentId: typeof chunk.documentId === 'string' ? chunk.documentId : undefined },
                        index,
                      )
                      const expanded = isExpanded(key)
                      const chunkContent = resolveChunkContent(chunk)
                      const documentTitle = typeof chunk.documentTitle === 'string' ? chunk.documentTitle : undefined
                      const displayLabel = documentTitle ?? (typeof chunk.documentId === 'string' ? chunk.documentId : '—')
                      const chunkScore =
                        typeof chunk.score === 'number'
                          ? chunk.score
                          : typeof chunk.similarity === 'number'
                            ? chunk.similarity
                            : undefined
                      const url =
                        typeof chunk.documentUrl === 'string'
                          ? chunk.documentUrl
                          : typeof chunk.url === 'string'
                            ? chunk.url
                            : undefined
                      const dataSource =
                        typeof chunk.source === 'string'
                          ? chunk.source
                          : typeof chunk.dataSourceType === 'string'
                            ? chunk.dataSourceType
                            : undefined
                      return (
                        <Paper key={key} sx={{ p: 2, mb: 2, bgcolor: 'white' }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Document: {displayLabel}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {chunkScore !== undefined && <Chip label={`Score: ${chunkScore.toFixed(3)}`} size="small" />}
                              {dataSource && <Chip label={dataSource} size="small" variant="outlined" />}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap'}}>
                              {renderContent(chunkContent, expanded)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 1, mt: 1 }}>
                            {url && (
                              <Link href={url} target="_blank" rel="noopener" variant="caption">
                                {url}
                              </Link>
                            )}
                            {chunkContent && chunkContent.length > 400 && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => toggleExpanded(key)}
                                sx={{ p: 0, mb: url ? 1 : 0, alignSelf: 'flex-start' }}
                              >
                                {expanded ? 'Show less' : 'Show more'}
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      )
                    })}
                  </Box>
                )}

                {resultItems.length === 0 && !answerText && (
                  <Typography variant="body2" color="text.secondary">
                    No matches found for the current query.
                  </Typography>
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
          onSubmit={handleUpdateKnowledgeBase}
          loading={updateKnowledgeBaseMutation.isPending}
        />
      )}
    </Container>
  )
}

export default KnowledgeBaseDetailPage
