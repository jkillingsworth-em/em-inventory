import React, { useState, useMemo, useEffect } from 'react';
import { Location, Stock, InventoryItem } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface AddItemModalProps {
    onClose: () => void;
    onAddItem: (item: InventoryItem, stockEntries: Omit<Stock, 'itemId'>[], colors?: { category?: string, subCategory?: string }) => void;
    locations: Location[];
    existingItemIds: string[];
    itemToDuplicate?: InventoryItem | null;
    currentCategoryColors: Record<string, string>;
}

interface StockEntry {
    key: number;
    locationId: string;
    quantity: number;
    subLocationDetail: string;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onAddItem, locations, existingItemIds, itemToDuplicate, currentCategoryColors }) => {
    const [id, setId] = useState('');
    const [description, setDescription] = useState(itemToDuplicate?.description || '');
    
    // Category & Color State
    const [category, setCategory] = useState(itemToDuplicate?.category || '');
    const [categoryColor, setCategoryColor] = useState('#000000');
    
    const [subCategory, setSubCategory] = useState(itemToDuplicate?.subCategory || '');
    const [subCategoryColor, setSubCategoryColor] = useState('#000000');

    const [idError, setIdError] = useState('');
    const [source, setSource] = useState<'OH' | 'PO'>('OH');

    const defaultLocationId = locations.length > 0 ? locations[0].id : '';
    const [stockEntries, setStockEntries] = useState<StockEntry[]>([
        { key: Date.now(), locationId: defaultLocationId, quantity: 0, subLocationDetail: '' }
    ]);
    
    const [poNumber, setPoNumber] = useState('');
    const [dateReceived, setDateReceived] = useState('');
    const [inspectionRequired, setInspectionRequired] = useState(false);

    const inspectionLocationId = useMemo(() => locations.find(l => l.name === 'INSPECT')?.id, [locations]);

    // Update color picker if user types a known category
    useEffect(() => {
        if (category && currentCategoryColors[category]) {
            setCategoryColor(currentCategoryColors[category]);
        }
    }, [category, currentCategoryColors]);

    useEffect(() => {
        if (subCategory && currentCategoryColors[subCategory]) {
            setSubCategoryColor(currentCategoryColors[subCategory]);
        }
    }, [subCategory, currentCategoryColors]);

    useEffect(() => {
        if (source === 'PO' && inspectionRequired && inspectionLocationId) {
            // Set all entries to INSPECT and disable them
            setStockEntries(prev => prev.map(entry => ({ ...entry, locationId: inspectionLocationId })));
        }
    }, [source, inspectionRequired, inspectionLocationId]);

    const handleAddStockEntry = () => {
        setStockEntries(prev => [...prev, { key: Date.now(), locationId: defaultLocationId, quantity: 0, subLocationDetail: '' }]);
    };

    const handleRemoveStockEntry = (key: number) => {
        setStockEntries(prev => prev.filter(entry => entry.key !== key));
    };

    const handleStockEntryChange = (key: number, field: keyof Omit<StockEntry, 'key'>, value: string | number) => {
        setStockEntries(prev => prev.map(entry => entry.key === key ? { ...entry, [field]: value } : entry));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (existingItemIds.includes(id.trim())) {
            setIdError('This ID already exists.');
            return;
        }
        if (!id.trim() || !description.trim()) {
            alert('Please fill in Item ID and Description.');
            return;
        }
        if (stockEntries.some(entry => entry.quantity <= 0 || !entry.locationId)) {
            alert('Please ensure every location entry has a valid quantity and location selected.');
            return;
        }
        if(source === 'PO' && (!poNumber.trim() || !dateReceived.trim())){
            alert('Please provide PO# and Date Received for Purchase Orders.');
            return;
        }

        const finalStockEntries: Omit<Stock, 'itemId'>[] = stockEntries.map(entry => {
            const selectedLocation = locations.find(l => l.id === entry.locationId);
            return {
                quantity: entry.quantity,
                locationId: entry.locationId,
                subLocationDetail: selectedLocation?.subLocationPrompt ? entry.subLocationDetail : undefined,
                source,
                poNumber: source === 'PO' ? poNumber : undefined,
                dateReceived: source === 'PO' ? dateReceived : undefined,
            };
        });

        // Collect new colors to save
        const colorsToSave: { category?: string, subCategory?: string } = {};
        if (category.trim()) colorsToSave.category = categoryColor;
        if (subCategory.trim()) colorsToSave.subCategory = subCategoryColor;

        onAddItem(
            { id: id.trim(), description: description.trim(), category: category.trim(), subCategory: subCategory.trim() }, 
            finalStockEntries,
            colorsToSave
        );
    };

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setId(e.target.value);
        if (idError) setIdError('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{itemToDuplicate ? 'Duplicate Item' : 'Add New Item'}</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Item Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="itemId" className="block text-sm font-medium text-gray-700">New Item ID*</label>
                                    <input type="text" id="itemId" value={id} onChange={handleIdChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" required />
                                    {idError && <p className="text-red-500 text-xs mt-1">{idError}</p>}
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description*</label>
                                    <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" required />
                                </div>
                                
                                {/* Category Input with Color Picker */}
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                                    <div className="flex gap-2 items-center mt-1">
                                        <input 
                                            type="text" 
                                            id="category" 
                                            value={category} 
                                            onChange={(e) => setCategory(e.target.value)} 
                                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" 
                                        />
                                        <input 
                                            type="color" 
                                            value={categoryColor}
                                            onChange={(e) => setCategoryColor(e.target.value)}
                                            className="h-9 w-12 p-0 border border-gray-300 rounded-md cursor-pointer"
                                            title="Assign Category Color"
                                        />
                                    </div>
                                </div>

                                {/* Sub-Category Input with Color Picker */}
                                <div>
                                    <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700">Sub-Category</label>
                                    <div className="flex gap-2 items-center mt-1">
                                        <input 
                                            type="text" 
                                            id="subCategory" 
                                            value={subCategory} 
                                            onChange={(e) => setSubCategory(e.target.value)} 
                                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" 
                                        />
                                        <input 
                                            type="color" 
                                            value={subCategoryColor}
                                            onChange={(e) => setSubCategoryColor(e.target.value)}
                                            className="h-9 w-12 p-0 border border-gray-300 rounded-md cursor-pointer"
                                            title="Assign Sub-Category Color"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Source Selection */}
                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Source*</label>
                                <div className="flex items-center space-x-4">
                                    <label><input type="radio" name="source" value="OH" checked={source === 'OH'} onChange={() => setSource('OH')} className="focus:ring-em-red text-em-red" /> On Hand</label>
                                    <label><input type="radio" name="source" value="PO" checked={source === 'PO'} onChange={() => setSource('PO')} className="focus:ring-em-red text-em-red" /> Purchase Order</label>
                                </div>
                            </div>

                            {source === 'PO' && (
                                <div className="p-3 bg-gray-50 rounded-md space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700">PO #*</label>
                                            <input type="text" id="poNumber" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" required={source==='PO'} />
                                        </div>
                                        <div>
                                            <label htmlFor="dateReceived" className="block text-sm font-medium text-gray-700">Date Received*</label>
                                            <input type="date" id="dateReceived" value={dateReceived} onChange={e => setDateReceived(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" required={source==='PO'} />
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="inspectionRequired" type="checkbox" checked={inspectionRequired} onChange={e => setInspectionRequired(e.target.checked)} className="h-4 w-4 text-em-red focus:ring-em-red border-gray-300 rounded" />
                                        <label htmlFor="inspectionRequired" className="ml-2 block text-sm text-gray-900">Inspection Required? (Sets location to INSPECT)</label>
                                    </div>
                                </div>
                            )}

                            {/* Stock Entries */}
                            <div className="border-t pt-4 space-y-4">
                                <h3 className="text-lg font-medium text-gray-800">Initial Stock</h3>
                                {stockEntries.map((entry, index) => {
                                    const selectedLocation = locations.find(l => l.id === entry.locationId);
                                    return (
                                        <div key={entry.key} className="p-3 bg-gray-50 rounded-md grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end">
                                            <div className="sm:col-span-2 md:col-span-1">
                                                <label htmlFor={`location-${entry.key}`} className="block text-sm font-medium text-gray-700">Location*</label>
                                                <select id={`location-${entry.key}`} value={entry.locationId} onChange={e => handleStockEntryChange(entry.key, 'locationId', e.target.value)} disabled={source === 'PO' && inspectionRequired} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-gray-300 focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm rounded-md disabled:bg-gray-200">
                                                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                                </select>
                                            </div>
                                            {selectedLocation?.subLocationPrompt && !(source === 'PO' && inspectionRequired) && (
                                                <div className="sm:col-span-3 md:col-span-1">
                                                    <label htmlFor={`sublocation-${entry.key}`} className="block text-sm font-medium text-gray-700">{selectedLocation.subLocationPrompt}</label>
                                                    <input type="text" id={`sublocation-${entry.key}`} value={entry.subLocationDetail} onChange={e => handleStockEntryChange(entry.key, 'subLocationDetail', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" />
                                                </div>
                                            )}
                                             <div className="sm:col-span-2 md:col-span-1">
                                                <label htmlFor={`quantity-${entry.key}`} className="block text-sm font-medium text-gray-700">Quantity*</label>
                                                <input type="number" id={`quantity-${entry.key}`} min="1" value={entry.quantity === 0 ? '' : entry.quantity} onChange={e => handleStockEntryChange(entry.key, 'quantity', parseInt(e.target.value, 10) || 0)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" required />
                                            </div>
                                            <div className="flex items-center justify-end">
                                                {stockEntries.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveStockEntry(entry.key)} className="text-red-600 hover:text-red-800 p-2">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                <button type="button" onClick={handleAddStockEntry} className="flex items-center text-sm font-medium text-em-red hover:text-red-800">
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    Add Another Location
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-em-red">{itemToDuplicate ? 'Save Duplicate' : 'Add Item'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;