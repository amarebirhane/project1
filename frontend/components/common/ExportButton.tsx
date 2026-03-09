"use client"

import React from 'react'
import {
    Download,
    FileSpreadsheet,
    FileText,
    FileBox
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils'

interface ExportButtonProps {
    data: any[];
    fileName: string;
    title: string;
    variant?: "default" | "outline" | "secondary" | "ghost";
    size?: "default" | "sm" | "lg";
}

/**
 * Reusable Export Button component with format selection dropdown
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
    data,
    fileName,
    title,
    variant = "outline",
    size = "sm"
}) => {
    const isDisabled = !data || data.length === 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className="gap-2"
                    disabled={isDisabled}
                >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => exportToCSV(data, fileName)}
                    className="gap-2 cursor-pointer"
                >
                    <FileText className="h-4 w-4 text-zinc-500" />
                    <span>CSV (.csv)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => exportToExcel(data, fileName)}
                    className="gap-2 cursor-pointer"
                >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => exportToPDF(data, fileName, title)}
                    className="gap-2 cursor-pointer"
                >
                    <FileBox className="h-4 w-4 text-red-500" />
                    <span>PDF Report (.pdf)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default ExportButton
