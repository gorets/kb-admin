import { useEffect, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
  Divider,
} from '@mui/material'
import { useForm } from './useForm'
import type { KnowledgeBase, CreateKnowledgeBaseRequest } from '../types'
import { useDataSources } from '../hooks/useDataSources'

interface KnowledgeBaseDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateKnowledgeBaseRequest) => void
  knowledgeBase?: KnowledgeBase | null
  loading?: boolean
}

export default function KnowledgeBaseDialog({
  open,
  onClose,
  onSubmit,
  knowledgeBase,
  loading = false,
}: KnowledgeBaseDialogProps) {
  const { data: dataSources } = useDataSources()

  const initialValues = useMemo<CreateKnowledgeBaseRequest>(() => ({
    name: '',
    description: '',
    dataSources: [],
  }), [])

  const handleSubmitCallback = useCallback((data: CreateKnowledgeBaseRequest) => {
    onSubmit(data)
  }, [onSubmit])

  const { values, errors, handleChange, handleSubmit, reset, setValues } = useForm<CreateKnowledgeBaseRequest>(
    initialValues,
    handleSubmitCallback
  )

  useEffect(() => {
    if (!open) return
    
    if (knowledgeBase) {
      setValues({
        name: knowledgeBase.name,
        description: knowledgeBase.description || '',
        dataSources: knowledgeBase.dataSources || [],
      })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, knowledgeBase?.id])

  const handleDataSourceToggle = (dataSourceId: string) => {
    const currentDataSources = values.dataSources || []
    const isSelected = currentDataSources.includes(dataSourceId)
    
    setValues({
      ...values,
      dataSources: isSelected
        ? currentDataSources.filter((id) => id !== dataSourceId)
        : [...currentDataSources, dataSourceId],
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {knowledgeBase ? 'Edit Knowledge Base' : 'Create Knowledge Base'}
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
            
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              Data Sources
            </Typography>
            <FormGroup>
              {dataSources && dataSources.length > 0 ? (
                dataSources.map((ds) => (
                  <FormControlLabel
                    key={ds.id}
                    control={
                      <Checkbox
                        checked={(values.dataSources || []).includes(ds.id)}
                        onChange={() => handleDataSourceToggle(ds.id)}
                      />
                    }
                    label={ds.name}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data sources available
                </Typography>
              )}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {knowledgeBase ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
