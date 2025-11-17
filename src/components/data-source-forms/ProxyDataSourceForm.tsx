import { TextField, Box } from '@mui/material'

interface ProxyConfig {
  proxy?: {
    url?: string
    method?: string
    token?: string
    username?: string
    password?: string
    headers?: string[]
    timeoutMs?: number
    responseMapping?: string[]
  }
}

interface ProxyDataSourceFormProps {
  config: ProxyConfig
  onChange: (path: string[], value: any) => void
}

export default function ProxyDataSourceForm({ config, onChange }: ProxyDataSourceFormProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Proxy URL"
        value={config.proxy?.url || ''}
        onChange={(e) => onChange(['proxy', 'url'], e.target.value)}
        placeholder="http://proxy.example.com:8080/data-source"
        fullWidth
        required
        helperText="The URL of the proxy server"
      />
      <TextField
        label="Method"
        value={config.proxy?.method || ''}
        onChange={(e) => onChange(['proxy', 'method'], e.target.value)}
        placeholder="GET"
        fullWidth
        helperText="HTTP method (GET, POST, etc.)"
      />
      <TextField
        label="Token"
        type="password"
        value={config.proxy?.token || ''}
        onChange={(e) => onChange(['proxy', 'token'], e.target.value)}
        placeholder="wsk-v1-1234567890"
        fullWidth
        helperText="The API Key or JWT token of the proxy server"
      />
      <TextField
        label="Username"
        value={config.proxy?.username || ''}
        onChange={(e) => onChange(['proxy', 'username'], e.target.value)}
        placeholder="user"
        fullWidth
        helperText="The username of the proxy server"
      />
      <TextField
        label="Password"
        type="password"
        value={config.proxy?.password || ''}
        onChange={(e) => onChange(['proxy', 'password'], e.target.value)}
        placeholder="password"
        fullWidth
        helperText="The password of the proxy server"
      />
      <TextField
        label="Headers"
        value={config.proxy?.headers?.join(', ') || ''}
        onChange={(e) => {
          const headers = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          onChange(['proxy', 'headers'], headers)
        }}
        placeholder="Authorization: Bearer token, Content-Type: application/json"
        fullWidth
        multiline
        rows={2}
        helperText="Comma-separated list of headers (e.g., 'Authorization: Bearer token')"
      />
      <TextField
        label="Timeout (ms)"
        type="number"
        value={config.proxy?.timeoutMs || 3000}
        onChange={(e) => {
          const value = parseInt(e.target.value)
          if (value >= 500 && value <= 600000) {
            onChange(['proxy', 'timeoutMs'], value)
          }
        }}
        placeholder="3000"
        fullWidth
        helperText="Timeout in milliseconds (500-600000)"
        inputProps={{ min: 500, max: 600000 }}
      />
      <TextField
        label="Response Mapping"
        value={config.proxy?.responseMapping?.join('\n') || ''}
        onChange={(e) => {
          const mappings = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
          onChange(['proxy', 'responseMapping'], mappings)
        }}
        placeholder="&#123;&#123; $input.name &#125;&#125; -> &#123;&#123; $result.title&#125;&#125;"
        fullWidth
        multiline
        rows={3}
        helperText="Response mapping (one per line)"
      />
    </Box>
  )
}
