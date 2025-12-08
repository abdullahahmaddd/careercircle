// src/utils/exportService.ts
import api from '@/lib/api';

/**
 * Download a resume as DOCX from the backend.
 * @param resumeId - The ID of the resume to export
 */
export const downloadResumeDOCX = async (resumeId: string): Promise<void> => {
    try {
        const response = await api.get(`/export/docx/${resumeId}`, {
            responseType: 'blob',
        });

        // Create blob URL and trigger download
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const url = window.URL.createObjectURL(blob);

        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'Resume.docx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        // Create download link and click it
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('Failed to download DOCX:', error);
        throw new Error(error.response?.data?.detail || 'Failed to download DOCX resume');
    }
};

/**
 * Download a resume as PDF from the backend.
 * @param resumeId - The ID of the resume to export
 */
export const downloadResumePDF = async (resumeId: string): Promise<void> => {
    try {
        const response = await api.get(`/export/pdf/${resumeId}`, {
            responseType: 'blob',
        });

        // Create blob URL and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'Resume.pdf';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        // Create download link and click it
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('Failed to download PDF:', error);
        throw new Error(error.response?.data?.detail || 'Failed to download PDF resume');
    }
};
