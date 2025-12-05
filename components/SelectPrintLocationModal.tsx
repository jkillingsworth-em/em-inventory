import React, { useState, useMemo } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { InventoryItem, Stock, Location, PrintableLabel } from '../types';

interface SelectPrintLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (label: PrintableLabel) => void;
    item: InventoryItem;
    stockLocations: Stock[];
    locations: Location[];
}

const SelectPrintLocationModal: React.FC<SelectPrintLocationModalProps> = ({ isOpen, onClose, onGenerate, item, stockLocations, locations }) => {
    // Generate a unique key for each stock entry to use as a stable identifier for radio buttons
    const stockWithKeys = useMemo(() => stockLocations.map((s, i) => ({ ...s, key: `${s.locationId}-${s.subLocationDetail || ''}-${i}` })), [stockLocations]);
    
    const [selectedStockKey, setSelectedStockKey] = useState<string | null>(stockWithKeys.length > 0 ? stockWithKeys[0].key : null);
    
    const locationMap = useMemo(() => new Map(locations.map(loc => [loc.id, loc.name])), [locations]);

    const handleGenerate = () => {
        if (!selectedStockKey) {
            alert("Please select a location.");
            return;
        }
        const selectedStock = stockWithKeys.find(s => s.key === selectedStockKey);
        if (selectedStock) {
            const label: PrintableLabel = {
                itemId: item.id,
                description: item.description,
                locationName: locationMap.get(selectedStock.locationId) || 'UNKNOWN',
                subLocationDetail: selectedStock.subLocationDetail,
            };
            onGenerate(label);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-container max-w-md">
                <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                    <div className="modal-header">
                        <h2>Select Location to Print</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-4">
                            <p className="text-sm text-gray-500">ITEM: <span className="font-medium text-gray-800">{item.id} - {item.description}</span></p>
                        </div>
                        <fieldset className="space-y-2">
                            <legend className="text-base font-medium text-gray-900 mb-2">AVAILABLE LOCATIONS</legend>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {stockWithKeys.map((s) => (
                                    <label key={s.key} htmlFor={s.key} className="flex items-center p-3 rounded-md border has-[:checked]:bg-red-50 has-[:checked]:border-em-red transition-all cursor-pointer">
                                        <input 
                                            id={s.key} 
                                            name="locationSelection" 
                                            type="radio" 
                                            value={s.key}
                                            checked={selectedStockKey === s.key} 
                                            onChange={(e) => setSelectedStockKey(e.target.value)} 
                                            className="h-4 w-4 text-em-red focus:ring-em-red border-gray-300" 
                                        />
                                        <span className="ml-3 flex-grow">
                                            <span className="block font-semibold text-gray-800">{locationMap.get(s.locationId) || s.locationId}</span>
                                            {s.subLocationDetail && <span className="block text-sm text-gray-500">{s.subLocationDetail}</span>}
                                        </span>
                                         <span className="font-bold text-lg text-em-dark-blue">{s.quantity}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            CANCEL
                        </button>
                        <button type="submit" disabled={!selectedStockKey} className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:bg-gray-400">
                            GENERATE LABEL
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SelectPrintLocationModal;