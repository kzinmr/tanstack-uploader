import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { Button, Card, Input, Text, VStack, Box, Flex } from "@chakra-ui/react"
import { AttachmentIcon, DownloadIcon, ArrowUpIcon } from "@chakra-ui/icons"
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'

export const Route = createFileRoute('/uploader')({
  component: Uploader,
})

function Uploader() {
  const [file, setFile] = useState<File | null>(null)
  const [processedData, setProcessedData] = useState<any[] | null>(null)

  const analyzeDataMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('https://api.example.com/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onSuccess: (result) => {
      setProcessedData(result)
    },
    onError: (error) => {
      console.error('Error processing data:', error)
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    setFile(file)
    processFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  })

  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const parsedData = XLSX.utils.sheet_to_json(sheet)

      localStorage.setItem('uploadedData', JSON.stringify(parsedData))
      analyzeDataMutation.mutate(parsedData)
    }
    reader.readAsArrayBuffer(file)
  }

  const downloadProcessedData = () => {
    if (processedData) {
      const ws = XLSX.utils.json_to_sheet(processedData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Processed Data')
      XLSX.writeFile(wb, 'processed_data.csv')
    }
  }

  return (
    <Flex alignItems="center" justifyContent="center" minHeight="100vh" bg="gray.100" p={4}>
      <Card maxW="md" p={6}>
        <VStack spacing={6}>
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">CSV/XLSX Processor</Text>
            <Text fontSize="sm" color="gray.500">Upload your CSV or XLSX file for analysis</Text>
          </Box>
          <Box
            {...getRootProps()}
            borderWidth={2}
            borderStyle="dashed"
            borderRadius="lg"
            p={8}
            textAlign="center"
            cursor="pointer"
            borderColor={isDragActive ? "blue.500" : "gray.300"}
          >
            <Input {...getInputProps({ size: undefined })} />
            <ArrowUpIcon boxSize={12} color="gray.400" />
            <Text mt={2} fontSize="sm" color="gray.500">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
            </Text>
            <Text fontSize="xs" color="gray.400" mt={1}>Supported formats: CSV, XLSX</Text>
          </Box>
          {file && (
            <Flex alignItems="center" fontSize="sm" color="gray.500">
              <AttachmentIcon boxSize={4} />
              <Text ml={2}>{file.name}</Text>
            </Flex>
          )}
          {processedData && (
            <Button onClick={downloadProcessedData} width="full" leftIcon={<DownloadIcon />}>
              Download Processed Data
            </Button>
          )}
        </VStack>
      </Card>
    </Flex>
  )
}
