import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/client'
import {
  CreateDocumentCommand,
  GetDocumentPresignedUploadUrlCommand,
} from '@wildix/wim-knowledge-base-client'
import * as sha1Module from 'js-sha1'

const sha1 = (sha1Module as any).default || sha1Module

interface UploadFileParams {
  dataSourceId: string
  file: File
  onProgress?: (progress: number) => void
}

export const useUploadFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dataSourceId, file, onProgress }: UploadFileParams) => {
      // Calculate SHA-1 hash from file content
      const fileBuffer = await file.arrayBuffer()
      const fileHash = sha1(fileBuffer)

      // Step 1: Create document
      const createDocumentResponse = await kbClient.send(
        new CreateDocumentCommand({
          title: file.name,
          originalFormat: file.name.split('.').pop() || 'unknown',
          originalName: file.name,
          dataSourceId,
          originalId: fileHash,
        })
      )

      const documentId = createDocumentResponse.document?.id
      if (!documentId) {
        throw new Error('Failed to create document: No document ID returned')
      }

      // Step 2: Get presigned upload URL
      const presignedUrlResponse = await kbClient.send(
        new GetDocumentPresignedUploadUrlCommand({
          dataSourceId,
          documentId,
        })
      )

      const presignedUrl = presignedUrlResponse.presignedUploadUrl
      if (!presignedUrl) {
        throw new Error('Failed to get presigned upload URL')
      }

      // Step 3: Upload file to S3 using presigned URL
      return new Promise<{ documentId: string; dataSourceId: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100)
              onProgress(progress)
            }
          })
        }

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ documentId, dataSourceId })
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        // Handle error
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        // Handle abort
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'))
        })

        // Open and send request
        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.send(file)
      })
    },
    onSuccess: (data) => {
      // Invalidate documents query to refresh the list for this specific data source
      queryClient.invalidateQueries({ queryKey: ['documents', data.dataSourceId] })
    },
  })
}

export const useGetPresignedUploadUrl = () => {
  return useMutation({
    mutationFn: async ({
      dataSourceId,
      documentId,
    }: {
      dataSourceId: string
      documentId: string
    }) => {
      const response = await kbClient.send(
        new GetDocumentPresignedUploadUrlCommand({
          dataSourceId,
          documentId,
        })
      )

      return response.presignedUploadUrl
    },
  })
}
