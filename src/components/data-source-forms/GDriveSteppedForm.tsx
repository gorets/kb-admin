import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { SelectableTreeWithConfig, getOptimizedConfig } from 'selectable-tree-view'
import type { TreeSyncConfig } from 'selectable-tree-view'
import 'selectable-tree-view/dist/src/SelectableTree.css'
import {
  useCreateDataSource,
  useUpdateDataSource,
  useDescribeDataSource,
} from '../../hooks/useDataSources'
import { useNangoAuth } from '../../hooks/useNangoAuth'
import { DataSourceType, DescribeDataSourceGDriveFolderResult } from '@wildix/wim-knowledge-base-client'

interface FlatFolder {
  id: string
  name: string
  parentId: string | null
}

interface GDriveConfig {
  gdrive?: {
    nangoConnectionId?: string
    folders?: {
      enabled?: string[]
      disabled?: string[]
    }
  }
}

interface GDriveSteppedFormProps {
  config: GDriveConfig
  onChange: (path: string[], value: any) => void
  name?: string
  description?: string
  onNameChange?: (name: string) => void
  onDescriptionChange?: (description: string) => void
  dataSourceId?: string
  onDataSourceCreated?: (id: string) => void
  onFinalizeRef?: React.MutableRefObject<(() => Promise<void>) | undefined>
  syncSchedule?: string
  onSyncScheduleChange?: (schedule: string) => void
  enabled?: boolean
  onEnabledChange?: (enabled: boolean) => void
}

const steps = ['Connection Info', 'Select Folders']

export default function GDriveSteppedForm({
  config,
  onChange,
  name = '',
  description = '',
  onNameChange,
  onDescriptionChange,
  dataSourceId: initialDataSourceId,
  onDataSourceCreated,
  onFinalizeRef,
  syncSchedule = '0 */6 * * *',
  onSyncScheduleChange,
  enabled = true,
  onEnabledChange,
}: GDriveSteppedFormProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [dataSourceId, setDataSourceId] = useState<string | undefined>(initialDataSourceId)
  const [folders, setFolders] = useState<FlatFolder[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [authSuccess, setAuthSuccess] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const createMutation = useCreateDataSource()
  const updateMutation = useUpdateDataSource()
  const describeMutation = useDescribeDataSource()
  const { authenticate, isLoading: isAuthLoading, error: authError } = useNangoAuth()

  // Update dataSourceId when prop changes
  useEffect(() => {
    if (initialDataSourceId) {
      setDataSourceId(initialDataSourceId)
    }
  }, [initialDataSourceId])

  // Expose finalize method for parent component via ref
  useEffect(() => {
    if (onFinalizeRef && dataSourceId) {
      onFinalizeRef.current = async () => {
        await updateDataSourceConfig()
      }
    }
  }, [onFinalizeRef, dataSourceId, config])

  // Handle OAuth authentication
  const handleAuthenticate = async () => {
    setValidationError(null)
    setIsAuthenticating(true)

    try {
      // Step 1: Create temporary data source to get session token
      let tempDataSourceId = dataSourceId

      if (!tempDataSourceId) {
        // Create data source first
        const createData: any = {
          name: name || 'Google Drive (temp)',
          description: description || '',
          type: DataSourceType.GDRIVE,
          config: {
            gdrive: {
              nangoConnectionId: '',
              folders: { enabled: [], disabled: [] },
            },
          },
          enabled: false, // Disabled until auth completes
          syncSchedule: syncSchedule || undefined,
        }

        const response = await createMutation.mutateAsync(createData)
        tempDataSourceId = response.id
        setDataSourceId(tempDataSourceId)

        if (onDataSourceCreated) {
          onDataSourceCreated(tempDataSourceId)
        }
      }

      // Step 2: Get Nango session token from backend
      const sessionResponse = await describeMutation.mutateAsync({
        dataSourceId: tempDataSourceId,
        parameters: {
          gdrive: {
            session: {
              userId: 'admin',
            },
          },
        } as any,
      })

      if (!sessionResponse.gdrive?.sessionId) {
        throw new Error('Failed to get session token')
      }

      // Step 3: Perform OAuth via Nango
      const integrationId = import.meta.env.VITE_GDRIVE_INTEGRATION_ID || 'kb-google-drive'
      const authResult = await authenticate(integrationId, sessionResponse.gdrive.sessionId)

      // Step 4: Save connection ID
      onChange(['gdrive', 'nangoConnectionId'], authResult.connectionId)

      setAuthSuccess(true)
      setTimeout(() => setAuthSuccess(false), 3000)
    } catch (error: any) {
      console.error('Authentication failed:', error)
      setValidationError(error.message || 'Authentication failed')
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Step 1: Proceed to folder selection
  const handleStep1Next = async () => {
    setValidationError(null)

    // Validate required fields
    if (!name || !config.gdrive?.nangoConnectionId) {
      setValidationError('Please authenticate with Google Drive first')
      return
    }

    setIsValidating(true)

    try {
      let currentDataSourceId = dataSourceId

      // Update data source with auth info and enable it
      if (currentDataSourceId) {
        await updateMutation.mutateAsync({
          id: currentDataSourceId,
          data: {
            dataSourceId: currentDataSourceId,
            name,
            description,
            type: DataSourceType.GDRIVE,
            config: {
              gdrive: {
                nangoConnectionId: config.gdrive.nangoConnectionId,
                folders: config.gdrive?.folders || { enabled: [], disabled: [] },
              },
            },
            enabled: true, // Enable now that auth is complete
            syncSchedule: syncSchedule || undefined,
          } as any,
        })
      } else {
        // Should not happen, but handle it
        throw new Error('Data source not created')
      }

      // Load root folders
      await loadFolders(currentDataSourceId, null)
      setActiveStep(1)
    } catch (error: any) {
      console.error('Failed to proceed:', error)
      setValidationError(error.message || 'Failed to proceed')
    } finally {
      setIsValidating(false)
    }
  }

  // Load folders from API
  const loadFolders = async (dsId: string, parentId: string | null) => {
    setIsLoadingFolders(true)
    try {
      const response = await describeMutation.mutateAsync({
        dataSourceId: dsId,
        parameters: {
          gdrive: {
            folders: {
              parentId: parentId || 'root',
              enabled: config.gdrive?.folders?.enabled || [],
            },
          },
        } as any,
      })

      if (response.gdrive?.folders) {
        setUniqueFolders(response.gdrive.folders, parentId === 'root' ? null : parentId)
      }
    } catch (error: any) {
      console.error('Failed to load folders:', error)
      setValidationError(error.message || 'Failed to load folders')
    } finally {
      setIsLoadingFolders(false)
    }
  }

  // Helper function to add folders to flat array without duplicates
  const setUniqueFolders = (newFolders: DescribeDataSourceGDriveFolderResult[], parentId: string | null = null) => {
    setFolders((prevFolders) => {
      // Create a map of existing folders by ID
      const folderMap = new Map(prevFolders.map((f) => [f.id, f]))

      // Update or add folders - ensure parentId is preserved correctly
      for (const folder of newFolders) {
        const flatFolder: FlatFolder = {
          id: folder.id,
          name: folder.name,
          parentId: parentId // Use the parentId from loading context
        }
        folderMap.set(folder.id, flatFolder)
      }

      // Convert back to array
      return Array.from(folderMap.values())
    })
  }

  // Load children for a specific node
  const handleLoadNode = async (parentId: string | null = null) => {
    if (!dataSourceId) return

    // For root nodes, we already loaded them in loadFolders
    if (parentId === null || parentId === '') return

    try {
      const response = await describeMutation.mutateAsync({
        dataSourceId,
        parameters: {
          gdrive: {
            folders: {
              parentId,
            },
          },
        } as any,
      })

      if (response.gdrive?.folders) {
        setUniqueFolders(response.gdrive.folders, parentId)
      }
    } catch (error: any) {
      console.error('Failed to load child folders:', error)
      setValidationError(error.message || 'Failed to load child folders')
    }
  }

  // Update data source with current configuration
  const updateDataSourceConfig = async () => {
    if (!dataSourceId || !config.gdrive) return

    try {
      // Optimize folders config before saving
      const foldersConfig: TreeSyncConfig = {
        enabled: config.gdrive.folders?.enabled || [],
        disabled: config.gdrive.folders?.disabled || [],
      }
      const optimizedFoldersConfig = getOptimizedConfig(
        folders,
        foldersConfig,
        (item) => item.id
      )

      const gdriveConfig: any = {
        nangoConnectionId: config.gdrive.nangoConnectionId || '',
        folders: optimizedFoldersConfig,
      }

      await updateMutation.mutateAsync({
        id: dataSourceId,
        data: {
          dataSourceId, // SDK requires this in data
          name,
          description,
          type: DataSourceType.GDRIVE,
          config: {
            gdrive: gdriveConfig,
          },
          enabled,
          syncSchedule: syncSchedule || undefined,
        } as any,
      })
    } catch (error: any) {
      console.error('Failed to update data source:', error)
      throw error
    }
  }

  // Step back
  const handleBack = () => {
    setValidationError(null)
    setActiveStep((prev) => prev - 1)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {validationError && (
        <Alert severity="error" onClose={() => setValidationError(null)}>
          {validationError}
        </Alert>
      )}

      {/* Step 1: Basic Configuration */}
      {activeStep === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Enter your Google Drive connection details
          </Typography>

          <TextField
            label="Data Source Name"
            value={name}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder="My Google Drive Data Source"
            fullWidth
            required
            helperText="A descriptive name for this data source"
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => onDescriptionChange?.(e.target.value)}
            placeholder="Optional description"
            fullWidth
            multiline
            rows={2}
            helperText="Optional description of this data source"
          />

          {/* Google Account Authentication Section */}
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
              Google Account Authentication
            </Typography>

            {authError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {authError.message}
              </Alert>
            )}

            {authSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✓ Successfully authenticated with Google
              </Alert>
            )}

            {config.gdrive?.nangoConnectionId && (
              <Alert severity="info" sx={{ mb: 2 }}>
                ✓ Google account is connected
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleAuthenticate}
              disabled={isAuthenticating || isAuthLoading || !name}
              fullWidth
              sx={{
                backgroundColor: '#4285F4',
                '&:hover': { backgroundColor: '#357ae8' },
                mb: 1,
              }}
            >
              {isAuthenticating || isAuthLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  Authenticating...
                </Box>
              ) : config.gdrive?.nangoConnectionId ? (
                'Re-authenticate with Google'
              ) : (
                'Authenticate with Google'
              )}
            </Button>

            {!name && (
              <Typography variant="caption" color="text.secondary">
                Please enter a name first before authenticating
              </Typography>
            )}
          </Box>

          <TextField
            label="Sync Schedule (Cron Expression)"
            value={syncSchedule}
            onChange={(e) => onSyncScheduleChange?.(e.target.value)}
            placeholder="0 */6 * * *"
            fullWidth
            helperText="Optional: Cron expression for sync schedule (e.g., 0 */6 * * * for every 6 hours)"
          />

          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => onEnabledChange?.(e.target.checked)}
              />
            }
            label="Enabled"
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleStep1Next}
              disabled={isValidating || !config.gdrive?.nangoConnectionId}
            >
              {isValidating ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Loading...
                </>
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 2: Select Folders */}
      {activeStep === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Select folders to sync from Google Drive.
          </Typography>

          {isLoadingFolders ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : folders.length > 0 ? (
            <>
              <Alert severity="success">
                Select the folders you want to sync using the tree below.
              </Alert>

              <Paper
                sx={{
                  p: 2,
                  backgroundColor: '#fcfcfc',
                  maxHeight: 500,
                  overflow: 'auto',
                }}
              >
                <SelectableTreeWithConfig
                  items={folders}
                  config={{
                    enabled: config.gdrive?.folders?.enabled || [],
                    disabled: config.gdrive?.folders?.disabled || [],
                  }}
                  onConfigChange={(newConfig: TreeSyncConfig) => {
                    onChange(['gdrive', 'folders', 'enabled'], newConfig.enabled)
                    onChange(['gdrive', 'folders', 'disabled'], newConfig.disabled)
                  }}
                  onNodeLoad={handleLoadNode}
                  getId={(item) => item.id}
                  getTitle={(item) => item.name}
                />
              </Paper>
            </>
          ) : (
            <Alert severity="info">
              No folders found or all folders will be synced by default.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={handleBack}>Back</Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click "Create" or "Update" below to save
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}
