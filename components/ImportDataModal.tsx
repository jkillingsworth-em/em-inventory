import React, { useState } from 'react';
import { InventoryItem, Location, Stock } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface ImportDataModalProps {
    onClose: () => void;
    onImport: (items: InventoryItem[], stock: Stock[], locations: Omit<Location, 'id'>[]) => void;
}

const parseCsvLine = (line: string): string[] => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { // Escaped quote ("")
                current += '"';
                i++; // Skip the next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
};

const ImportDataModal: React.FC<ImportDataModalProps> = ({ onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleImport = () => {
        if (!file) {
            setError('Please select a file to import.');
            return;
        }
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const { items, stock, locations } = parseCSV(text);
                onImport(items, stock, locations);
            } catch (err: any) {
                setError(err.message || 'Failed to parse CSV file.');
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
            setError('Error reading file.');
            setIsProcessing(false);
        };
        reader.readAsText(file);
    };

    const parseCSV = (csvText: string): { items: InventoryItem[], stock: Stock[], locations: Omit<Location, 'id'>[] } => {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error("CSV file must have a header and at least one data row.");
        
        const header = parseCsvLine(lines[0]).map(h => h.trim().toUpperCase());
        const requiredHeaders = ['ID', 'DESCRIPTION', 'LOCATION', 'QTY'];
        if (!requiredHeaders.every(h => header.includes(h))) {
            throw new Error(`CSV header must contain: ${requiredHeaders.join(', ')}`);
        }
        
        const h = {
            id: header.indexOf('ID'),
            desc: header.indexOf('DESCRIPTION'),
            loc: header.indexOf('LOCATION'),
            qty: header.indexOf('QTY'),
            subLoc: header.indexOf('SUB_LOCATION'),
            source: header.indexOf('SOURCE'),
            poNum: header.indexOf('PO_NUMBER'),
            dateRcvd: header.indexOf('DATE_RECEIVED'),
            category: header.indexOf('CATEGORY'),
            subCategory: header.indexOf('SUB_CATEGORY'),
            fy2023: header.indexOf('FY2023'),
            fy2024: header.indexOf('FY2024'),
            fy2025: header.indexOf('FY2025'),
            threeYearAvg: header.indexOf('3_YR_AVG'),
        };

        const itemsMap = new Map<string, InventoryItem>();
        const locationsSet = new Set<string>();
        const stockList: Stock[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCsvLine(lines[i]);
            const id = values[h.id]?.trim();
            const description = values[h.desc]?.trim();
            const locationName = values[h.loc]?.trim();
            const quantity = parseInt(values[h.qty]?.trim(), 10);

            if (!id || !description || !locationName || isNaN(quantity)) {
                console.warn(`Skipping invalid row ${i + 1}: ${lines[i]}`);
                continue;
            }
            
            if (!itemsMap.has(id)) {
                const category = h.category > -1 ? values[h.category]?.trim() : undefined;
                const subCategory = h.subCategory > -1 ? values[h.subCategory]?.trim() : undefined;
                const fy2023 = h.fy2023 > -1 ? parseInt(values[h.fy2023]?.trim(), 10) : undefined;
                const fy2024 = h.fy2024 > -1 ? parseInt(values[h.fy2024]?.trim(), 10) : undefined;
                const fy2025 = h.fy2025 > -1 ? parseInt(values[h.fy2025]?.trim(), 10) : undefined;
                const threeYearAvg = h.threeYearAvg > -1 ? parseInt(values[h.threeYearAvg]?.trim(), 10) : undefined;
                
                itemsMap.set(id, { 
                    id, 
                    description, 
                    category, 
                    subCategory, 
                    fy2023,
                    fy2024,
                    fy2025,
                    threeYearAvg
                });
            }
            
            locationsSet.add(locationName);

            const source = values[h.source]?.trim().toUpperCase() === 'PO' ? 'PO' : 'OH';

            stockList.push({
                itemId: id,
                locationId: locationName, // Temp store name, map to ID later
                quantity,
                subLocationDetail: h.subLoc > -1 ? values[h.subLoc]?.trim() : undefined,
                source,
                poNumber: source === 'PO' && h.poNum > -1 ? values[h.poNum]?.trim() : undefined,
                dateReceived: source === 'PO' && h.dateRcvd > -1 ? values[h.dateRcvd]?.trim() : undefined,
            });
        }
        
        const items = Array.from(itemsMap.values());
        const locations = Array.from(locationsSet).map(name => ({ name }));
        
        return { items, stock: stockList, locations };
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-container max-w-lg">
                <div className="modal-header">
                    <h2>Import from CSV</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>Select a CSV file to import inventory data. The data will be added to your existing inventory.</p>
                        <p><strong>Required columns:</strong> <code className="bg-gray-200 text-gray-800 px-1 rounded">ID</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">DESCRIPTION</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">LOCATION</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">QTY</code>.</p>
                        <p><strong>Optional columns:</strong> <code className="bg-gray-200 text-gray-800 px-1 rounded">CATEGORY</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">SUB_CATEGORY</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">FY2023</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">FY2024</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">FY2025</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">3_YR_AVG</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">SUB_LOCATION</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">SOURCE</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">PO_NUMBER</code>, <code className="bg-gray-200 text-gray-800 px-1 rounded">DATE_RECEIVED</code>.</p>
                    </div>
                    <div className="mt-6">
                        <label htmlFor="file-upload">CSV File</label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-em-red file:text-white hover:file:bg-red-700"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || isProcessing}
                        className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Import Data'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportDataModal;