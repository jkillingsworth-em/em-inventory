import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface GenerateReportModalProps {
    onClose: () => void;
    onGenerate: (options: { type: 'all' | 'category' | 'selected', value?: string }) => void;
    items: InventoryItem[];
    selectedItemCount: number;
}

const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ onClose, onGenerate, items, selectedItemCount }) => {
    const [reportType, setReportType] = useState<'all' | 'category' | 'selected'>('all');
    const [selectedCategory, setSelectedCategory] = useState('');

    const categories = useMemo(() => {
        const cats = new Set(items.map(item => item.category || 'Uncategorized'));
        return Array.from(cats).sort();
    }, [items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reportType === 'category' && !selectedCategory) {
            alert('Please select a category.');
            return;
        }
        onGenerate({ type: reportType, value: reportType === 'category' ? selectedCategory : undefined });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Generate Report</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Select the data you want to include in the report. The report will contain detailed stock information for the selected items.</p>

                            <fieldset className="space-y-2">
                                <legend className="text-base font-medium text-gray-900">Report Type</legend>
                                <div className="flex items-center">
                                    <input id="report-all" name="reportType" type="radio" value="all" checked={reportType === 'all'} onChange={() => setReportType('all')} className="h-4 w-4 text-em-red focus:ring-em-red border-gray-300" />
                                    <label htmlFor="report-all" className="ml-3 block text-sm font-medium text-gray-700">All Inventory</label>
                                </div>
                                <div className="flex items-center">
                                    <input id="report-category" name="reportType" type="radio" value="category" checked={reportType === 'category'} onChange={() => setReportType('category')} className="h-4 w-4 text-em-red focus:ring-em-red border-gray-300" />
                                    <label htmlFor="report-category" className="ml-3 block text-sm font-medium text-gray-700">By Category</label>
                                </div>
                                <div className="flex items-center">
                                    <input id="report-selected" name="reportType" type="radio" value="selected" checked={reportType === 'selected'} onChange={() => setReportType('selected')} disabled={selectedItemCount === 0} className="h-4 w-4 text-em-red focus:ring-em-red border-gray-300 disabled:bg-gray-200" />
                                    <label htmlFor="report-selected" className={`ml-3 block text-sm font-medium ${selectedItemCount === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                                        Selected Items ({selectedItemCount})
                                    </label>
                                </div>
                            </fieldset>

                            {reportType === 'category' && (
                                <div>
                                    <label htmlFor="category-select" className="block text-sm font-medium text-gray-700">Category</label>
                                    <select id="category-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-gray-300 focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm rounded-md">
                                        <option value="" disabled>Select a category...</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            )}

                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-em-red">
                            Generate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GenerateReportModal;
