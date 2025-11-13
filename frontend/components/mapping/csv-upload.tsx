"use client";

import * as React from "react";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { parseCSVFile } from "@/lib/csv-utils";
import { CSVUpload } from "@/types/mapping";
import { toast } from "sonner";

interface CSVUploadComponentProps {
  onUploadComplete: (csvData: CSVUpload) => void;
  onRemove?: () => void;
  currentFile?: CSVUpload;
}

export function CSVUploadComponent({
  onUploadComplete,
  onRemove,
  currentFile,
}: CSVUploadComponentProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsProcessing(true);
    try {
      const csvData = await parseCSVFile(file);
      onUploadComplete(csvData);
      toast.success(`Uploaded ${file.name} with ${csvData.rowCount} rows`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to parse CSV file"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (currentFile) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <IconFile className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{currentFile.filename}</p>
              <p className="text-sm text-muted-foreground">
                {currentFile.columns.length} columns · {currentFile.rowCount}{" "}
                rows
              </p>
            </div>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="h-8 w-8"
            >
              <IconX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
        ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }
        ${isProcessing ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-muted p-4">
          <IconUpload className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">
            {isProcessing ? "Processing CSV..." : "Upload CSV File"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop your CSV file here, or click to browse
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          Select File
        </Button>
      </div>
    </div>
  );
}
