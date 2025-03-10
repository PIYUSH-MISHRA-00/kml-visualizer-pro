
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileX } from "lucide-react";
import { parseKmlFile } from "@/utils/kmlParser";
import { ParsedKml } from "@/types";
import { toast } from "@/components/ui/use-toast";

interface FileUploadProps {
  onFileProcessed: (data: ParsedKml) => void;
  className?: string;
}

const FileUpload = ({ onFileProcessed, className }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.kml')) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please upload a KML file (.kml extension).",
      });
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const parsedData = await parseKmlFile(file);
      onFileProcessed(parsedData);
      toast({
        title: "File processed successfully",
        description: `${file.name} has been uploaded and processed.`,
      });
    } catch (error) {
      console.error("Error processing KML file:", error);
      toast({
        variant: "destructive",
        title: "Error processing file",
        description: "There was an error processing your KML file. Please check the file and try again.",
      });
      setFileName(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onFileProcessed]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleReset = useCallback(() => {
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div
        className={cn(
          "file-drop-area min-h-64 flex flex-col items-center justify-center p-8 text-center",
          isDragging && "active",
          isProcessing && "pointer-events-none opacity-70",
          fileName ? "bg-kml-gray/50" : "bg-white border-kml-gray/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {isProcessing ? (
          <div className="animate-pulse-subtle">
            <div className="flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full border-2 border-kml-blue border-t-transparent animate-spin mb-4"></div>
              <p className="text-lg font-medium text-kml-dark-gray/80">Processing your file...</p>
            </div>
          </div>
        ) : fileName ? (
          <div className="animate-fade-in">
            <div className="bg-kml-blue/10 rounded-full h-16 w-16 flex items-center justify-center mb-4 mx-auto">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="h-8 w-8 text-kml-blue"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-kml-dark-gray mb-2">File uploaded successfully</h3>
            <p className="text-sm text-kml-dark-gray/70 mb-4">{fileName}</p>
            <button
              type="button"
              onClick={handleReset}
              className="kml-button bg-white text-kml-dark-gray hover:bg-kml-gray flex items-center gap-2 mx-auto"
            >
              <FileX size={16} />
              <span>Remove file</span>
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="bg-kml-blue/10 rounded-full h-16 w-16 flex items-center justify-center mb-4 mx-auto animate-bounce-subtle">
              <Upload size={28} className="text-kml-blue" />
            </div>
            <h3 className="text-lg font-medium text-kml-dark-gray mb-2">Upload your KML file</h3>
            <p className="text-sm text-kml-dark-gray/70 mb-6">
              Drag and drop your KML file here, or click the button below to browse
            </p>
            <button
              type="button"
              onClick={handleButtonClick}
              className="kml-button bg-kml-blue text-white hover:bg-blue-500 shadow-sm"
            >
              Browse Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
