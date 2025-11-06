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
  Chip,
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
          setConfig({ confluence: { baseUrl: '', spaceKeys: [] } })
          break
        case DataSourceType.GDRIVE:
          setConfig({ gdrive: { folderId: '' } })
          break
        case DataSourceType.PROXY:
          setConfig({ proxy: { proxyUrl: '' } })
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
              helperText="Comma-separated list of allowed file extensions"
            />
          </>
        )

      case DataSourceType.CONFLUENCE:
        return (
          <>
            <TextField
              label="Base URL"
              value={config.confluence?.baseUrl || ''}
              onChange={(e) => handleConfigChange(['confluence', 'baseUrl'], e.target.value)}
              placeholder="https://your-domain.atlassian.net/wiki"
              fullWidth
              helperText="Confluence instance base URL"
            />
            <TextField
              label="Space Keys"
              value={config.confluence?.spaceKeys?.join(', ') || ''}
              onChange={(e) => {
                const keys = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                handleConfigChange(['confluence', 'spaceKeys'], keys)
              }}
              placeholder="SPACE1, SPACE2"
              fullWidth
              helperText="Comma-separated list of Confluence space keys"
            />
            <TextField
              label="Username"
              value={config.confluence?.username || ''}
              onChange={(e) => handleConfigChange(['confluence', 'username'], e.target.value)}
              fullWidth
              helperText="Confluence username or email"
            />
            <TextField
              label="API Token"
              type="password"
              value={config.confluence?.apiToken || ''}
              onChange={(e) => handleConfigChange(['confluence', 'apiToken'], e.target.value)}
              fullWidth
              helperText="Confluence API token"
            />
          </>
        )

      case DataSourceType.GDRIVE:
        return (
          <>
            <TextField
              label="Folder ID"
              value={config.gdrive?.folderId || ''}
              onChange={(e) => handleConfigChange(['gdrive', 'folderId'], e.target.value)}
              placeholder="1a2b3c4d5e6f7g8h9i0j"
              fullWidth
              helperText="Google Drive folder ID to sync"
            />
            <TextField
              label="Service Account Email"
              value={config.gdrive?.serviceAccountEmail || ''}
              onChange={(e) => handleConfigChange(['gdrive', 'serviceAccountEmail'], e.target.value)}
              placeholder="service-account@project.iam.gserviceaccount.com"
              fullWidth
              helperText="Service account email for authentication"
            />
          </>
        )

      case DataSourceType.PROXY:
        return (
          <>
            <TextField
              label="Proxy URL"
              value={config.proxy?.proxyUrl || ''}
              onChange={(e) => handleConfigChange(['proxy', 'proxyUrl'], e.target.value)}
              placeholder="https://proxy.example.com"
              fullWidth
              required
              helperText="Proxy server URL"
            />
            <TextField
              label="Target Domain"
              value={config.proxy?.targetDomain || ''}
              onChange={(e) => handleConfigChange(['proxy', 'targetDomain'], e.target.value)}
              placeholder="example.com"
              fullWidth
              helperText="Target domain to proxy requests to"
            />
          </>
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
