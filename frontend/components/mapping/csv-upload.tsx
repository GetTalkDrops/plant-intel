"use client";

/**
 * CSV Upload Component
 * Drag-and-drop file upload for CSV files
 */

import { useState } from "react";
import { CSVUpload } from "@/types/mapping";
import { parseCSVFile } from "@/lib/csv-utils";
import { Button } from "@/components/ui/button";

interface CSVUploadComponentProps {
  onUpload: (data: CSVUpload) => void;
}

export function CSVUploadComponent({ onUpload }: CSVUploadComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    setIsUploading(true);
    try {
      const data = await parseCSVFile(file);
      onUpload(data);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      alert("Failed to parse CSV file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center
          transition-colors cursor-pointer
          ${isDragging ? "border-primary bg-primary/5" : "border-gray-300"}
        `}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-lg font-medium">
              {isUploading ? "Uploading..." : "Drag & drop CSV file here"}
            </p>
            <p className="text-sm text-gray-500">or click to browse</p>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="csv-upload"
            disabled={isUploading}
          />
          <Button asChild disabled={isUploading}>
            <label htmlFor="csv-upload" className="cursor-pointer">
              Select File
            </label>
          </Button>
        </div>
      </div>
    </div>
  );
}
