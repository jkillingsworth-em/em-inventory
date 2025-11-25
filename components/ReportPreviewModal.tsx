
import React from 'react';
import { ReportDataItem } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';

// This is to inform TypeScript about the jspdf library being available on the window object from the CDN
declare global {
    interface Window {
        jspdf: any;
    }
}

interface ReportPreviewModalProps {
    reportData: ReportDataItem[];
    onClose: () => void;
}

const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({ reportData, onClose }) => {

    const handleExportCSV = () => {
        const headers = ['ID', 'Description', 'Category', 'Sub-Category', 'Location', 'Sub-Location', 'Quantity', 'Source', 'PO Number', 'Date Received'];
        const rows = reportData.map(item => [
            `"${String(item.id).replace(/"/g, '""')}"`,
            `"${String(item.description).replace(/"/g, '""')}"`,
            `"${String(item.category || '').replace(/"/g, '""')}"`,
            `"${String(item.subCategory || '').replace(/"/g, '""')}"`,
            `"${String(item.locationName).replace(/"/g, '""')}"`,
            `"${String(item.subLocationDetail || '').replace(/"/g, '""')}"`,
            item.quantity,
            `"${String(item.source).replace(/"/g, '""')}"`,
            `"${String(item.poNumber || '').replace(/"/g, '""')}"`,
            `"${String(item.dateReceived || '').replace(/"/g, '""')}"`
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        // Add BOM for UTF-8 to fix Excel SYLK error
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'inventory_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleExportPDF = () => {
        const doc = new window.jspdf.jsPDF();
        doc.text("Inventory Report", 14, 16);
        
        const tableColumn = ['ID', 'Description', 'Category', 'Location', 'Qty', 'Source', 'PO #'];
        const tableRows: (string|number)[][] = [];

        reportData.forEach(item => {
            const rowData = [
                item.id,
                item.description,
                item.category || '',
                `${item.locationName}${item.subLocationDetail ? ' - ' + item.subLocationDetail : ''}`,
                item.quantity,
                item.source,
                item.poNumber || '',
            ];
            tableRows.push(rowData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'striped',
            headStyles: { fillColor: [10, 30, 58] }, // em-dark-blue
            styles: { fontSize: 8 },
        });

        doc.save('inventory_report.pdf');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-full flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">Report Preview</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {reportData.map((item, index) => (
                                    // FIX: Changed key to use `item.id` and `item.locationName` instead of `item.itemId` and `item.locationId`
                                    // which do not exist on the ReportDataItem type.
                                    <tr key={`${item.id}-${item.locationName}-${index}`}>
                                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{item.id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{item.description}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{item.category || ''}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                            {item.locationName}
                                            {item.subLocationDetail && <span className="text-gray-500"> - {item.subLocationDetail}</span>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-800 font-semibold">{item.quantity}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{item.source}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                            {item.source === 'PO' ? `${item.poNumber || ''} (${item.dateReceived || ''})` : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
                    <button type="button" onClick={handleExportCSV} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2"/>
                        Export CSV
                    </button>
                    <button type="button" onClick={handleExportPDF} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-em-red">
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2"/>
                        Export PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportPreviewModal;