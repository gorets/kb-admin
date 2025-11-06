import { useEffect, useMemo, useCallback, useState } from 'react'
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
  Alert,
  FormControlLabel,
  Switch,
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

  const [config, setConfig] = useState<any>(dataSource?.config || {})

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
        config: dataSource.config || { files: { allowedExtensions: [] } },
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
              url: '',
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
        return (
          <>
            <TextField
              label="Allowed Extensions"
              value={config.files?.allowedExtensions?.join(', ') || ''}
              onChange={(e) => {
                const extensions = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                handleConfigChange(['files', 'allowedExtensions'], extensions)
              }}
              placeholder=".pdf, .txt, .docx"
              fullWidth
              required
              helperText="Comma-separated list of allowed file extensions"
            />
          </>
        )

      case DataSourceType.CONFLUENCE:
        return (
          <>
            <TextField
              label="Confluence URL"
              value={config.confluence?.url || ''}
              onChange={(e) => handleConfigChange(['confluence', 'url'], e.target.value)}
              placeholder="https://your-domain.atlassian.net"
              fullWidth
              required
              helperText="The URL of the Confluence instance"
            />
            <TextField
              label="Username"
              value={config.confluence?.username || ''}
              onChange={(e) => handleConfigChange(['confluence', 'username'], e.target.value)}
              placeholder="user@example.com"
              fullWidth
              required
              helperText="The username or email of the Confluence instance"
            />
            <TextField
              label="API Key"
              type="password"
              value={config.confluence?.apiKey || ''}
              onChange={(e) => handleConfigChange(['confluence', 'apiKey'], e.target.value)}
              fullWidth
              required
              helperText="The API token of the Confluence instance"
            />
            <TextField
              label="Space ID"
              value={config.confluence?.spaceId || ''}
              onChange={(e) => handleConfigChange(['confluence', 'spaceId'], e.target.value)}
              placeholder="SPACE123"
              fullWidth
              required
              helperText="The space ID of the Confluence instance"
            />
            <TextField
              label="Enabled Pages"
              value={config.confluence?.pages?.enabled?.join(', ') || ''}
              onChange={(e) => {
                const pages = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                handleConfigChange(['confluence', 'pages', 'enabled'], pages)
              }}
              placeholder="page1, page2, page3"
              fullWidth
              helperText="Comma-separated list of enabled page IDs"
            />
            <TextField
              label="Disabled Pages"
              value={config.confluence?.pages?.disabled?.join(', ') || ''}
              onChange={(e) => {
                const pages = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                handleConfigChange(['confluence', 'pages', 'disabled'], pages)
              }}
              placeholder="page4, page5"
              fullWidth
              helperText="Comma-separated list of disabled page IDs"
            />
          </>
        )

      case DataSourceType.GDRIVE:
        return (
          <>
            <TextField
              label="Nango Connection ID"
              value={config.gdrive?.nangoConnectionId || ''}
              onChange={(e) => handleConfigChange(['gdrive', 'nangoConnectionId'], e.target.value)}
              placeholder="conn_123abc"
              fullWidth
              required
              helperText="The Nango connection ID of the GDrive instance"
            />
            <TextField
              label="Enabled Folders"
              value={config.gdrive?.folders?.enabled?.join(', ') || ''}
              onChange={(e) => {
                const folders = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                handleConfigChange(['gdrive', 'folders', 'enabled'], folders)
              }}
              placeholder="folder1, folder2"
              fullWidth
              helperText="Comma-separated list of enabled folder IDs"
            />
            <TextField
              label="Disabled Folders"
              value={config.gdrive?.folders?.disabled?.join(', ') || ''}
              onChange={(e) => {
                const folders = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                handleConfigChange(['gdrive', 'folders', 'disabled'], folders)
              }}
              placeholder="folder3, folder4"
              fullWidth
              helperText="Comma-separated list of disabled folder IDs"
            />
          </>
        )

      case DataSourceType.PROXY:
        return (
          <Alert severity="info">
            Proxy type configuration is not yet defined in the schema.
          </Alert>
        )

      default:
        return null
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

            {/* Type-specific configuration fields */}
            {values.type && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {dataSourceTypes.find((t) => t.value === values.type)?.label} Configuration
                </Typography>
                {renderTypeSpecificFields()}
              </>
            )}

            {/* General configuration */}
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
              value={values.syncSchedule || ''}
              onChange={handleChange}
              placeholder="0 */6 * * *"
              fullWidth
              helperText="Optional: Cron expression for sync schedule (e.g., 0 */6 * * * for every 6 hours)"
            />
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
