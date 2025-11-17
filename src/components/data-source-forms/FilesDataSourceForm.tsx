import { TextField } from '@mui/material'

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
    <TextField
      label="Allowed Extensions"
      value={config.files?.allowedExtensions?.join(', ') || ''}
      onChange={(e) => {
        const extensions = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
        onChange(['files', 'allowedExtensions'], extensions)
      }}
      placeholder=".pdf, .txt, .docx"
      fullWidth
      required
      helperText="Comma-separated list of allowed file extensions"
    />
  )
}
