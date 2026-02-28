"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, X } from "lucide-react";
import Image from "next/image";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  preview: string | null;
}

export default function UploadZone({ onFileSelect, preview }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden group">
        <div className="aspect-video relative bg-gray-100">
          <Image
            src={preview}
            alt="Room preview"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
            <button
              type="button"
              onClick={() => onFileSelect(new File([], ""))}
              className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 rounded-full p-2 shadow-lg transition-all duration-200"
              aria-label="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 px-4 py-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            Image ready
          </span>
          <span className="text-xs text-green-500 ml-auto">
            Click to change
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? "border-brand-500 bg-brand-50"
          : "border-gray-300 hover:border-brand-400 hover:bg-gray-50"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
            isDragActive ? "bg-brand-100" : "bg-gray-100"
          }`}
        >
          <Upload
            className={`w-7 h-7 transition-colors ${
              isDragActive ? "text-brand-500" : "text-gray-400"
            }`}
          />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-800">
            {isDragActive
              ? "Drop your image here"
              : "Drag & drop your room photo"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or{" "}
            <span className="text-brand-600 font-medium">browse to upload</span>
          </p>
        </div>
      </div>
    </div>
  );
}
