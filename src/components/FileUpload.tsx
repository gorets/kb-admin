import { useState, useCallback, useRef } from 'react'
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Paper,
} from '@mui/material'
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material'
import { useUploadFile } from '../hooks/useFileUpload'

interface FileUploadProps {
  dataSourceId: string
  onUploadSuccess?: () => void
  maxFiles?: number
  acceptedFormats?: string[]
}

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  documentId?: string
}

export default function FileUpload({
  dataSourceId,
  onUploadSuccess,
  maxFiles = 10,
  acceptedFormats = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'txt', 'md', 'html'],
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadFileMutation = useUploadFile()

  const acceptString = acceptedFormats.map((f) => `.${f}`).join(',')

  // Validate file
  const validateFile = (file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !acceptedFormats.includes(extension)) {
      return `File type "${extension}" is not supported. Allowed types: ${acceptedFormats.join(', ')}`
    }
    // Check file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      return 'File size exceeds 100MB limit'
    }
    return null
  }

  // Handle file selection
  const handleFiles = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return

      const fileArray = Array.from(selectedFiles)

      // Check max files limit
      if (files.length + fileArray.length > maxFiles) {
        setErrorMessage(`You can only upload up to ${maxFiles} files at once`)
        return
      }

      // Validate and add files
      const newFiles: FileWithProgress[] = []
      for (const file of fileArray) {
        const error = validateFile(file)
        if (error) {
          setErrorMessage(error)
          continue
        }
        newFiles.push({
          file,
          progress: 0,
          status: 'pending',
        })
      }

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles])
        setErrorMessage(null)
      }
    },
    [files.length, maxFiles, acceptedFormats]
  )

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // Upload single file
  const uploadFile = async (fileWithProgress: FileWithProgress, index: number) => {
    const { file } = fileWithProgress

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const } : f))
    )

    try {
      await uploadFileMutation.mutateAsync(
        {
          dataSourceId,
          file,
          onProgress: (progress: number) => {
            setFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, progress } : f))
            )
          },
        },
        {
          onSuccess: (result) => {
            setFiles((prev) =>
              prev.map((f, i) =>
                i === index
                  ? { ...f, status: 'success' as const, progress: 100, documentId: result.documentId }
                  : f
              )
            )
            console.log(`File "${file.name}" uploaded successfully`)
            if (onUploadSuccess) onUploadSuccess()
          },
          onError: (error: any) => {
            const errorMsg = error.message || 'Upload failed'
            setFiles((prev) =>
              prev.map((f, i) =>
                i === index
                  ? {
                      ...f,
                      status: 'error' as const,
                      error: errorMsg,
                    }
                  : f
              )
            )
            setErrorMessage(`Failed to upload "${file.name}": ${errorMsg}`)
          },
        }
      )
    } catch (error: any) {
      // Error already handled in onError callback
    }
  }

  // Upload all pending files
  const handleUploadAll = async () => {
    const pendingFiles = files
      .map((f, index) => ({ ...f, index }))
      .filter((f) => f.status === 'pending')

    for (const { index } of pendingFiles) {
      await uploadFile(files[index], index)
    }
  }

  // Remove file from list
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Clear all files
  const handleClearAll = () => {
    setFiles([])
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const uploadingCount = files.filter((f) => f.status === 'uploading').length
  const successCount = files.filter((f) => f.status === 'success').length
  const errorCount = files.filter((f) => f.status === 'error').length

  return (
    <Box>
      {/* Error Message */}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Drag & Drop Zone */}
      <Paper
        elevation={0}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptString}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag & Drop Files Here
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supported formats: {acceptedFormats.join(', ')} (max {maxFiles} files, 100MB
          each)
        </Typography>
      </Paper>

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Files ({files.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {pendingCount > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleUploadAll}
                  disabled={uploadingCount > 0 || uploadFileMutation.isPending}
                >
                  Upload All ({pendingCount})
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearAll}
                disabled={uploadingCount > 0}
              >
                Clear All
              </Button>
            </Box>
          </Box>

          {/* Status Summary */}
          {(successCount > 0 || errorCount > 0) && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {successCount > 0 && (
                <Alert severity="success" sx={{ flex: 1 }}>
                  {successCount} file{successCount > 1 ? 's' : ''} uploaded successfully
                </Alert>
              )}
              {errorCount > 0 && (
                <Alert severity="error" sx={{ flex: 1 }}>
                  {errorCount} file{errorCount > 1 ? 's' : ''} failed to upload
                </Alert>
              )}
            </Box>
          )}

          <List>
            {files.map((fileWithProgress, index) => (
              <ListItem
                key={index}
                sx={{
                  bgcolor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor:
                    fileWithProgress.status === 'success'
                      ? 'success.main'
                      : fileWithProgress.status === 'error'
                      ? 'error.main'
                      : fileWithProgress.status === 'uploading'
                      ? 'primary.main'
                      : 'divider',
                }}
              >
                <ListItemIcon>
                  <FileIcon />
                </ListItemIcon>
                <ListItemText
                  primary={fileWithProgress.file.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {(fileWithProgress.file.size / 1024 / 1024).toFixed(2)} MB
                        {fileWithProgress.status === 'success' && ' • Uploaded'}
                        {fileWithProgress.status === 'error' &&
                          ` • Error: ${fileWithProgress.error}`}
                        {fileWithProgress.status === 'uploading' &&
                          ` • Uploading: ${fileWithProgress.progress}%`}
                      </Typography>
                      {fileWithProgress.status === 'uploading' && (
                        <LinearProgress
                          variant="determinate"
                          value={fileWithProgress.progress}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveFile(index)}
                  disabled={fileWithProgress.status === 'uploading'}
                >
                  <CloseIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  )
}
