import React, { useState, useMemo } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { InventoryItem, Stock, Location, PrintableLabel } from '../types';

interface GenerateBarcodeSheetModalProps {
    onClose: () => void;
    onGenerate: (labels: PrintableLabel[]) => void;
    items: InventoryItem[];
    stock: Stock[];
    locations: Location[];
    selectedItemIds: Set<string>;
}

type PrintType = 'selected' | 'category' | 'location';

const GenerateBarcodeSheetModal: React.FC<GenerateBarcodeSheetModalProps> = ({ onClose, onGenerate, items, stock, locations, selectedItemIds }) => {
    const [printType, setPrintType] = useState<PrintType>('selected');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    const categories = useMemo(() => {
        const cats = new Set(items.map(item => item.category || 'Uncategorized'));
        return Array.from(cats).sort();
    }, [items]);

    const handleGenerate = () => {
        let labels: PrintableLabel[] = [];
        const itemsToProcess: InventoryItem[] = [];

        switch (printType) {
            case 'selected':
                if (selectedItemIds.size === 0) {
                    alert('No items are selected. Please select items from the table first.');
                    return;
                }
                items.forEach(item => {
                    if (selectedItemIds.has(item.id)) {
                        itemsToProcess.push(item);
                    }
                });
                break;
            case 'category':
                if (!selectedCategory) {
                    alert('Please select a category.');
                    return;
                }
                items.forEach(item => {
                    if ((item.category || 'Uncategorized') === selectedCategory) {
                        itemsToProcess.push(item);
                    }
                });
                break;
            case 'location':
                if (!selectedLocation) {
                    alert('Please select a location.');
                    return;
                }
                const itemIdsInLocation = new Set(stock.filter(s => s.locationId === selectedLocation).map(s => s.itemId));
                items.forEach(item => {
                    if (itemIdsInLocation.has(item.id)) {
                        itemsToProcess.push(item);
                    }
                });
                break;
        }

        itemsToProcess.forEach(item => {
            const itemStock = stock.filter(s => {
                const isInLocation = printType === 'location' ? s.locationId === selectedLocation : true;
                return s.itemId === item.id && isInLocation;
            });

            if (itemStock.length > 0) {
                itemStock.forEach(s => {
                    const location = locations.find(l => l.id === s.locationId);
                    labels.push({
                        itemId: item.id,
                        description: item.description,
                        locationName: location ? location.name : 'UNKNOWN',
                        subLocationDetail: s.subLocationDetail,
                    });
                });
            } else if (printType !== 'location') {
                 labels.push({
                    itemId: item.id,
                    description: item.description,
                    locationName: 'NO STOCK',
                });
            }
        });

        onGenerate(labels);
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-container max-w-lg">
                <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                    <div className="modal-header">
                        <h2>Generate Barcode Sheet</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">CHOOSE WHICH ITEMS TO GENERATE BARCODE LABELS FOR.</p>
                            <fieldset className="space-y-2">
                                <legend className="text-base font-medium text-gray-900">PRINT FOR</legend>
                                <div className="flex items-center">
                                    <input id="print-selected" name="printType" type="radio" value="selected" checked={printType === 'selected'} onChange={() => setPrintType('selected')} disabled={selectedItemIds.size === 0} className="h-4 w-4 text-em-red focus:ring-em-red border-gray-300 disabled:bg-gray-200" />
                                    <label htmlFor="print-selected" className={`ml-3 ${selectedItemIds.size === 0 ? 'text-gray-400' : ''}`}>
                                        SELECTED ITEMS ({selectedItemIds.size})
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input id="print-category" name="printType" type="radio" value="category" checked={printType === 'category'} onChange={() => setPrintType('category')} className="h-4 w-4 text-em-red focus:ring-em-red border-gray-300" />
                                    <label htmlFor="print-category" className="ml-3">A CATEGORY</label>
                                </div>
                                 <div className="flex items-center">
                                    <input id="print-location" name="printType" type="radio" value="location" checked={printType === 'location'} onChange={() => setPrintType('location')} className="h-4 w-4 text-em-red focus:ring-em-red border-gray-300" />
                                    <label htmlFor="print-location" className="ml-3">A LOCATION</label>
                                </div>
                            </fieldset>

                             {printType === 'category' && (
                                <div>
                                    <label htmlFor="category-select">CATEGORY</label>
                                    <select id="category-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="form-control mt-1">
                                        <option value="" disabled>SELECT A CATEGORY...</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            )}

                             {printType === 'location' && (
                                <div>
                                    <label htmlFor="location-select">LOCATION</label>
                                    <select id="location-select" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="form-control mt-1">
                                        <option value="" disabled>SELECT A LOCATION...</option>
                                        {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            CANCEL
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700">
                            GENERATE
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GenerateBarcodeSheetModal;