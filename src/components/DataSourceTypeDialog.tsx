import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Grid,
} from '@mui/material'
import { DataSourceType } from '@wildix/wim-knowledge-base-client'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudIcon from '@mui/icons-material/Cloud'
import StorageIcon from '@mui/icons-material/Storage'
import HttpIcon from '@mui/icons-material/Http'

interface DataSourceTypeDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (type: DataSourceType) => void
}

const dataSourceTypes = [
  {
    value: DataSourceType.FILES,
    label: 'Files',
    description: 'Upload and manage local files',
    icon: DescriptionIcon,
  },
  {
    value: DataSourceType.CONFLUENCE,
    label: 'Confluence',
    description: 'Connect to Atlassian Confluence',
    icon: CloudIcon,
  },
  {
    value: DataSourceType.GDRIVE,
    label: 'Google Drive',
    description: 'Connect to Google Drive',
    icon: StorageIcon,
  },
  {
    value: DataSourceType.PROXY,
    label: 'Proxy',
    description: 'Custom proxy integration',
    icon: HttpIcon,
  },
]

export default function DataSourceTypeDialog({
  open,
  onClose,
  onSelect,
}: DataSourceTypeDialogProps) {
  const handleSelect = (type: DataSourceType) => {
    onSelect(type)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Data Source Type</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {dataSourceTypes.map((type) => {
              const Icon = type.icon
              return (
                <Grid item xs={12} sm={6} key={type.value}>
                  <Card>
                    <CardActionArea onClick={() => handleSelect(type.value)}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            py: 2,
                          }}
                        >
                          <Icon sx={{ fontSize: 48, color: 'primary.main' }} />
                          <Typography variant="h6" component="div">
                            {type.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                          >
                            {type.description}
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}
