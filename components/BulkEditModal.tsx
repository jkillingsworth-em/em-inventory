import React, { useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface BulkEditModalProps {
    onClose: () => void;
    onSaveChanges: (changes: { description?: string; category?: string; subCategory?: string; }) => void;
    selectedItemCount: number;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({ onClose, onSaveChanges, selectedItemCount }) => {
    const [updateDescription, setUpdateDescription] = useState(false);
    const [description, setDescription] = useState('');

    const [updateCategory, setUpdateCategory] = useState(false);
    const [category, setCategory] = useState('');

    const [updateSubCategory, setUpdateSubCategory] = useState(false);
    const [subCategory, setSubCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const changes: { description?: string; category?: string; subCategory?: string; } = {};
        if (updateDescription) changes.description = description;
        if (updateCategory) changes.category = category;
        if (updateSubCategory) changes.subCategory = subCategory;

        if (Object.keys(changes).length === 0) {
            alert('Please select at least one field to update.');
            return;
        }

        onSaveChanges(changes);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-container max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Bulk Edit</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="modal-body">
                        <p className="text-sm text-gray-600 mb-6">Editing <span className="font-bold">{selectedItemCount}</span> selected item(s). Check a box to update the corresponding field for all selected items.</p>

                        <div className="space-y-4">
                            {/* Description */}
                            <div className="p-4 border rounded-md">
                                <div className="flex items-start">
                                    <input id="updateDescription" type="checkbox" checked={updateDescription} onChange={e => setUpdateDescription(e.target.checked)} className="h-5 w-5 text-em-red focus:ring-em-red border-gray-300 rounded mt-1" />
                                    <div className="ml-3 text-sm flex-grow">
                                        <label htmlFor="updateDescription" className="font-medium text-gray-900">Description</label>
                                        <input type="text" disabled={!updateDescription} value={description} onChange={e => setDescription(e.target.value)} className="form-control mt-2 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Category */}
                            <div className="p-4 border rounded-md">
                                <div className="flex items-start">
                                    <input id="updateCategory" type="checkbox" checked={updateCategory} onChange={e => setUpdateCategory(e.target.checked)} className="h-5 w-5 text-em-red focus:ring-em-red border-gray-300 rounded mt-1" />
                                    <div className="ml-3 text-sm flex-grow">
                                        <label htmlFor="updateCategory" className="font-medium text-gray-900">Category</label>
                                        <input type="text" disabled={!updateCategory} value={category} onChange={e => setCategory(e.target.value)} className="form-control mt-2 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sub-Category */}
                            <div className="p-4 border rounded-md">
                                <div className="flex items-start">
                                    <input id="updateSubCategory" type="checkbox" checked={updateSubCategory} onChange={e => setUpdateSubCategory(e.target.checked)} className="h-5 w-5 text-em-red focus:ring-em-red border-gray-300 rounded mt-1" />
                                    <div className="ml-3 text-sm flex-grow">
                                        <label htmlFor="updateSubCategory" className="font-medium text-gray-900">Sub-Category</label>
                                        <input type="text" disabled={!updateSubCategory} value={subCategory} onChange={e => setSubCategory(e.target.value)} className="form-control mt-2 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700">Apply Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkEditModal;