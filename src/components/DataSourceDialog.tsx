import { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  Typography,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { useForm } from './useForm'
import type { DataSource, CreateDataSourceRequest } from '../types'
import { DataSourceType } from '@wildix/wim-knowledge-base-client'
import FilesDataSourceForm from './data-source-forms/FilesDataSourceForm'
import ConfluenceSteppedForm from './data-source-forms/ConfluenceSteppedForm'
import GDriveSteppedForm from './data-source-forms/GDriveSteppedForm'
import ProxyDataSourceForm from './data-source-forms/ProxyDataSourceForm'

interface DataSourceDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateDataSourceRequest) => void
  dataSource?: DataSource | null
  loading?: boolean
  preselectedType?: DataSourceType
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
  preselectedType,
}: DataSourceDialogProps) {
  const initialValues = useMemo<CreateDataSourceRequest>(() => ({
    name: '',
    description: '',
    type: preselectedType || DataSourceType.CONFLUENCE,
    config: { confluence: { baseUrl: '', username: '', apiKey: '', spaceId: '', pages: { enabled: [], disabled: [] } } },
    enabled: true,
    syncSchedule: undefined,
  }), [preselectedType])

  const handleSubmitCallback = useCallback((data: CreateDataSourceRequest) => {
    onSubmit(data)
  }, [onSubmit])

  const [config, setConfig] = useState<any>(dataSource?.config || {})
  const confluenceFinalizeRef = useRef<(() => Promise<void>) | undefined>()
  const gdriveFinalizeRef = useRef<(() => Promise<void>) | undefined>()

  const { values, errors, handleChange, handleSubmit, reset, setValues } = useForm<CreateDataSourceRequest>(
    initialValues,
    useCallback((data: CreateDataSourceRequest) => {
      handleSubmitCallback({ ...data, config })
    }, [handleSubmitCallback, config])
  )

  useEffect(() => {
    if (!open) return

    if (dataSource) {
      setValues({
        name: dataSource.name,
        description: dataSource.description || '',
        type: dataSource.type || DataSourceType.FILES,
        config: dataSource.config || { confluence: { baseUrl: '', username: '', apiKey: '', spaceId: '', pages: { enabled: [], disabled: [] } } },
        enabled: dataSource.enabled ?? true,
        syncSchedule: dataSource.syncSchedule,
      })
      setConfig(dataSource.config || {})
    } else {
      reset()
      setConfig({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dataSource?.id])

  // Reset config when type changes (for new data sources only)
  useEffect(() => {
    if (!dataSource && open) {
      switch (values.type) {
        case DataSourceType.FILES:
          setConfig({ files: { allowedExtensions: [] } })
          break
        case DataSourceType.CONFLUENCE:
          setConfig({
            confluence: {
              baseUrl: '',
              username: '',
              apiKey: '',
              spaceId: '',
              pages: { enabled: [], disabled: [] }
            }
          })
          break
        case DataSourceType.GDRIVE:
          setConfig({
            gdrive: {
              nangoConnectionId: '',
              folders: { enabled: [], disabled: [] }
            }
          })
          break
        case DataSourceType.PROXY:
          setConfig({
            proxy: {
              url: '',
              method: '',
              token: '',
              username: '',
              password: '',
              headers: [],
              timeoutMs: 3000,
              responseMapping: []
            }
          })
          break
        default:
          setConfig({})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.type, open])

  const handleConfigChange = (path: string[], value: any) => {
    setConfig((prev: any) => {
      const newConfig = { ...prev }
      let current = newConfig
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {}
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      return newConfig
    })
  }

  const renderTypeSpecificFields = () => {
    switch (values.type) {
      case DataSourceType.FILES:
        return <FilesDataSourceForm config={config} onChange={handleConfigChange} />

      case DataSourceType.CONFLUENCE:
        return (
          <ConfluenceSteppedForm
            config={config}
            onChange={handleConfigChange}
            isEdit={!!dataSource}
            name={values.name}
            description={values.description || ''}
            onNameChange={(name) => setValues({ ...values, name })}
            onDescriptionChange={(description) => setValues({ ...values, description })}
            dataSourceId={dataSource?.id}
            onDataSourceCreated={(id) => {
              // When data source is created in the form, we could store the ID
              // but the form handles everything internally for now
              console.log('Data source created:', id)
            }}
            onFinalizeRef={confluenceFinalizeRef}
            syncSchedule={values.syncSchedule}
            onSyncScheduleChange={(schedule) => setValues({ ...values, syncSchedule: schedule })}
            enabled={values.enabled}
            onEnabledChange={(enabled) => setValues({ ...values, enabled })}
          />
        )

      case DataSourceType.GDRIVE:
        return (
          <GDriveSteppedForm
            config={config}
            onChange={handleConfigChange}
            name={values.name}
            description={values.description || ''}
            onNameChange={(name) => setValues({ ...values, name })}
            onDescriptionChange={(description) => setValues({ ...values, description })}
            dataSourceId={dataSource?.id}
            onDataSourceCreated={(id) => {
              console.log('Data source created:', id)
            }}
            onFinalizeRef={gdriveFinalizeRef}
            syncSchedule={values.syncSchedule}
            onSyncScheduleChange={(schedule) => setValues({ ...values, syncSchedule: schedule })}
            enabled={values.enabled}
            onEnabledChange={(enabled) => setValues({ ...values, enabled })}
          />
        )

      case DataSourceType.PROXY:
        return <ProxyDataSourceForm config={config} onChange={handleConfigChange} />

      default:
        return null
    }
  }

  const isSteppedForm = values.type === DataSourceType.CONFLUENCE || values.type === DataSourceType.GDRIVE

  const handleDone = async () => {
    // For stepped forms (Confluence, GDrive), call finalize before closing
    if (isSteppedForm) {
      const finalizeRef = values.type === DataSourceType.CONFLUENCE
        ? confluenceFinalizeRef.current
        : gdriveFinalizeRef.current

      if (finalizeRef) {
        try {
          await finalizeRef()
          onClose()
        } catch (error) {
          console.error('Failed to finalize:', error)
        }
      } else {
        onClose()
      }
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {dataSource ? 'Edit Data Source' : 'Create Data Source'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {!preselectedType && !dataSource && (
              <>
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

                <Divider sx={{ my: 1 }} />
              </>
            )}

            {/* Common fields - hidden for stepped forms as they're included in the steps */}
            {!isSteppedForm && (
              <>
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
              </>
            )}

            {/* Type-specific configuration fields */}
            {values.type && (
              <>
                {!isSteppedForm && <Divider sx={{ my: 1 }} />}
                {!isSteppedForm && (
                  <Typography variant="subtitle2" color="text.secondary">
                    {dataSourceTypes.find((t) => t.value === values.type)?.label} Configuration
                  </Typography>
                )}
                {renderTypeSpecificFields()}
              </>
            )}

            {/* General configuration - shown for non-stepped forms */}
            {!isSteppedForm && (
              <>
                <Divider sx={{ my: 1 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={values.enabled ?? true}
                      onChange={(e) => setValues({ ...values, enabled: e.target.checked })}
                    />
                  }
                  label="Enabled"
                />

                <TextField
                  name="syncSchedule"
                  label="Sync Schedule (Cron Expression)"
                  value={values.syncSchedule || '0 */6 * * *'}
                  onChange={handleChange}
                  placeholder="0 */6 * * *"
                  fullWidth
                  helperText="Optional: Cron expression for sync schedule (e.g., 0 */6 * * * for every 6 hours)"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {isSteppedForm ? (
            <Button
              onClick={handleDone}
              variant="contained"
              disabled={loading}
            >
              Done
            </Button>
          ) : (
            <Button type="submit" variant="contained" disabled={loading}>
              {dataSource ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}
