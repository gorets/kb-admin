import { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
} from '@mui/material'
import { useForm } from './useForm'
import type { DataSource, CreateDataSourceRequest } from '../types'
import { useKnowledgeBases } from '../hooks/useKnowledgeBases'

interface DataSourceDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateDataSourceRequest) => void
  dataSource?: DataSource | null
  loading?: boolean
}

const dataSourceTypes = [
  { value: 'file', label: 'File' },
  { value: 'url', label: 'URL' },
  { value: 'database', label: 'Database' },
  { value: 'api', label: 'API' },
]

export default function DataSourceDialog({
  open,
  onClose,
  onSubmit,
  dataSource,
  loading = false,
}: DataSourceDialogProps) {
  const { data: knowledgeBases } = useKnowledgeBases()

  const { values, errors, handleChange, handleSubmit, reset, setValues } = useForm<CreateDataSourceRequest>(
    {
      knowledgeBaseId: '',
      name: '',
      type: 'file',
    },
    (data) => {
      onSubmit(data)
    }
  )

  useEffect(() => {
    if (dataSource) {
      setValues({
        knowledgeBaseId: dataSource.knowledgeBaseId,
        name: dataSource.name,
        type: dataSource.type,
        config: dataSource.config,
      })
    } else {
      reset()
    }
  }, [dataSource, reset, setValues])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {dataSource ? 'Edit Data Source' : 'Create Data Source'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              name="knowledgeBaseId"
              label="Knowledge Base"
              value={values.knowledgeBaseId}
              onChange={handleChange}
              error={!!errors.knowledgeBaseId}
              helperText={errors.knowledgeBaseId}
              required
              fullWidth
            >
              {knowledgeBases?.map((kb) => (
                <MenuItem key={kb.id} value={kb.id}>
                  {kb.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="name"
              label="Name"
              value={values.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
            />
            <TextField
              select
              name="type"
              label="Type"
              value={values.type}
              onChange={handleChange}
              required
              fullWidth
            >
              {dataSourceTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {dataSource ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
