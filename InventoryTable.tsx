



import React, { useState, useMemo } from 'react';
import { InventoryItem, Location, Stock } from './types';
import { TrashIcon } from './components/icons/TrashIcon';
import { ChevronDownIcon } from './components/icons/ChevronDownIcon';
import { ChevronUpIcon } from './components/icons/ChevronUpIcon';
import { ArrowRightLeftIcon } from './components/icons/ArrowRightLeftIcon';
import { DocumentChartBarIcon } from './components/icons/DocumentChartBarIcon';
import { DocumentDuplicateIcon } from './components/icons/DocumentDuplicateIcon';
import { PencilSquareIcon } from './components/icons/PencilSquareIcon';
import { MagnifyingGlassIcon } from './components/icons/MagnifyingGlassIcon';
import { SortIcon } from './components/icons/SortIcon';
import { ExclamationTriangleIcon } from './components/icons/ExclamationTriangleIcon';

interface InventoryTableProps {
    items: InventoryItem[];
    locations: Location[];
    stock: Stock[];
    onMoveClick: (item: InventoryItem) => void;
    onDeleteClick: (itemId: string) => void;
    onDuplicateClick: (item: InventoryItem) => void;
    onEditClick: (item: InventoryItem, field?: string) => void;
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

type MappedItem = InventoryItem & {
    quantityInView: number;
    totalQuantity: number;
    etr: string;
    locationsWithStock: (Stock & { locationName: string })[];
    category: string;
    stockTooltip: string;
    accentColor: string | undefined;
    isLowStock: boolean;
};

const calculateAverageUsage = (priorUsage?: { year: number; usage: number }[]): number => {
    if (!priorUsage || priorUsage.length === 0) {
        return 0;
    }
    const totalUsage = priorUsage.reduce((sum, entry) => sum + entry.usage, 0);
    return totalUsage / priorUsage.length;
};


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

    // Calculate Hierarchy for Filter Dropdown
    const categoryHierarchy = useMemo(() => {
        const hierarchy: Record<string, Set<string>> = {};
        items.forEach(item => {
            const cat = item.category || 'UNCATEGORIZED';
            if (!hierarchy[cat]) hierarchy[cat] = new Set();
            if (item.subCategory) hierarchy[cat].add(item.subCategory);
        });
        return hierarchy;
    }, [items]);

    const mappedItems: MappedItem[] = useMemo(() => {
        const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));
        return items.map(item => {
            const allItemStock = stock.filter(s => s.itemId === item.id);
            const totalQuantity = allItemStock.reduce((sum, s) => sum + s.quantity, 0);
            
            const stockInView = locationView === 'all'
                ? allItemStock
                : allItemStock.filter(s => s.locationId === locationView);

            const quantityInView = stockInView.reduce((sum, s) => sum + s.quantity, 0);

            const locationsWithStock = allItemStock
                .map(s => ({...s, locationName: locationMap.get(s.locationId) || 'UNKNOWN LOCATION'}))
                .sort((a,b) => a.locationName.localeCompare(b.locationName));
            
            // Calculate ETR
            const averageUsage = calculateAverageUsage(item.priorUsage);
            const etr = averageUsage > 0 && totalQuantity > 0
                ? `${((totalQuantity / (averageUsage / 12))).toFixed(1)} MONTHS`
                : 'N/A';
                
            const stockTooltip = locationsWithStock.length > 0 
                ? `TOTAL: ${totalQuantity} | ETR: ${etr} | LOCATIONS: ${locationsWithStock.map(ls => `${ls.locationName}: ${ls.quantity}`).join(', ')}` 
                : `TOTAL: 0 | ETR: ${etr} | NO STOCK`;
            
            const isLowStock = item.lowAlertQuantity !== undefined && totalQuantity <= item.lowAlertQuantity;
            
            return { 
                ...item, 
                quantityInView,
                totalQuantity,
                etr,
                locationsWithStock, 
                category: item.category || 'UNCATEGORIZED', 
                stockTooltip, 
                accentColor: getItemColor(item),
                isLowStock
            };
        });
    }, [items, locations, stock, categoryColors, locationView]);

    const filteredItems = useMemo(() => {
        let result = mappedItems;

        if (locationView !== 'all') {
            result = result.filter(item => item.quantityInView > 0);
        }

        if (searchQuery) {
            const lower = searchQuery.toUpperCase();
            result = result.filter(item => item.id.toUpperCase().includes(lower) || item.description.toUpperCase().includes(lower) || item.category.toUpperCase().includes(lower) || (item.subCategory && item.subCategory.toUpperCase().includes(lower)));
        }

        // Updated Category Filtering Logic to handle "Main|Sub" format
        if (filterCategory) {
            if (filterCategory.includes('|')) {
                const [cat, sub] = filterCategory.split('|');
                result = result.filter(item => (item.category || 'UNCATEGORIZED') === cat && item.subCategory === sub);
            } else {
                result = result.filter(item => (item.category || 'UNCATEGORIZED') === filterCategory);
            }
        }

        if (filterLocation) result = result.filter(item => item.locationsWithStock.some(l => l.locationId === filterLocation));
        return result;
    }, [mappedItems, searchQuery, filterCategory, filterLocation, locationView]);

    const sortedItems = useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            if (sortKey === 'category') {
                const catA = a.category || '';
                const catB = b.category || '';
                const subCatA = a.subCategory || '';
                const subCatB = b.subCategory || '';

                const categoryCompare = catA.localeCompare(catB);
                if (categoryCompare !== 0) {
                    return sortDirection === 'asc' ? categoryCompare : -categoryCompare;
                }
                const subCategoryCompare = subCatA.localeCompare(subCatB);
                return sortDirection === 'asc' ? subCategoryCompare : -subCategoryCompare;
            }

            const aValue = a[sortKey];
            const bValue = b[sortKey];
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            const stringA = String(aValue ?? '');
            const stringB = String(bValue ?? '');
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
            }, {} as Record<string, MappedItem[]>);
        }
        return sortedItems;
    }, [sortedItems, isGrouped]);

    const allVisibleSelected = sortedItems.length > 0 && sortedItems.every(i => selectedItemIds.has(i.id));

    const renderActionButtons = (item: MappedItem) => (
        <div className="flex items-center space-x-1">
            <button onClick={() => onGenerateReportForItem(item.id)} className="btn-icon text-green-600 hover:text-green-800" title="REPORT"><DocumentChartBarIcon className="w-5 h-5" /></button>
            <button onClick={() => onDuplicateClick(item)} className="btn-icon text-purple-600 hover:text-purple-800" title="DUPLICATE"><DocumentDuplicateIcon className="w-5 h-5" /></button>
            <button onClick={() => onEditClick(item)} className="btn-icon text-yellow-600 hover:text-yellow-800" title="EDIT"><PencilSquareIcon className="w-5 h-5" /></button>
            <button onClick={() => onMoveClick(item)} className="btn-icon text-blue-600 hover:text-blue-800" title="MOVE"><ArrowRightLeftIcon className="w-5 h-5" /></button>
            <button onClick={() => onDeleteClick(item.id)} className="btn-icon text-red-600 hover:text-red-800" title="DELETE"><TrashIcon className="w-5 h-5" /></button>
        </div>
    );

    const renderMobileCard = (item: MappedItem) => (
        <div key={item.id} className={`mobile-card ${item.isLowStock ? 'border-red-500 bg-red-50' : ''}`} title={item.stockTooltip}>
            <div className="mobile-card-header">
                <div className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 border-gray-300 rounded" style={{ accentColor: item.accentColor }} checked={selectedItemIds.has(item.id)} onChange={() => onSelectionChange(item.id)}/>
                    <div>
                        <div className={`text-lg font-bold flex items-center gap-2 ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.isLowStock && <span title={`LOW STOCK ALERT: ${item.totalQuantity} <= ${item.lowAlertQuantity}`}><ExclamationTriangleIcon className="w-5 h-5" /></span>}
                            {item.id}
                        </div>
                        <span onClick={() => onEditClick(item, 'category')} className="badge mt-1 cursor-pointer hover:bg-yellow-100" style={{ borderColor: item.accentColor, borderWidth: item.accentColor ? '2px' : '0', borderStyle: 'solid' }}>{item.category === 'UNCATEGORIZED' ? 'NO CATEGORY' : item.category}{item.subCategory ? ` / ${item.subCategory}` : ''}</span>
                    </div>
                </div>
                <div className="text-right" onClick={() => onEditClick(item, 'quantity')}><div className={`text-2xl font-bold cursor-pointer hover:bg-yellow-100 rounded-md p-1 ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{item.quantityInView}</div><div className="text-label">QTY</div></div>
            </div>
            <div className="mobile-card-content" onClick={() => onEditClick(item, 'description')}><p className={`text-base cursor-pointer hover:bg-yellow-100 rounded-md p-1 ${item.isLowStock ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{item.description}</p></div>
            {expandedRows.has(item.id) && (
                <div className="bg-gray-50 border-t border-b border-gray-200 px-4 py-3">
                    <div className="flex justify-between items-baseline mb-2">
                        <h4>LOCATION DETAILS</h4>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ETR</p>
                            <p className="text-sm font-semibold text-em-dark-blue">{item.etr}</p>
                        </div>
                    </div>
                    {item.locationsWithStock.length === 0 ? <p className="text-sm text-gray-500 italic">NO STOCK RECORDED.</p> : <div className="space-y-2">{item.locationsWithStock.map((locStock, idx) => (<div key={idx} className="flex justify-between items-center text-sm"><span className="font-medium text-gray-700">{locStock.locationName}{locStock.subLocationDetail && <span className="text-gray-500 font-normal"> - {locStock.subLocationDetail}</span>}</span><span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">{locStock.quantity}</span></div>))}</div>}
                </div>
            )}
            <div className="mobile-card-footer">
                <button onClick={() => toggleRowExpansion(item.id)} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">{expandedRows.has(item.id) ? 'HIDE DETAILS' : 'VIEW DETAILS'}{expandedRows.has(item.id) ? <ChevronUpIcon className="ml-1 w-4 h-4"/> : <ChevronDownIcon className="ml-1 w-4 h-4"/>}</button>
                {renderActionButtons(item)}
            </div>
        </div>
    );

    const renderTableRows = (itemsToRender: MappedItem[]) => itemsToRender.map((item) => (
        <React.Fragment key={item.id}>
            <tr className={`border-b border-gray-200 last:border-0 ${item.isLowStock ? 'bg-red-50 hover:bg-red-100' : ''}`} title={item.stockTooltip}>
                <td className="w-12 text-center"><input type="checkbox" className="h-5 w-5 border-gray-300 rounded cursor-pointer" style={{ accentColor: item.accentColor }} checked={selectedItemIds.has(item.id)} onChange={() => onSelectionChange(item.id)}/></td>
                <td className="w-12 text-center">{item.locationsWithStock.length > 0 && <button onClick={() => toggleRowExpansion(item.id)} className="text-gray-500 hover:text-gray-800 p-1">{expandedRows.has(item.id) ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}</button>}</td>
                <td className={`font-bold text-lg ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    <div className="flex items-center gap-2">
                        {item.isLowStock && <span title={`LOW STOCK ALERT: ${item.totalQuantity} <= ${item.lowAlertQuantity}`}><ExclamationTriangleIcon className="w-5 h-5" /></span>}
                        {item.id}
                    </div>
                </td>
                <td onClick={() => onEditClick(item, 'description')} className={`cursor-pointer hover:bg-yellow-50 rounded-md ${item.isLowStock ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{item.description}</td>
                <td onClick={() => onEditClick(item, 'category')} className="cursor-pointer hover:bg-yellow-50 rounded-md"><span className="badge" style={{ borderColor: item.accentColor, borderWidth: item.accentColor ? '2px' : '0', borderStyle: 'solid' }}>{item.category === 'UNCATEGORIZED' ? 'UNCATEGORIZED' : item.category}{item.subCategory ? ` / ${item.subCategory}` : ''}</span></td>
                <td onClick={() => onEditClick(item, 'quantity')} className={`font-bold text-lg cursor-pointer hover:bg-yellow-50 rounded-md ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{item.quantityInView}</td>
                <td>{renderActionButtons(item)}</td>
            </tr>
            {expandedRows.has(item.id) && (<tr><td colSpan={7} className="p-0 bg-gray-50 border-b border-gray-200 shadow-inner"><div className="px-8 py-4">
                <div className="flex justify-between items-center mb-3">
                    <h4>STOCK BY LOCATION</h4>
                    <div className="text-right">
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wider mr-2">EST. TIME REMAINING:</span>
                        <span className="text-base font-bold text-em-dark-blue bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm">{item.etr}</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{item.locationsWithStock.map((locStock, index) => (<div key={index} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm text-sm"><div className="flex justify-between items-center border-b pb-2 mb-2"><span className="text-em-dark-blue font-bold text-base">{locStock.locationName}</span><span className="bg-gray-100 text-gray-900 px-2 py-1 rounded font-bold">QTY: {locStock.quantity}</span></div><div className="space-y-1 text-gray-600">{locStock.subLocationDetail && <p><strong>DETAIL:</strong> {locStock.subLocationDetail}</p>}<p><strong>SOURCE:</strong> {locStock.source}</p>{locStock.source === 'PO' && (<><p><strong>PO #:</strong> {locStock.poNumber || 'N/A'}</p><p><strong>DATE:</strong> {locStock.dateReceived || 'N/A'}</p></>)}</div></div>))}</div></div></td></tr>)}
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
        ? 'TOTAL QTY' 
        : `${locations.find(l => l.id === locationView)?.name || ''} QTY`;


    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div><input type="text" className="form-control pl-10" placeholder="SEARCH BY ID, DESCRIPTION, OR CATEGORY..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
                    <div className="flex items-center flex-col sm:flex-row gap-6 w-full md:w-auto">
                        {selectedItemIds.size > 0 && <button onClick={onBulkEditClick} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 w-full sm:w-auto">BULK EDIT ({selectedItemIds.size})</button>}
                        
                        {/* LINK STYLE FILTERS */}
                        <div className="relative">
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="link-style-select">
                                <option value="">ALL CATEGORIES</option>
                                {Object.keys(categoryHierarchy).sort().map(cat => (
                                    <React.Fragment key={cat}>
                                        <option value={cat}>{cat}</option>
                                        {Array.from(categoryHierarchy[cat]).sort().map(sub => (
                                            <option key={`${cat}|${sub}`} value={`${cat}|${sub}`}>{cat} / {sub}</option>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="link-style-select">
                                <option value="">ALL LOCATIONS</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 whitespace-nowrap bg-gray-50 px-3 py-2 rounded-md border border-gray-200"><label htmlFor="group-toggle" className="text-sm font-bold text-gray-700 cursor-pointer">GROUP CATEGORIES</label><div className="relative inline-block w-10 align-middle select-none"><input type="checkbox" name="group-toggle" id="group-toggle" checked={isGrouped} onChange={() => setIsGrouped(!isGrouped)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer shadow-sm transition-all duration-300"/><label htmlFor="group-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300"></label></div><style>{`.toggle-checkbox:checked { right: 0; border-color: #CC0000; }.toggle-checkbox:not(:checked) { right: calc(100% - 1.5rem); border-color: #e5e7eb; }.toggle-checkbox:checked + .toggle-label { background-color: #fca5a5; }`}</style></div>
                </div>
            </div>

            {filteredItems.length === 0 && <div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm border border-gray-200 no-items-message"><MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" /><h3>NO ITEMS FOUND</h3><p className="mt-1 text-gray-500">TRY ADJUSTING YOUR SEARCH OR FILTERS.</p></div>}
            
            <div className="md:hidden">
                {isGrouped ? (
                    Object.entries(displayData as Record<string, MappedItem[]>).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, itemsInCategory]) => (
                        <div key={category} className="mb-6">
                            <div className="bg-gray-100 px-4 py-2 rounded mb-3 text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-em-red">{category}</div>
                            {itemsInCategory.map(renderMobileCard)}
                        </div>
                    ))
                ) : (
                    (displayData as MappedItem[]).map(renderMobileCard)
                )}
            </div>

            <div className="hidden md:block inventory-table-container">
                <table className="min-w-full divide-y divide-gray-200 inventory-table">
                    <thead><tr>
                        <th scope="col" className="w-12 text-center"><input type="checkbox" className="h-5 w-5 border-gray-300 rounded" checked={allVisibleSelected} onChange={() => onSelectAll(sortedItems.map(i => i.id), !allVisibleSelected)} title="SELECT ALL" /></th>
                        <th scope="col" className="w-12 text-center"></th>
                        <SortableHeader sortValue="id" title="UNIQUE IDENTIFIER FOR THE ITEM (SKU)">ITEM CODE</SortableHeader>
                        <SortableHeader sortValue="description" title="A BRIEF DESCRIPTION OF THE ITEM">DESCRIPTION</SortableHeader>
                        <SortableHeader sortValue="category" title="THE PRIMARY CATEGORY AND OPTIONAL SUB-CATEGORY">CATEGORIES</SortableHeader>
                        <SortableHeader sortValue="quantityInView" title={`THE SUM OF STOCK FOR THE CURRENT VIEW`}>{quantityHeaderTitle}</SortableHeader>
                        <th scope="col" title="ACTIONS TO PERFORM ON A SINGLE ITEM">ACTIONS</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {isGrouped ? (
                            Object.entries(displayData as Record<string, MappedItem[]>).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, itemsInCategory]) => (
                                <React.Fragment key={category}>
                                    <tr className="bg-gray-100"><td colSpan={7} className="px-6 py-3 text-lg font-bold text-gray-800 border-l-4 border-em-red">{category}</td></tr>
                                    {renderTableRows(itemsInCategory)}
                                </React.Fragment>
                            ))
                        ) : (
                            renderTableRows(displayData as MappedItem[])
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;