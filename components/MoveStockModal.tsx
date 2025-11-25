
import React, { useState, useMemo } from 'react';
import { InventoryItem, Location, Stock } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface MoveStockModalProps {
    item: InventoryItem;
    locations: Location[];
    stock: Stock[];
    onClose: () => void;
    onMoveStock: (itemId: string, fromLocationId: string, toLocationId: string, quantity: number, toSubLocationDetail?: string) => void;
}

const MoveStockModal: React.FC<MoveStockModalProps> = ({ item, locations, stock, onClose, onMoveStock }) => {
    const [fromLocationId, setFromLocationId] = useState('');
    const [toLocationId, setToLocationId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [toSubLocationDetail, setToSubLocationDetail] = useState('');
    const [error, setError] = useState('');

    const itemStockByLocation = useMemo(() => {
        return stock.filter(s => s.itemId === item.id);
    }, [stock, item.id]);

    const availableFromLocations = useMemo(() => {
        const locationIdsWithStock = new Set(itemStockByLocation.map(s => s.locationId));
        return locations.filter(loc => locationIdsWithStock.has(loc.id));
    }, [locations, itemStockByLocation]);

    const maxQuantity = useMemo(() => {
        const fromStock = itemStockByLocation.find(s => s.locationId === fromLocationId);
        return fromStock ? fromStock.quantity : 0;
    }, [fromLocationId, itemStockByLocation]);

    const selectedToLocation = useMemo(() => locations.find(l => l.id === toLocationId), [locations, toLocationId]);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setQuantity(isNaN(value) ? 0 : value);
        if (error) setError('');
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fromLocationId || !toLocationId) {
            setError('Please select both a "from" and a "to" location.');
            return;
        }
        if (fromLocationId === toLocationId) {
            setError('"From" and "To" locations cannot be the same.');
            return;
        }
        if (quantity <= 0) {
            setError('Quantity must be greater than zero.');
            return;
        }
        if (quantity > maxQuantity) {
            setError(`Cannot move more than available stock (${maxQuantity}).`);
            return;
        }
        onMoveStock(item.id, fromLocationId, toLocationId, quantity, toSubLocationDetail);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Move Stock</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-500">Item ID: <span className="font-medium text-gray-800">{item.id}</span></p>
                            <p className="text-sm text-gray-500">Description: <span className="font-medium text-gray-800">{item.description}</span></p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="fromLocation" className="block text-sm font-medium text-gray-700">From</label>
                                <select id="fromLocation" value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-gray-300 focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm rounded-md">
                                    <option value="" disabled>Select source location...</option>
                                    {availableFromLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="toLocation" className="block text-sm font-medium text-gray-700">To</label>
                                <select id="toLocation" value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-gray-300 focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm rounded-md">
                                    <option value="" disabled>Select destination...</option>
                                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                </select>
                            </div>
                            {selectedToLocation?.subLocationPrompt && (
                                <div>
                                    <label htmlFor="toSubLocation" className="block text-sm font-medium text-gray-700">{selectedToLocation.subLocationPrompt}</label>
                                    <input type="text" id="toSubLocation" value={toSubLocationDetail} onChange={e => setToSubLocationDetail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" />
                                </div>
                            )}
                             <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input type="number" id="quantity" value={quantity} onChange={handleQuantityChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-em-red focus:border-em-red sm:text-sm" min="1" max={maxQuantity} />
                                {fromLocationId && <p className="text-xs text-gray-500 mt-1">Available: {maxQuantity}</p>}
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-em-red">
                            Move Stock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MoveStockModal;
