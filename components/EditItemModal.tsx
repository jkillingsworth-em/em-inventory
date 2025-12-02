import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, Stock, Location } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface EditItemModalProps {
    item: InventoryItem;
    stock: Stock[];
    locations: Location[];
    onClose: () => void;
    onEditItem: (item: InventoryItem, stock: Stock[], colors?: { category?: string, subCategory?: string }) => void;
    currentCategoryColors: Record<string, string>;
    fieldToFocus?: string | null;
}

type UIStock = Stock & { uiKey: number; isNew?: boolean };

interface PriorUsageEntry {
    key: number;
    year: string;
    usage: string;
}

const ALL_YEARS = [2025, 2024, 2023, 2022, 2021];

const EditItemModal: React.FC<EditItemModalProps> = ({ item, stock, locations, onClose, onEditItem, currentCategoryColors, fieldToFocus }) => {
    // Refs for focusing
    const descriptionRef = useRef<HTMLInputElement>(null);
    const categoryRef = useRef<HTMLInputElement>(null);
    const quantityInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
    
    // Item details state
    const [description, setDescription] = useState(item.description);
    const [category, setCategory] = useState(item.category || '');
    const [subCategory, setSubCategory] = useState(item.subCategory || '');
    
    // Forecasting fields
    const [priorUsage, setPriorUsage] = useState<PriorUsageEntry[]>(
        () => item.priorUsage?.map((u, i) => ({
            key: Date.now() + i,
            year: String(u.year),
            usage: String(u.usage)
        })) || []
    );
    const [lowAlertQuantity, setLowAlertQuantity] = useState(String(item.lowAlertQuantity ?? ''));

    // Color state
    const [categoryColor, setCategoryColor] = useState(
        (item.category && currentCategoryColors[item.category]) || '#000000'
    );
    const [subCategoryColor, setSubCategoryColor] = useState(
        (item.subCategory && currentCategoryColors[item.subCategory]) || '#000000'
    );
    
    // Stock state
    const [localStock, setLocalStock] = useState<UIStock[]>(() => stock.map((s, i) => ({ ...s, uiKey: Date.now() + i })));

    const locationMap = useMemo(() => new Map(locations.map(l => [l.id, l])), [locations]);
    
    const existingLocationIds = useMemo(() => new Set(localStock.map(s => s.locationId)), [localStock]);
    const availableLocations = useMemo(() => locations.filter(l => !existingLocationIds.has(l.id)), [locations, existingLocationIds]);

    const totalQuantity = useMemo(() => localStock.reduce((sum, s) => sum + s.quantity, 0), [localStock]);
    
    const averageUsage = useMemo(() => {
        if (priorUsage.length === 0) return 0;
        const validEntries = priorUsage
            .map(u => parseInt(u.usage, 10))
            .filter(u => !isNaN(u));
        if (validEntries.length === 0) return 0;
        const total = validEntries.reduce((sum, u) => sum + u, 0);
        return total / validEntries.length;
    }, [priorUsage]);

    const etr = useMemo(() => {
        if (averageUsage > 0 && totalQuantity > 0) {
            const monthlyAvg = averageUsage / 12;
            if (monthlyAvg > 0) {
                 return `${(totalQuantity / monthlyAvg).toFixed(1)} MONTHS`;
            }
        }
        return 'N/A';
    }, [totalQuantity, averageUsage]);

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
        // Auto-focus logic
        setTimeout(() => {
            switch (fieldToFocus) {
                case 'description': descriptionRef.current?.focus(); break;
                case 'category': categoryRef.current?.focus(); break;
                case 'quantity':
                    const firstStockLocationId = stock.length > 0 ? stock[0].locationId : null;
                    if (firstStockLocationId) {
                        quantityInputRefs.current.get(firstStockLocationId)?.focus();
                    }
                    break;
                default: break;
            }
        }, 100); // Small delay to ensure modal is rendered
    }, [fieldToFocus, stock]);

    const handleStockChange = (uiKey: number, field: keyof Stock, value: string | number) => {
        setLocalStock(prevStock => 
            prevStock.map(s => s.uiKey === uiKey ? { ...s, [field]: value } : s)
        );
    };

    const handleAddStockEntry = () => {
        setLocalStock(prev => [
            ...prev,
            {
                uiKey: Date.now(),
                itemId: item.id,
                locationId: '',
                quantity: 0,
                subLocationDetail: '',
                source: 'OH',
                isNew: true
            }
        ]);
    };

    const handleRemoveStockEntry = (uiKey: number) => {
        setLocalStock(prev => prev.filter(s => s.uiKey !== uiKey));
    };

    const handleAddUsage = () => {
        if (priorUsage.length < 3) {
            setPriorUsage(prev => [...prev, { key: Date.now(), year: '', usage: '' }]);
        }
    };

    const handleRemoveUsage = (key: number) => {
        setPriorUsage(prev => prev.filter(u => u.key !== key));
    };

    const handleUsageChange = (key: number, field: 'year' | 'usage', value: string) => {
        setPriorUsage(prev => prev.map(u => u.key === key ? { ...u, [field]: value } : u));
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            alert('Description cannot be empty.');
            return;
        }

        const invalidNewEntry = localStock.find(s => s.isNew && (!s.locationId || s.quantity <= 0));
        if (invalidNewEntry) {
            alert('Please select a location and enter a quantity greater than 0 for all new stock entries.');
            return;
        }
        
        const colorsToSave: { category?: string, subCategory?: string } = {};
        if (category.trim()) colorsToSave.category = categoryColor;
        if (subCategory.trim()) colorsToSave.subCategory = subCategoryColor;
        
        const formattedUsage = priorUsage
            .map(u => ({ year: parseInt(u.year, 10), usage: parseInt(u.usage, 10) }))
            .filter(u => !isNaN(u.year) && u.year > 0 && !isNaN(u.usage));

        const lowAlertNum = parseInt(lowAlertQuantity, 10);
        const finalStock = localStock.map(({ uiKey, isNew, ...restOfStock }) => restOfStock);

        onEditItem(
            {
                ...item,
                description: description.trim(),
                category: category.trim(),
                subCategory: subCategory.trim(),
                priorUsage: formattedUsage.length > 0 ? formattedUsage : undefined,
                lowAlertQuantity: !isNaN(lowAlertNum) ? lowAlertNum : undefined
            },
            finalStock,
            colorsToSave
        );
    };

    const alertColorClass = useMemo(() => {
        if (lowAlertQuantity.trim() === '') return '';
        const lowAlertNum = parseInt(lowAlertQuantity, 10);
        if (isNaN(lowAlertNum)) return '';
        return totalQuantity <= lowAlertNum ? 'text-red-600 font-bold' : 'text-green-600';
    }, [lowAlertQuantity, totalQuantity]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-container max-w-2xl overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Edit Item Details</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="itemId">Item ID</label>
                                <input type="text" id="itemId" value={item.id} readOnly className="form-control mt-1 bg-gray-100 cursor-not-allowed" />
                            </div>
                            <div>
                                <label htmlFor="description">Description*</label>
                                <input ref={descriptionRef} type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="form-control mt-1" required />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category">Category</label>
                                    <div className="flex gap-2 items-center mt-1">
                                        <input ref={categoryRef} type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="form-control" />
                                        <input type="color" value={categoryColor} onChange={(e) => setCategoryColor(e.target.value)} className="h-9 w-12 p-0 border border-gray-300 rounded-md cursor-pointer" title="Assign Category Color" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subCategory">Sub-Category</label>
                                    <div className="flex gap-2 items-center mt-1">
                                        <input type="text" id="subCategory" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="form-control" />
                                        <input type="color" value={subCategoryColor} onChange={(e) => setSubCategoryColor(e.target.value)} className="h-9 w-12 p-0 border border-gray-300 rounded-md cursor-pointer" title="Assign Sub-Category Color" />
                                    </div>
                                </div>
                            </div>
                                                        
                            <div className="form-section">
                                <h3>Stock Levels by Location</h3>
                                <div className="mt-2 space-y-3">
                                    {localStock.length > 0 ? localStock.map(s => {
                                        const selectedLocation = locationMap.get(s.locationId);
                                        return (
                                            <div key={s.uiKey} className="info-box grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end">
                                                <div className="sm:col-span-3 md:col-span-1">
                                                    <label htmlFor={`location-${s.uiKey}`}>Location</label>
                                                    {s.isNew ? (
                                                        <select
                                                            id={`location-${s.uiKey}`}
                                                            value={s.locationId}
                                                            onChange={e => handleStockChange(s.uiKey, 'locationId', e.target.value)}
                                                            className="form-control mt-1"
                                                        >
                                                            <option value="" disabled>Select...</option>
                                                            {availableLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                                        </select>
                                                    ) : (
                                                        <div className="form-control mt-1 bg-gray-100 text-gray-500">{selectedLocation?.name || s.locationId}</div>
                                                    )}
                                                </div>

                                                {selectedLocation?.subLocationPrompt && (
                                                    <div className="sm:col-span-2 md:col-span-1">
                                                        <label htmlFor={`sublocation-${s.uiKey}`}>DETAIL</label>
                                                        <input
                                                            type="text"
                                                            id={`sublocation-${s.uiKey}`}
                                                            value={s.subLocationDetail || ''}
                                                            onChange={e => handleStockChange(s.uiKey, 'subLocationDetail', e.target.value)}
                                                            className="form-control mt-1"
                                                            placeholder={selectedLocation.subLocationPrompt}
                                                        />
                                                    </div>
                                                )}

                                                <div className="sm:col-span-2 md:col-span-1">
                                                    <label htmlFor={`quantity-${s.uiKey}`}>Quantity</label>
                                                    <input
                                                        ref={el => { quantityInputRefs.current.set(s.locationId, el); }}
                                                        type="number"
                                                        id={`quantity-${s.uiKey}`}
                                                        min="0"
                                                        value={s.quantity}
                                                        onChange={(e) => handleStockChange(s.uiKey, 'quantity', parseInt(e.target.value, 10) || 0)}
                                                        className="form-control mt-1"
                                                    />
                                                </div>

                                                <div className="flex items-center justify-end">
                                                    <button type="button" onClick={() => handleRemoveStockEntry(s.uiKey)} className="text-red-600 hover:text-red-800 p-2" title="Delete Stock Entry">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    }) : <p className="text-sm text-gray-500 italic text-center py-4">No stock records for this item. Add one below.</p>}

                                     <button
                                        type="button"
                                        onClick={handleAddStockEntry}
                                        disabled={availableLocations.length === 0}
                                        className="flex items-center text-sm font-medium text-em-red hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        Add Stock Location
                                    </button>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Usage & Forecasting</h3>
                                <div className="space-y-3 mt-2">
                                    {priorUsage.map((entry) => {
                                        const selectedYears = new Set(priorUsage.filter(p => p.key !== entry.key).map(p => p.year));
                                        const availableYears = ALL_YEARS.filter(y => !selectedYears.has(String(y)));
                                        return (
                                            <div key={entry.key} className="info-box grid grid-cols-3 gap-3 items-end">
                                                <div>
                                                    <label htmlFor={`usage-year-${entry.key}`}>YEAR</label>
                                                    <select id={`usage-year-${entry.key}`} value={entry.year} onChange={e => handleUsageChange(entry.key, 'year', e.target.value)} className="form-control mt-1">
                                                        <option value="" disabled>SELECT...</option>
                                                        {entry.year && <option value={entry.year}>{entry.year}</option>}
                                                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label htmlFor={`usage-value-${entry.key}`}>USAGE</label>
                                                    <input type="number" id={`usage-value-${entry.key}`} value={entry.usage} onChange={e => handleUsageChange(entry.key, 'usage', e.target.value)} className="form-control mt-1" />
                                                </div>
                                                <div className="text-right">
                                                    <button type="button" onClick={() => handleRemoveUsage(entry.key)} className="text-red-600 hover:text-red-800 p-2" title="Remove Year">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {priorUsage.length < 3 && (
                                        <button type="button" onClick={handleAddUsage} className="flex items-center text-sm font-medium text-em-red hover:text-red-800">
                                            <PlusIcon className="w-4 h-4 mr-1" />
                                            Add Usage Year
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label htmlFor="avgUsage">CALCULATED AVG USAGE</label>
                                        <input type="number" id="avgUsage" value={Math.round(averageUsage) || ''} readOnly className="form-control mt-1 bg-gray-100 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label htmlFor="lowAlertQuantity">LOW ALERT QTY</label>
                                        <input type="number" id="lowAlertQuantity" value={lowAlertQuantity} onChange={(e) => setLowAlertQuantity(e.target.value)} className={`form-control mt-1 ${alertColorClass}`} />
                                    </div>
                                    <div className="info-box text-center !mt-1 md:!mt-auto">
                                        <label>Est. Time Remaining</label>
                                        <p className="text-xl font-bold text-em-dark-blue mt-1">{etr}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-em-red">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditItemModal;