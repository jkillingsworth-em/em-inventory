import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { Location } from '../types';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: { category: string; location: string }) => void;
    onClear: () => void;
    locations: Location[];
    categoryHierarchy: Record<string, Set<string>>;
    currentCategory: string;
    currentLocation: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen, onClose, onApply, onClear, locations, categoryHierarchy, currentCategory, currentLocation
}) => {
    const [tempCategory, setTempCategory] = useState(currentCategory);
    const [tempLocation, setTempLocation] = useState(currentLocation);

    useEffect(() => {
        setTempCategory(currentCategory);
        setTempLocation(currentLocation);
    }, [isOpen, currentCategory, currentLocation]);

    if (!isOpen) return null;

    const handleApply = () => {
        onApply({ category: tempCategory, location: tempLocation });
        onClose();
    };

    const handleClear = () => {
        setTempCategory('');
        setTempLocation('');
        onClear();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 animate-fade-in-down" onClick={onClose}>
            <div 
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>FILTERS</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="modal-body overflow-y-auto flex-grow">
                    <div className="space-y-6">
                        {/* Category Filter */}
                        <div>
                            <label className="text-lg font-bold text-gray-800 mb-2">CATEGORY</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                                <button onClick={() => setTempCategory('')} className={`filter-option ${tempCategory === '' ? 'active' : ''}`}>ALL CATEGORIES</button>
                                {Object.keys(categoryHierarchy).sort().map(cat => (
                                    <div key={cat}>
                                        <button onClick={() => setTempCategory(cat)} className={`filter-option ${tempCategory === cat ? 'active' : ''}`}>{cat}</button>
                                        {Array.from(categoryHierarchy[cat]).sort().map(sub => (
                                            <button key={`${cat}|${sub}`} onClick={() => setTempCategory(`${cat}|${sub}`)} className={`filter-option sub-option ${tempCategory === `${cat}|${sub}` ? 'active' : ''}`}>
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Location Filter */}
                        <div>
                            <label className="text-lg font-bold text-gray-800 mb-2">LOCATION</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                                <button onClick={() => setTempLocation('')} className={`filter-option ${tempLocation === '' ? 'active' : ''}`}>ALL LOCATIONS</button>
                                {locations.map(loc => (
                                    <button key={loc.id} onClick={() => setTempLocation(loc.id)} className={`filter-option ${tempLocation === loc.id ? 'active' : ''}`}>{loc.name}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer justify-between">
                     <button type="button" onClick={handleClear} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                        CLEAR ALL
                    </button>
                    <button type="button" onClick={handleApply} className="px-6 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700">
                        APPLY FILTERS
                    </button>
                </div>
            </div>
             <style>{`
                .filter-option {
                    display: block;
                    width: 100%;
                    text-align: left;
                    padding: 0.75rem 1rem;
                    border-radius: 0.375rem;
                    font-weight: 500;
                    transition: background-color 0.2s, color 0.2s;
                }
                .filter-option:hover {
                    background-color: #f3f4f6; /* bg-gray-100 */
                }
                .filter-option.active {
                    background-color: var(--em-red);
                    color: white;
                }
                .filter-option.sub-option {
                    padding-left: 2rem;
                    font-weight: 400;
                }
            `}</style>
        </div>
    );
};

export default FilterModal;