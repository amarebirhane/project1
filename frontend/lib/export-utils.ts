import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

/**
 * Generic data export utilities for the Financial Management System
 */

/**
 * Export data to CSV format
 * @param data Array of objects to export
 * @param fileName Name of the file (without extension)
 */
export const exportToCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Export data to Excel (.xlsx) format
 * @param data Array of objects to export
 * @param fileName Name of the file (without extension)
 */
export const exportToExcel = (data: any[], fileName: string) => {
    if (!data || data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Data');

    // Generate buffer and save
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Export data to PDF format
 * @param data Array of objects to export
 * @param fileName Name of the file (without extension)
 * @param title Title to display in the PDF header
 */
export const exportToPDF = (data: any[], fileName: string, title: string) => {
    if (!data || data.length === 0) return;

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Set Brand Styles
    const primaryColor = [0, 170, 0]; // Brand Green (#00AA00)

    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 280, 32);

    // Table logic (Simple manual layout as jspdf-autotable is not in package.json)
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    const headers = Object.keys(data[0]);
    const colWidth = 260 / headers.length;
    let y = 40;

    // Draw Headers
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
        const x = 14 + (i * colWidth);
        doc.text(header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, ' '), x, y);
    });

    y += 6;
    doc.setLineWidth(0.1);
    doc.line(14, y - 2, 280, y - 2);

    // Draw Rows
    doc.setFont('helvetica', 'normal');
    data.forEach((row, rowIndex) => {
        if (y > 185) { // Landscape A4 height is ~210mm
            doc.addPage();
            y = 20;
            // Re-draw headers on new page
            doc.setFont('helvetica', 'bold');
            headers.forEach((header, i) => {
                const x = 14 + (i * colWidth);
                doc.text(header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, ' '), x, y);
            });
            y += 6;
            doc.line(14, y - 2, 280, y - 2);
            doc.setFont('helvetica', 'normal');
        }

        headers.forEach((header, i) => {
            const x = 14 + (i * colWidth);
            const val = row[header];
            const text = val === null || val === undefined ? '' : String(val);
            // Truncate if too long
            const truncated = text.length > 25 ? text.substring(0, 22) + '...' : text;
            doc.text(truncated, x, y);
        });

        y += 7;
        // Zebra striping
        if (rowIndex % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(14, y - 5, 266, 7, 'F');
        }
    });

    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
