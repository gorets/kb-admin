import { TextField, Typography, Box } from '@mui/material'

interface FilesConfig {
  files?: {
    allowedExtensions?: string[]
  }
}

interface FilesDataSourceFormProps {
  config: FilesConfig
  onChange: (path: string[], value: any) => void
}

export default function FilesDataSourceForm({ config, onChange }: FilesDataSourceFormProps) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure allowed file extensions for this data source. After creating the data source, you can upload files from the data source detail page.
      </Typography>
      <TextField
        label="Allowed Extensions"
        value={config.files?.allowedExtensions?.join(', ') || 'pdf, docx, doc, xlsx, xls, txt, md, html'}
        onChange={(e) => {
          const extensions = e.target.value.split(',').map(s => s.trim().replace(/^\./, '')).filter(Boolean)
          onChange(['files', 'allowedExtensions'], extensions)
        }}
        placeholder="pdf, docx, doc, xlsx, xls, txt, md, html"
        fullWidth
        required
        helperText="Comma-separated list of allowed file extensions (without dots)"
      />
    </Box>
  )
}
