"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Check, Building2 } from "lucide-react";

interface QuotationVendor {
    vendorNo: number;
    vendorName: string;
    isSelected: boolean;
    file: File | null;
    fileName: string;
}

interface QuotationUploadProps {
    quotations: QuotationVendor[];
    onChange: (quotations: QuotationVendor[]) => void;
}

export function QuotationUpload({ quotations, onChange }: QuotationUploadProps) {
    const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
    const [dragOverVendor, setDragOverVendor] = useState<number | null>(null);

    const handleVendorNameChange = (vendorNo: number, name: string) => {
        const updated = quotations.map(q =>
            q.vendorNo === vendorNo ? { ...q, vendorName: name } : q
        );
        onChange(updated);
    };

    const handleFileChange = (vendorNo: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        processFile(vendorNo, file);
    };

    const processFile = (vendorNo: number, file: File) => {
        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
            alert('ไฟล์ที่อนุญาต: PDF, Word, Excel, รูปภาพ (JPG, PNG)');
            return;
        }

        const updated = quotations.map(q =>
            q.vendorNo === vendorNo
                ? { ...q, file, fileName: file.name }
                : q
        );
        onChange(updated);
    };

    const handleRemoveFile = (vendorNo: number) => {
        const updated = quotations.map(q =>
            q.vendorNo === vendorNo
                ? { ...q, file: null, fileName: "" }
                : q
        );
        onChange(updated);

        // Clear the file input
        const inputRef = fileInputRefs[vendorNo - 1];
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const triggerFileInput = (vendorNo: number) => {
        fileInputRefs[vendorNo - 1].current?.click();
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent, vendorNo: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverVendor(vendorNo);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverVendor(null);
    };

    const handleDrop = (e: React.DragEvent, vendorNo: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverVendor(null);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(vendorNo, files[0]);
        }
    };

    return (
        <div className="space-y-4">
            {quotations.map((q, index) => (
                <div
                    key={q.vendorNo}
                    className={`p-4 rounded-xl border-2 transition-all ${q.isSelected
                        ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                >
                    {/* Vendor Header */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${q.isSelected
                            ? "bg-gradient-to-br from-emerald-500 to-green-600"
                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                            }`}>
                            {q.vendorNo}
                        </div>
                        <div className="flex-1">
                            <span className="font-semibold text-gray-800">
                                บริษัทที่ {q.vendorNo}
                            </span>
                            {q.isSelected ? (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                    <Check className="w-3 h-3" />
                                    เจ้าที่ซื้อ
                                </span>
                            ) : (
                                <span className="ml-2 text-sm text-gray-500">
                                    (คู่เทียบ)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Vendor Name Input */}
                    <div className="mb-3">
                        <label className="form-label text-sm gap-1.5 mb-1" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span>ชื่อบริษัท</span>
                        </label>
                        <input
                            type="text"
                            value={q.vendorName}
                            onChange={(e) => handleVendorNameChange(q.vendorNo, e.target.value)}
                            placeholder="กรอกชื่อบริษัทผู้เสนอราคา"
                            className="form-input"
                        />
                    </div>

                    {/* File Upload with Drag & Drop */}
                    <div>
                        <label className="form-label text-sm">เอกสารใบเสนอราคา</label>
                        <input
                            type="file"
                            ref={fileInputRefs[index]}
                            onChange={(e) => handleFileChange(q.vendorNo, e)}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            className="hidden"
                        />

                        {q.fileName ? (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <span className="flex-1 text-sm text-gray-700 truncate">
                                    {q.fileName}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(q.vendorNo)}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => handleDragOver(e, q.vendorNo)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, q.vendorNo)}
                                onClick={() => triggerFileInput(q.vendorNo)}
                                className={`w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragOverVendor === q.vendorNo
                                        ? "border-blue-500 bg-blue-50 scale-[1.02]"
                                        : "border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-500"
                                    }`}
                            >
                                <Upload className={`w-8 h-8 ${dragOverVendor === q.vendorNo ? "text-blue-500 animate-bounce" : ""}`} />
                                <div className="text-center">
                                    <span className="font-medium">
                                        {dragOverVendor === q.vendorNo ? "ปล่อยไฟล์ที่นี่" : "ลากไฟล์มาวางที่นี่"}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">
                                        หรือคลิกเพื่อเลือกไฟล์ (PDF, Word, Excel, รูปภาพ)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Default quotation state
export const defaultQuotations: QuotationVendor[] = [
    { vendorNo: 1, vendorName: "", isSelected: true, file: null, fileName: "" },
    { vendorNo: 2, vendorName: "", isSelected: false, file: null, fileName: "" },
    { vendorNo: 3, vendorName: "", isSelected: false, file: null, fileName: "" },
];

export type { QuotationVendor };

