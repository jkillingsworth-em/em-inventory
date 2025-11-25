import React, { useState, useMemo } from 'react';
import { InventoryItem, Location, Stock } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ArrowRightLeftIcon } from './icons/ArrowRightLeftIcon';
import { DocumentChartBarIcon } from './icons/DocumentChartBarIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { SortIcon } from './icons/SortIcon';

interface InventoryTableProps {
    items: InventoryItem[];
    locations: Location[];
    stock: Stock[];
    onMoveClick: (item: InventoryItem) => void;
    onDeleteClick: (itemId: string) => void;
    onDuplicateClick: (item: InventoryItem) => void;
    onEditClick: (item: InventoryItem) => void;
    selectedItemIds: Set<string>;
    onSelectionChange: (itemId: string) => void;
    onSelectAll: (itemIds: string[], select: boolean) => void;
    onGenerateReportForItem: (itemId: string) => void;
    categoryColors: Record<string, string>;
    onBulkEditClick: () => void;
    locationView: string;
}

type SortKey = 'id' | 'description' | 'category' | 'quantityInView';
type SortDirection = 'asc' | 'desc';

const InventoryTable: React.FC<InventoryTableProps> = ({ 
    items, locations, stock, onMoveClick, onDeleteClick, onDuplicateClick, onEditClick,
    selectedItemIds, onSelectionChange, onSelectAll, onGenerateReportForItem, categoryColors,
    onBulkEditClick, locationView
}) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isGrouped, setIsGrouped] = useState(false);
    
    // Sort State
    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLocation, setFilterLocation] = useState(''); // This is the dropdown, not the tab

    const toggleRowExpansion = (itemId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) newSet.delete(itemId);
            else newSet.add(itemId);
            return newSet;
        });
    };
    
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const getItemColor = (item: InventoryItem) => {
        if (item.subCategory && categoryColors[item.subCategory]) return categoryColors[item.subCategory];
        if (item.category && categoryColors[item.category]) return categoryColors[item.category];
        return undefined;
    };

    const mappedItems = useMemo(() => {
        const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));
        return items.map(item => {
            const allItemStock = stock.filter(s => s.itemId === item.id);
            
            const stockInView = locationView === 'all'
                ? allItemStock
                : allItemStock.filter(s => s.locationId === locationView);

            const quantityInView = stockInView.reduce((sum, s) => sum + s.quantity, 0);

            const locationsWithStock = allItemStock
                .map(s => ({...s, locationName: locationMap.get(s.locationId) || 'Unknown Location'}))
                .sort((a,b) => a.locationName.localeCompare(b.locationName));
            
            const stockTooltip = locationsWithStock.length > 0 ? locationsWithStock.map(ls => `${ls.locationName}: ${ls.quantity}`).join(', ') : 'No Stock';
            
            return { 
                ...item, 
                quantityInView, 
                locationsWithStock, 
                category: item.category || 'Uncategorized', 
                stockTooltip, 
                accentColor: getItemColor(item) 
            };
        });
    }, [items, locations, stock, categoryColors, locationView]);

    const filteredItems = useMemo(() => {
        let result = mappedItems;

        if (locationView !== 'all') {
            result = result.filter(item => item.quantityInView > 0);
        }

        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(item => item.id.toLowerCase().includes(lower) || item.description.toLowerCase().includes(lower) || item.category.toLowerCase().includes(lower) || (item.subCategory && item.subCategory.toLowerCase().includes(lower)));
        }
        if (filterCategory) result = result.filter(item => item.category === filterCategory);
        if (filterLocation) result = result.filter(item => item.locationsWithStock.some(l => l.locationId === filterLocation));
        return result;
    }, [mappedItems, searchQuery, filterCategory, filterLocation, locationView]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];
            if (typeof aValue === 'string' && typeof bValue === 'string') return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            if (typeof aValue === 'number' && typeof bValue === 'number') return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            const stringA = String(aValue); const stringB = String(bValue);
            return sortDirection === 'asc' ? stringA.localeCompare(stringB) : stringB.localeCompare(stringA);
        });
    }, [filteredItems, sortKey, sortDirection]);

    const displayData = useMemo(() => {
        if (isGrouped) {
            return sortedItems.reduce((acc, item) => {
                const key = item.category;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {} as Record<string, typeof sortedItems>);
        }
        return sortedItems;
    }, [sortedItems, isGrouped]);

    const uniqueCategories = useMemo(() => Array.from(new Set(items.map(i => i.category || 'Uncategorized'))).sort(), [items]);

    const renderActionButtons = (item: any) => (
        <div className="flex items-center space-x-1">
            <button onClick={() => onGenerateReportForItem(item.id)} className="btn-icon text-green-600 hover:text-green-800" title="Report"><DocumentChartBarIcon className="w-5 h-5" /></button>
            <button onClick={() => onDuplicateClick(item)} className="btn-icon text-purple-600 hover:text-purple-800" title="Duplicate"><DocumentDuplicateIcon className="w-5 h-5" /></button>
            <button onClick={() => onEditClick(item)} className="btn-icon text-yellow-600 hover:text-yellow-800" title="Edit"><PencilSquareIcon className="w-5 h-5" /></button>
            <button onClick={() => onMoveClick(item)} className="btn-icon text-blue-600 hover:text-blue-800" title="Move"><ArrowRightLeftIcon className="w-5 h-5" /></button>
            <button onClick={() => onDeleteClick(item.id)} className="btn-icon text-red-600 hover:text-red-800" title="Delete"><TrashIcon className="w-5 h-5" /></button>
        </div>
    );

    const renderMobileCard = (item: any) => (
        <div key={item.id} className="mobile-card" title={item.stockTooltip}>
            <div className="mobile-card-header">
                <div className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 border-gray-300 rounded" style={{ accentColor: item.accentColor }} checked={selectedItemIds.has(item.id)} onChange={() => onSelectionChange(item.id)}/>
                    <div>
                        <div className="text-lg font-bold text-gray-900">{item.id}</div>
                        <span className="badge mt-1" style={{ borderColor: item.accentColor, borderWidth: item.accentColor ? '2px' : '0', borderStyle: 'solid' }}>{item.category === 'Uncategorized' ? 'No Category' : item.category}{item.subCategory ? ` / ${item.subCategory}` : ''}</span>
                    </div>
                </div>
                <div className="text-right"><div className="text-2xl font-bold text-gray-900">{item.quantityInView}</div><div className="text-label">Qty</div></div>
            </div>
            <div className="mobile-card-content"><p className="text-gray-700 text-base">{item.description}</p></div>
            {expandedRows.has(item.id) && (
                <div className="bg-gray-50 border-t border-b border-gray-200 px-4 py-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location Details</h4>
                    {item.locationsWithStock.length === 0 ? <p className="text-sm text-gray-500 italic">No stock recorded.</p> : <div className="space-y-2">{item.locationsWithStock.map((locStock: any, idx: number) => (<div key={idx} className="flex justify-between items-center text-sm"><span className="font-medium text-gray-700">{locStock.locationName}{locStock.subLocationDetail && <span className="text-gray-500 font-normal"> - {locStock.subLocationDetail}</span>}</span><span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">{locStock.quantity}</span></div>))}</div>}
                </div>
            )}
            <div className="mobile-card-footer">
                <button onClick={() => toggleRowExpansion(item.id)} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">{expandedRows.has(item.id) ? 'Hide Details' : 'View Details'}{expandedRows.has(item.id) ? <ChevronUpIcon className="ml-1 w-4 h-4"/> : <ChevronDownIcon className="ml-1 w-4 h-4"/>}</button>
                {renderActionButtons(item)}
            </div>
        </div>
    );

    const renderTableRows = (itemsToRender: any[]) => itemsToRender.map((item) => (
        <React.Fragment key={item.id}>
            <tr className="border-b border-gray-200 last:border-0" title={item.stockTooltip}>
                <td className="w-12 text-center"><input type="checkbox" className="h-5 w-5 border-gray-300 rounded cursor-pointer" style={{ accentColor: item.accentColor }} checked={selectedItemIds.has(item.id)} onChange={() => onSelectionChange(item.id)}/></td>
                <td className="w-12 text-center">{item.locationsWithStock.length > 0 && <button onClick={() => toggleRowExpansion(item.id)} className="text-gray-500 hover:text-gray-800 p-1">{expandedRows.has(item.id) ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}</button>}</td>
                <td className="font-bold text-gray-900 text-lg">{item.id}</td>
                <td className="text-gray-700">{item.description}</td>
                <td><span className="badge" style={{ borderColor: item.accentColor, borderWidth: item.accentColor ? '2px' : '0', borderStyle: 'solid' }}>{item.category === 'Uncategorized' ? 'Uncategorized' : item.category}{item.subCategory ? ` / ${item.subCategory}` : ''}</span></td>
                <td className="text-gray-900 font-bold text-lg">{item.quantityInView}</td>
                <td>{renderActionButtons(item)}</td>
            </tr>
            {expandedRows.has(item.id) && (<tr><td colSpan={7} className="p-0 bg-gray-50 border-b border-gray-200 shadow-inner"><div className="px-8 py-4"><h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Stock by Location</h4><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{item.locationsWithStock.map((locStock: any, index: number) => (<div key={index} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm text-sm"><div className="flex justify-between items-center border-b pb-2 mb-2"><span className="text-em-dark-blue font-bold text-base">{locStock.locationName}</span><span className="bg-gray-100 text-gray-900 px-2 py-1 rounded font-bold">Qty: {locStock.quantity}</span></div><div className="space-y-1 text-gray-600">{locStock.subLocationDetail && <p><strong>Detail:</strong> {locStock.subLocationDetail}</p>}<p><strong>Source:</strong> {locStock.source}</p>{locStock.source === 'PO' && (<><p><strong>PO #:</strong> {locStock.poNumber || 'N/A'}</p><p><strong>Date:</strong> {locStock.dateReceived || 'N/A'}</p></>)}</div></div>))}</div></div></td></tr>)}
        </React.Fragment>
    ));

    const SortableHeader = ({ sortValue, title, children }: { sortValue: SortKey, title: string, children: React.ReactNode }) => (
        <th scope="col" title={title}>
            <button onClick={() => handleSort(sortValue)} className="flex items-center gap-2 font-bold uppercase hover:text-em-red transition-colors">
                {children}
                <SortIcon direction={sortKey === sortValue ? sortDirection : undefined} className="w-4 h-4" />
            </button>
        </th>
    );

    const quantityHeaderTitle = locationView === 'all' 
        ? 'Total Qty' 
        : `${locations.find(l => l.id === locationView)?.name || ''} Qty`;

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div><input type="text" className="form-control pl-10" placeholder="Search by ID, Description, or Category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
                    <div className="flex items-center flex-col sm:flex-row gap-4 w-full md:w-auto">
                        {selectedItemIds.size > 0 && <button onClick={onBulkEditClick} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 w-full sm:w-auto">Bulk Edit ({selectedItemIds.size})</button>}
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-control"><option value="">All Categories</option>{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="form-control"><option value="">All Locations</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
                    </div>
                    <div className="flex items-center space-x-3 whitespace-nowrap bg-gray-50 px-3 py-2 rounded-md border border-gray-200"><label htmlFor="group-toggle" className="text-sm font-bold text-gray-700 cursor-pointer">Group Categories</label><div className="relative inline-block w-10 align-middle select-none"><input type="checkbox" name="group-toggle" id="group-toggle" checked={isGrouped} onChange={() => setIsGrouped(!isGrouped)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer shadow-sm transition-all duration-300"/><label htmlFor="group-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300"></label></div><style>{`.toggle-checkbox:checked { right: 0; border-color: #CC0000; }.toggle-checkbox:not(:checked) { right: calc(100% - 1.5rem); border-color: #e5e7eb; }.toggle-checkbox:checked + .toggle-label { background-color: #fca5a5; }`}</style></div>
                </div>
            </div>

            {filteredItems.length === 0 && <div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm border border-gray-200"><MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" /><h3 className="mt-2 text-lg font-medium text-gray-900">No items found</h3><p className="mt-1 text-gray-500">Try adjusting your search or filters.</p></div>}
            
            <div className="md:hidden">
                {(isGrouped ? Object.entries(displayData as Record<string, any[]>).sort(([catA], [catB]) => catA.localeCompare(catB)) : []).map(([category, itemsInCategory]) => (
                    <div key={category} className="mb-6">
                         <div className="bg-gray-100 px-4 py-2 rounded mb-3 text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-em-red">{category}</div>
                        {itemsInCategory.map(renderMobileCard)}
                    </div>
                ))}
                {!isGrouped && (displayData as any[]).map(renderMobileCard)}
            </div>

            <div className="hidden md:block inventory-table-container">
                <table className="min-w-full divide-y divide-gray-200 inventory-table">
                    <thead><tr><th scope="col" className="w-12 text-center"></th><th scope="col" className="w-12 text-center"></th>
                        <SortableHeader sortValue="id" title="Unique identifier for the item (SKU)">Item Code</SortableHeader>
                        <SortableHeader sortValue="description" title="A brief description of the item">Description</SortableHeader>
                        <SortableHeader sortValue="category" title="The primary category and optional sub-category">Categories</SortableHeader>
                        <SortableHeader sortValue="quantityInView" title={`The sum of stock for the current view`}>{quantityHeaderTitle}</SortableHeader>
                        <th scope="col" title="Actions to perform on a single item">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {isGrouped ? Object.entries(displayData as Record<string, any[]>).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, itemsInCategory]) => (
                            <React.Fragment key={category}>
                                <tr className="bg-gray-100"><td colSpan={7} className="px-6 py-3 text-lg font-bold text-gray-800 border-l-4 border-em-red">{category}</td></tr>
                                {renderTableRows(itemsInCategory)}
                            </React.Fragment>
                        )) : renderTableRows(displayData as any[])}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;