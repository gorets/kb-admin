import { useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Grid,
  Chip,
  Link,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { Document } from '../types'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

interface ChunkItem {
  id: string
  documentId: string
  content: string
  createdAt: string
  updatedAt: string
}

interface DocumentDetailsDrawerProps {
  open: boolean
  onClose: () => void
  document: Document | null
  content: string
  chunks: ChunkItem[]
  loading?: boolean
  error?: string | null
}

export default function DocumentDetailsDrawer({
  open,
  onClose,
  document,
  content,
  chunks,
  loading = false,
  error = null,
}: DocumentDetailsDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: '80%', maxWidth: 1200 }
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Document Details</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Content */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : document ? (
          <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>
            {/* Left Column - Original Document */}
            <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Paper sx={{ p: 2, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  Original Document
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {document.title}
                  </Typography>
                </Box>

                <Box display="flex" flexDirection="row" gap={2} style={{ justifyContent: 'space-between' }}>
                  {document.chunksCount && document.chunksCount > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Chunks Count
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ wordBreak: 'break-all' }}>
                        {document.chunksCount}
                      </Typography>
                    </Box>
                  )}

                  {document.processingDuration && document.processingDuration > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Processing Duration
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ wordBreak: 'break-all' }}>
                        {document.processingDuration}
                      </Typography>
                    </Box>
                  )}

                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip label={document.status} size="small" color="primary" sx={{ mt: 0.5 }} />
                  </Box>
                </Box>

                <Box display="flex" flexDirection="row" gap={2} style={{ justifyContent: 'space-between' }}>
                  {document.originalFormat && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Original Format
                      </Typography>
                      <Typography variant="body2">{document.originalFormat}</Typography>
                    </Box>
                  )}

                  {document.originalName && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Original Name
                      </Typography>
                      <Typography variant="body2">{document.originalName}</Typography>
                    </Box>
                  )}

                  {document.url && (
                    <Box mb={2}>
                      <Link variant="body2" color="primary" href={document.url} target="_blank" rel="noopener noreferrer">
                            <OpenInNewIcon fontSize="small"  style={{ marginTop: '5px' }}/>
                      </Link>
                    </Box>
                  )}
                </Box>


                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Content
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor: 'grey.50',
                      maxHeight: 400,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Typography variant="body2">
                      {content || 'No content available'}
                    </Typography>
                  </Paper>
                </Box>

                <Box mt="auto" pt={2}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created: {new Date(document.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Updated: {new Date(document.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Right Column - Chunks */}
            <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Paper sx={{ p: 2, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Chunks
                  </Typography>
                  <Chip label={`${chunks.length} chunks`} size="small" color="secondary" />
                </Box>
                <Divider sx={{ mb: 2 }} />

                {chunks.length > 0 ? (
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {chunks.map((chunk, index) => (
                      <Paper
                        key={chunk.id}
                        variant="outlined"
                        sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle2" color="primary">
                            Chunk #{index + 1}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {chunk.id}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            mb: 1
                          }}
                        >
                          {chunk.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Created: {new Date(chunk.createdAt).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Updated: {new Date(chunk.updatedAt).toLocaleString()}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">No chunks available for this document</Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">No document selected</Alert>
        )}
      </Box>
    </Drawer>
  )
}
