import { TextField, Typography, Box } from '@mui/material'
import { useState } from 'react'

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
  const [inputValue, setInputValue] = useState(
    config.files?.allowedExtensions?.join(', ') || 'pdf, docx, doc, xlsx, xls, txt, md, html'
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
  }

  const handleBlur = () => {
    // Parse extensions only when user leaves the field
    const extensions = inputValue
      .split(',')
      .map(s => s.trim().replace(/^\./, ''))
      .filter(Boolean)
    
    onChange(['files', 'allowedExtensions'], extensions)
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure allowed file extensions for this data source. After creating the data source, you can upload files from the data source detail page.
      </Typography>
      <TextField
        label="Allowed Extensions"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="pdf, docx, doc, xlsx, xls, txt, md, html"
        fullWidth
        required
        helperText="Comma-separated list of allowed file extensions (without dots)"
      />
    </Box>
  )
}
