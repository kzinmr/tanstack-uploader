import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileUp, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";


import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: Uploader,
});

export default function Uploader() {
  const [file, setFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<any[] | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFile(file);
    processFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  const analyzeDataMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("https://api.example.com/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (result) => {
      setProcessedData(result);
    },
    onError: (error) => {
      console.error("Error processing data:", error);
    },
  });

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      localStorage.setItem("uploadedData", JSON.stringify(parsedData));
      // analyzeDataMutation.mutate(parsedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadProcessedData = () => {
    if (processedData) {
      const ws = XLSX.utils.json_to_sheet(processedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Processed Data");
      XLSX.writeFile(wb, "processed_data.csv");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            CSV/XLSX Processor
          </CardTitle>
          <p className="text-sm text-gray-500 text-center">
            Upload your CSV or XLSX file for analysis
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
              isDragActive ? "border-primary" : "border-gray-300"
            }`}
          >
            <Input {...getInputProps()} className="hidden" />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              {isDragActive
                ? "Drop the file here"
                : "Drag & drop a file here, or click to select"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supported formats: CSV, XLSX
            </p>
          </div>
          {file && (
            <div className="text-sm text-gray-500">
              <FileUp className="inline-block mr-2 h-4 w-4" />
              {file.name}
            </div>
          )}
          {processedData && (
            <Button onClick={downloadProcessedData} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Processed Data
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
