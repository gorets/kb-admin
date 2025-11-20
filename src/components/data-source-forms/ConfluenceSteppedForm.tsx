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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { SelectableTreeWithConfig, getOptimizedConfig } from 'selectable-tree-view'
import type { TreeSyncConfig } from 'selectable-tree-view'
import 'selectable-tree-view/dist/src/SelectableTree.css' // Import CSS for tree icons
import {
  useCreateDataSource,
  useUpdateDataSource,
  useDescribeDataSource,
  type Space,
  type DescribeSpacesResponse,
  type DescribePagesResponse,
} from '../../hooks/useDataSources'
import { DataSourceType } from '@wildix/wim-knowledge-base-client'

interface FlatPage {
  id: string
  parentId: string | null
  title: string
}

interface ConfluenceConfig {
  confluence?: {
    baseUrl?: string
    username?: string
    apiKey?: string
    spaceId?: string
    pages?: {
      enabled?: string[]
      disabled?: string[]
    }
  }
}

interface ConfluenceSteppedFormProps {
  config: ConfluenceConfig
  onChange: (path: string[], value: any) => void
  isEdit?: boolean
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

const steps = ['Connector Info', 'Select Space', 'Select Pages']

export default function ConfluenceSteppedForm({
  config,
  onChange,
  isEdit = false,
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
}: ConfluenceSteppedFormProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [dataSourceId, setDataSourceId] = useState<string | undefined>(initialDataSourceId)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState<string>(config.confluence?.spaceId || '')
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false)
  const [pages, setPages] = useState<FlatPage[]>([])
  const [isLoadingPages, setIsLoadingPages] = useState(false)

  const createMutation = useCreateDataSource()
  const updateMutation = useUpdateDataSource()
  const describeMutation = useDescribeDataSource()

  // Update selectedSpace when config changes
  useEffect(() => {
    if (config.confluence?.spaceId) {
      setSelectedSpace(config.confluence.spaceId)
    }
  }, [config.confluence?.spaceId])

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
  }, [onFinalizeRef, dataSourceId, config, selectedSpace])

  // Step 1: Basic Configuration
  const handleStep1Next = async () => {
    setValidationError(null)

    // Validate required fields
    if (!name || !config.confluence?.baseUrl || !config.confluence?.username) {
      setValidationError('Please fill in all required fields')
      return
    }

    // For create mode, API key is required. For edit, it's optional
    if (!isEdit && !config.confluence?.apiKey) {
      setValidationError('API Key is required')
      return
    }

    setIsValidating(true)

    try {
      let currentDataSourceId: string

      if (isEdit && dataSourceId) {
        // For edit mode, just use existing ID
        currentDataSourceId = dataSourceId
      } else {
        // Create new data source with full config structure (but empty spaceId and pages)
        const createData: any = {
          name,
          description: description || '',
          type: DataSourceType.CONFLUENCE,
          config: {
            confluence: { // ← Config must be wrapped in type key!
              baseUrl: config.confluence.baseUrl,
              username: config.confluence.username,
              apiKey: config.confluence.apiKey!,
              spaceId: '', // Empty initially
              pages: { enabled: [], disabled: [] }, // Empty initially
            },
          },
          enabled,
          syncSchedule: syncSchedule || undefined,
        }

        const response = await createMutation.mutateAsync(createData)
        currentDataSourceId = response.id
        setDataSourceId(currentDataSourceId)

        if (onDataSourceCreated) {
          onDataSourceCreated(currentDataSourceId)
        }
      }

      // Load spaces
      await loadSpaces(currentDataSourceId)
      setActiveStep(1)
    } catch (error: any) {
      console.error('Failed to save data source:', error)
      setValidationError(error.message || 'Failed to save data source')
    } finally {
      setIsValidating(false)
    }
  }

  // Load spaces from API
  const loadSpaces = async (dsId: string) => {
    setIsLoadingSpaces(true)
    try {
      const response = await describeMutation.mutateAsync({
        dataSourceId: dsId,
        parameters: {
          confluence: {
            spaces: true as any,
          },
        },
      }) as DescribeSpacesResponse

      if (response.confluence.spaces) {
        setSpaces(response.confluence.spaces)
      }
    } catch (error: any) {
      console.error('Failed to load spaces:', error)
      setValidationError(error.message || 'Failed to load spaces')
    } finally {
      setIsLoadingSpaces(false)
    }
  }

  // Update data source with current configuration
  const updateDataSourceConfig = async () => {
    if (!dataSourceId || !config.confluence) return

    try {
      // Optimize pages config before saving
      const pagesConfig: TreeSyncConfig = {
        enabled: config.confluence.pages?.enabled || [],
        disabled: config.confluence.pages?.disabled || [],
      }
      const optimizedPagesConfig = getOptimizedConfig(
        pages,
        pagesConfig,
        (item) => item.id
      )

      const confluenceConfig: any = {
        baseUrl: config.confluence.baseUrl || '',
        username: config.confluence.username || '',
        spaceId: selectedSpace || config.confluence.spaceId || '',
        pages: optimizedPagesConfig,
      }

      // Only include apiKey if it was changed (for edit mode)
      if (config.confluence.apiKey) {
        confluenceConfig.apiKey = config.confluence.apiKey
      }

      await updateMutation.mutateAsync({
        id: dataSourceId,
        data: {
          dataSourceId, // SDK requires this in data
          name,
          description,
          type: DataSourceType.CONFLUENCE,
          config: {
            confluence: confluenceConfig, // ← Config must be wrapped in type key!
          },
          enabled,
          syncSchedule: syncSchedule || undefined,
        } as any, // Use any to bypass type check since we handle it in useUpdateDataSource
      })
    } catch (error: any) {
      console.error('Failed to update data source:', error)
      throw error
    }
  }

  // Step 2: Select Space
  const handleStep2Next = async () => {
    if (!selectedSpace) {
      setValidationError('Please select a space')
      return
    }
    setValidationError(null)

    try {
      // Update config with selected space
      onChange(['confluence', 'spaceId'], selectedSpace)

      // Update data source with selected space
      if (dataSourceId) {
        await updateDataSourceConfig()
      }

      // Load pages for selected space
      if (dataSourceId) {
        await loadPages(dataSourceId, selectedSpace)
      }

      setActiveStep(2)
    } catch (error: any) {
      console.error('Error in step 2:', error)
      setValidationError(error.message || 'Failed to proceed')
    }
  }

  // Load pages from API
  const loadPages = async (dsId: string, spaceId: string) => {
    setIsLoadingPages(true)
    try {
      const response = await describeMutation.mutateAsync({
        dataSourceId: dsId,
        parameters: {
          confluence: {
            pages: {
              spaceId,
              parentId: null,
            },
          },
        },
      }) as DescribePagesResponse

      if (response.confluence.pages) {
        // Convert pages to flat format with parentId
        const flatPages: FlatPage[] = response.confluence.pages.map((page) => ({
          id: page.id,
          title: page.title,
          parentId: null, // Root pages have no parent
        }))

        setUniquePages(flatPages)
      }
    } catch (error: any) {
      console.error('Failed to load pages:', error)
      setValidationError(error.message || 'Failed to load pages')
    } finally {
      setIsLoadingPages(false)
    }
  }

  // Helper function to add pages to flat array without duplicates
  const setUniquePages = (newPages: FlatPage[]) => {
    setPages((prevPages) => {
      // Create a map of existing pages by ID
      const pageMap = new Map(prevPages.map((p) => [p.id, p]))

      // Update or add pages
      for (const page of newPages) {
        pageMap.set(page.id, page)
      }

      // Convert back to array
      return Array.from(pageMap.values())
    })
  }

  // Load children for a specific node
  const handleLoadNode = async (parentId: string | null = null) => {
    if (!dataSourceId || !selectedSpace) return

    // For root nodes, we already loaded them in loadPages
    if (parentId === null || parentId === '') return

    try {
      const response = await describeMutation.mutateAsync({
        dataSourceId,
        parameters: {
          confluence: {
            pages: {
              spaceId: selectedSpace,
              parentId,
            },
          },
        },
      }) as DescribePagesResponse

      if (response.confluence.pages) {
        // Convert pages to flat format with parentId
        const flatPages: FlatPage[] = response.confluence.pages.map((page) => ({
          id: page.id,
          title: page.title,
          parentId: parentId, // Set parentId from the request
        }))

        setUniquePages(flatPages)
      }
    } catch (error: any) {
      console.error('Failed to load child pages:', error)
      setValidationError(error.message || 'Failed to load child pages')
    }
  }

  // Step 3: Complete
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
            Enter your Confluence connection details
          </Typography>

          <TextField
            label="Data Source Name"
            value={name}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder="My Confluence Data Source"
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

          <TextField
            label="Confluence URL"
            value={config.confluence?.baseUrl || ''}
            onChange={(e) => onChange(['confluence', 'baseUrl'], e.target.value)}
            placeholder="https://your-domain.atlassian.net"
            fullWidth
            required
            helperText="The URL of the Confluence instance"
          />

          <TextField
            label="Username"
            value={config.confluence?.username || ''}
            onChange={(e) => onChange(['confluence', 'username'], e.target.value)}
            placeholder="user@example.com"
            fullWidth
            required
            helperText="The username or email of the Confluence instance"
          />

          <TextField
            label="API Key"
            type="password"
            value={config.confluence?.apiKey || ''}
            onChange={(e) => onChange(['confluence', 'apiKey'], e.target.value)}
            fullWidth
            required={!isEdit}
            placeholder={isEdit ? 'Leave empty to keep existing token' : undefined}
            helperText={
              isEdit
                ? 'Only enter if you want to change the API token'
                : 'Generate at https://id.atlassian.com/manage-profile/security/api-tokens'
            }
          />

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
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Validating...
                </>
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 2: Select Space */}
      {activeStep === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Connection successful! Now select a Confluence space to sync.
          </Typography>

          {isLoadingSpaces ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : spaces.length > 0 ? (
            <FormControl fullWidth required>
              <InputLabel>Select Space</InputLabel>
              <Select
                value={selectedSpace}
                onChange={(e) => setSelectedSpace(e.target.value)}
                label="Select Space"
              >
                {spaces.map((space) => (
                  <MenuItem key={space.id} value={space.id}>
                    {space.name} ({space.key})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Alert severity="warning">
              No spaces found. Please check your Confluence connection.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleBack}>Back</Button>
            <Button
              variant="contained"
              onClick={handleStep2Next}
              disabled={!selectedSpace || isLoadingSpaces}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Select Pages */}
      {activeStep === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Select pages to sync from the space.
          </Typography>

          {isLoadingPages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : pages.length > 0 ? (
            <>
              <Alert severity="success">
                Select the pages you want to sync using the tree below.
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
                  items={pages}
                  config={{
                    enabled: config.confluence?.pages?.enabled || [],
                    disabled: config.confluence?.pages?.disabled || [],
                  }}
                  onConfigChange={(newConfig: TreeSyncConfig) => {
                    onChange(['confluence', 'pages', 'enabled'], newConfig.enabled)
                    onChange(['confluence', 'pages', 'disabled'], newConfig.disabled)
                  }}
                  onNodeLoad={handleLoadNode}
                  getId={(item) => item.id}
                  getTitle={(item) => item.title}
                />
              </Paper>
            </>
          ) : (
            <Alert severity="info">
              No pages found or all pages will be synced by default.
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
