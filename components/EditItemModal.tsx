import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, Stock, Location } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface EditItemModalProps {
    item: InventoryItem;
    stock: Stock[];
    locations: Location[];
    onClose: () => void;
    onEditItem: (item: InventoryItem, stock: Stock[], colors?: { category?: string, subCategory?: string }) => void;
    currentCategoryColors: Record<string, string>;
    fieldToFocus?: string | null;
}

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
    const [fy2023, setFy2023] = useState(String(item.fy2023 ?? ''));
    const [fy2024, setFy2024] = useState(String(item.fy2024 ?? ''));
    const [fy2025, setFy2025] = useState(String(item.fy2025 ?? ''));
    const [threeYearAvg, setThreeYearAvg] = useState(item.threeYearAvg || 0);
    const [isThreeYearAvgManual, setIsThreeYearAvgManual] = useState(true);

    // Color state
    const [categoryColor, setCategoryColor] = useState(
        (item.category && currentCategoryColors[item.category]) || '#000000'
    );
    const [subCategoryColor, setSubCategoryColor] = useState(
        (item.subCategory && currentCategoryColors[item.subCategory]) || '#000000'
    );
    
    // Stock state
    const [localStock, setLocalStock] = useState<Stock[]>(stock);

    const locationMap = useMemo(() => new Map(locations.map(l => [l.id, l.name])), [locations]);
    
    const totalQuantity = useMemo(() => localStock.reduce((sum, s) => sum + s.quantity, 0), [localStock]);
    
    const etr = useMemo(() => {
        if (threeYearAvg > 0 && totalQuantity > 0) {
            const monthlyAvg = threeYearAvg / 12;
            if (monthlyAvg > 0) {
                 return `${(totalQuantity / monthlyAvg).toFixed(1)} months`;
            }
        }
        return 'N/A';
    }, [totalQuantity, threeYearAvg]);

    useEffect(() => {
        const fy2023Num = parseInt(fy2023, 10);
        const fy2024Num = parseInt(fy2024, 10);
        const fy2025Num = parseInt(fy2025, 10);

        if (fy2023.trim() !== '' && !isNaN(fy2023Num) &&
            fy2024.trim() !== '' && !isNaN(fy2024Num) &&
            fy2025.trim() !== '' && !isNaN(fy2025Num)) {
            setThreeYearAvg(Math.round((fy2023Num + fy2024Num + fy2025Num) / 3));
            setIsThreeYearAvgManual(false);
        } else {
            setIsThreeYearAvgManual(true);
        }
    }, [fy2023, fy2024, fy2025]);

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

    const handleStockChange = (locationId: string, newQuantityStr: string) => {
        const newQuantity = parseInt(newQuantityStr, 10) || 0;
        setLocalStock(prevStock => 
            prevStock.map(s => s.locationId === locationId ? { ...s, quantity: newQuantity } : s)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            alert('Description cannot be empty.');
            return;
        }
        
        const colorsToSave: { category?: string, subCategory?: string } = {};
        if (category.trim()) colorsToSave.category = categoryColor;
        if (subCategory.trim()) colorsToSave.subCategory = subCategoryColor;

        const fy2023Num = parseInt(fy2023, 10);
        const fy2024Num = parseInt(fy2024, 10);
        const fy2025Num = parseInt(fy2025, 10);

        onEditItem(
            {
                ...item,
                description: description.trim(),
                category: category.trim(),
                subCategory: subCategory.trim(),
                fy2023: !isNaN(fy2023Num) ? fy2023Num : undefined,
                fy2024: !isNaN(fy2024Num) ? fy2024Num : undefined,
                fy2025: !isNaN(fy2025Num) ? fy2025Num : undefined,
                threeYearAvg: threeYearAvg > 0 ? threeYearAvg : undefined
            },
            localStock,
            colorsToSave
        );
    };

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
                                <h3>Usage & Forecasting</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                    <div>
                                        <label htmlFor="fy2023">FY2023 USAGE</label>
                                        <input type="number" id="fy2023" value={fy2023} onChange={(e) => setFy2023(e.target.value)} className="form-control mt-1" />
                                    </div>
                                    <div>
                                        <label htmlFor="fy2024">FY2024 USAGE</label>
                                        <input type="number" id="fy2024" value={fy2024} onChange={(e) => setFy2024(e.target.value)} className="form-control mt-1" />
                                    </div>
                                    <div>
                                        <label htmlFor="fy2025">FY2025 USAGE</label>
                                        <input type="number" id="fy2025" value={fy2025} onChange={(e) => setFy2025(e.target.value)} className="form-control mt-1" />
                                    </div>
                                    <div>
                                        <label htmlFor="threeYearAvg">3-YEAR AVG USAGE</label>
                                        <input type="number" id="threeYearAvg" value={threeYearAvg || ''} onChange={(e) => setThreeYearAvg(parseInt(e.target.value) || 0)} className="form-control mt-1 disabled:bg-gray-200" disabled={!isThreeYearAvgManual} />
                                    </div>
                                </div>
                                <div className="info-box text-center mt-4">
                                    <label>Est. Time Remaining</label>
                                    <p className="text-xl font-bold text-em-dark-blue mt-1">{etr}</p>
                                </div>
                            </div>
                            
                            <div className="form-section">
                                <h3>Stock Levels by Location</h3>
                                <div className="mt-2 space-y-2">
                                    {localStock.length > 0 ? localStock.map(s => (
                                        <div key={s.locationId} className="grid grid-cols-3 gap-4 items-center p-2 bg-gray-50 rounded-md">
                                            <div className="font-medium text-gray-800">{locationMap.get(s.locationId) || s.locationId}</div>
                                            <div className="text-sm text-gray-600">{s.subLocationDetail}</div>
                                            <div>
                                                <input
                                                    ref={el => { quantityInputRefs.current.set(s.locationId, el); }}
                                                    type="number"
                                                    value={s.quantity}
                                                    onChange={(e) => handleStockChange(s.locationId, e.target.value)}
                                                    className="w-full text-right px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 italic">No stock records for this item.</p>}
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