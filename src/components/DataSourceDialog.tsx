import { useEffect, useMemo, useCallback } from 'react'
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
import { DataSourceType } from '@wildix/wim-knowledge-base-client'

interface DataSourceDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateDataSourceRequest) => void
  dataSource?: DataSource | null
  loading?: boolean
}

const dataSourceTypes = [
  { value: DataSourceType.CONFLUENCE, label: 'Confluence' },
  { value: DataSourceType.FILES, label: 'Files' },
  { value: DataSourceType.GDRIVE, label: 'Google Drive' },
  { value: DataSourceType.PROXY, label: 'Proxy' },
]

export default function DataSourceDialog({
  open,
  onClose,
  onSubmit,
  dataSource,
  loading = false,
}: DataSourceDialogProps) {
  const initialValues = useMemo<CreateDataSourceRequest>(() => ({
    name: '',
    description: '',
    type: DataSourceType.FILES,
    config: { files: { allowedExtensions: [] } },
    enabled: true,
    syncSchedule: undefined,
  }), [])

  const handleSubmitCallback = useCallback((data: CreateDataSourceRequest) => {
    onSubmit(data)
  }, [onSubmit])

  const { values, errors, handleChange, handleSubmit, reset, setValues } = useForm<CreateDataSourceRequest>(
    initialValues,
    handleSubmitCallback
  )

  useEffect(() => {
    if (!open) return
    
    if (dataSource) {
      setValues({
        name: dataSource.name,
        description: dataSource.description || '',
        type: dataSource.type || DataSourceType.FILES,
        config: dataSource.config || { files: { allowedExtensions: [] } },
        enabled: dataSource.enabled ?? true,
        syncSchedule: dataSource.syncSchedule,
      })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dataSource?.id])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {dataSource ? 'Edit Data Source' : 'Create Data Source'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              name="name"
              label="Name"
              value={values.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
              autoFocus
            />
            <TextField
              name="description"
              label="Description"
              value={values.description || ''}
              onChange={handleChange}
              multiline
              rows={3}
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
