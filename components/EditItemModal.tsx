import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface EditItemModalProps {
    item: InventoryItem;
    onClose: () => void;
    onEditItem: (item: InventoryItem, colors?: { category?: string, subCategory?: string }) => void;
    currentCategoryColors: Record<string, string>;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ item, onClose, onEditItem, currentCategoryColors }) => {
    const [description, setDescription] = useState(item.description);
    const [category, setCategory] = useState(item.category || '');
    const [subCategory, setSubCategory] = useState(item.subCategory || '');
    
    const [categoryColor, setCategoryColor] = useState(
        (item.category && currentCategoryColors[item.category]) || '#000000'
    );
    const [subCategoryColor, setSubCategoryColor] = useState(
        (item.subCategory && currentCategoryColors[item.subCategory]) || '#000000'
    );

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            alert('Description cannot be empty.');
            return;
        }
        
        const colorsToSave: { category?: string, subCategory?: string } = {};
        if (category.trim()) colorsToSave.category = categoryColor;
        if (subCategory.trim()) colorsToSave.subCategory = subCategoryColor;

        onEditItem(
            {
                ...item,
                description: description.trim(),
                category: category.trim(),
                subCategory: subCategory.trim(),
            },
            colorsToSave
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Item</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="itemId" className="block text-sm font-medium text-gray-700">Item ID</label>
                                <input type="text" id="itemId" value={item.id} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm cursor-not-allowed" />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description*</label>
                                <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                                <div className="flex gap-2 items-center mt-1">
                                    <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" />
                                    <input 
                                        type="color" 
                                        value={categoryColor}
                                        onChange={(e) => setCategoryColor(e.target.value)}
                                        className="h-9 w-12 p-0 border border-gray-300 rounded-md cursor-pointer"
                                        title="Assign Category Color"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700">Sub-Category</label>
                                <div className="flex gap-2 items-center mt-1">
                                    <input type="text" id="subCategory" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" />
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
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-em-red">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditItemModal;