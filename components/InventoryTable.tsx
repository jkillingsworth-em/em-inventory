import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InventoryItem, Location, Stock, PrintableLabel } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ArrowRightLeftIcon } from './icons/ArrowRightLeftIcon';
import { DocumentChartBarIcon } from './icons/DocumentChartBarIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { SortIcon } from './icons/SortIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import FilterModal from './FilterModal';
import { FilterIcon } from './icons/FilterIcon';
import { BarcodeIcon } from './icons/BarcodeIcon';
import { PrinterIcon } from './icons/PrinterIcon';

interface InventoryTableProps {
    items: InventoryItem[];
    locations: Location[];
    stock: Stock[];
    onMoveClick: (item: InventoryItem) => void;
    onDeleteClick: (itemId: string) => void;
    onDuplicateClick: (item: InventoryItem) => void;
    onEditClick: (item: InventoryItem, field?: string) => void;
    onPrintBarcode: (item: InventoryItem) => void;
    onPrintSpecificLabel: (label: PrintableLabel) => void;
    selectedItemIds: Set<string>;
    onSelectionChange: (itemId: string) => void;
    onSelectAll: (itemIds: string[], select: boolean) => void;
    onGenerateReportForItem: (itemId: string) => void;
    categoryColors: Record<string, string>;
    onBulkEditClick: () => void;
    view: 'all' | 'categories' | 'locations';
    searchQuery: string;
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
    items, locations, stock, onMoveClick, onDeleteClick, onDuplicateClick, onEditClick, onPrintBarcode, onPrintSpecificLabel,
    selectedItemIds, onSelectionChange, onSelectAll, onGenerateReportForItem, categoryColors,
    onBulkEditClick, view, searchQuery
}) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    // Unified grouping state
    const [groupBy, setGroupBy] = useState<'none' | 'category' | 'location'>('none');
    
    // Sort State
    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    // Filter States
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Set default grouping based on the view
    useEffect(() => {
        if (view === 'categories') {
            setGroupBy('category');
        } else if (view === 'locations') {
            setGroupBy('location');
        } else {
            setGroupBy('none');
        }
    }, [view]);

    const toggleRowExpansion = (itemId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            const key = itemId; // For location view, key might need to be more complex if needed
            if (newSet.has(key)) newSet.delete(key);
            else newSet.add(key);
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
            
            // CORRECTED: 'quantityInView' should be the total quantity for consistent sorting and display.
            // The view-specific filtering is handled later.
            const quantityInView = totalQuantity;

            const locationsWithStock = allItemStock
                .map(s => ({...s, locationName: locationMap.get(s.locationId) || 'UNKNOWN LOCATION'}))
                .sort((a,b) => a.locationName.localeCompare(b.locationName));
            
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
    }, [items, locations, stock, categoryColors]);

    const filteredItems = useMemo(() => {
        let result = mappedItems;

        if (searchQuery) {
            const lower = searchQuery.toUpperCase();
            result = result.filter(item => item.id.toUpperCase().includes(lower) || item.description.toUpperCase().includes(lower) || item.category.toUpperCase().includes(lower) || (item.subCategory && item.subCategory.toUpperCase().includes(lower)));
        }

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
    }, [mappedItems, searchQuery, filterCategory, filterLocation]);

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
        if (groupBy === 'category') {
            return sortedItems.reduce((acc, item) => {
                const key = item.category;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {} as Record<string, MappedItem[]>);
        }
        if (groupBy === 'location') {
            const locGroups: Record<string, { name: string; items: { item: MappedItem; stock: Stock }[] }> = {};
            sortedItems.forEach(item => {
                item.locationsWithStock.forEach(s => {
                    const key = `${s.locationName} ${s.subLocationDetail ? ` - ${s.subLocationDetail}` : ''}`;
                    if (!locGroups[key]) locGroups[key] = { name: key, items: [] };
                    locGroups[key].items.push({ item, stock: s });
                });
            });
            return Object.values(locGroups).sort((a, b) => a.name.localeCompare(b.name));
        }
        return sortedItems;
    }, [sortedItems, groupBy]);

    const allVisibleSelected = sortedItems.length > 0 && sortedItems.every(i => selectedItemIds.has(i.id));

    const renderActionButtons = (item: InventoryItem) => (
        <div className="flex items-center space-x-1">
            <button onClick={() => onPrintBarcode(item)} className="btn-icon text-gray-600 hover:text-gray-900" title="PRINT BARCODE"><BarcodeIcon className="w-5 h-5" /></button>
            <button onClick={() => onGenerateReportForItem(item.id)} className="btn-icon text-green-600 hover:text-green-800" title="REPORT"><DocumentChartBarIcon className="w-5 h-5" /></button>
            <button onClick={() => onDuplicateClick(item)} className="btn-icon text-purple-600 hover:text-purple-800" title="DUPLICATE"><DocumentDuplicateIcon className="w-5 h-5" /></button>
            <button onClick={() => onEditClick(item)} className="btn-icon text-yellow-600 hover:text-yellow-800" title="EDIT"><PencilSquareIcon className="w-5 h-5" /></button>
            <button onClick={() => onMoveClick(item)} className="btn-icon text-blue-600 hover:text-blue-800" title="MOVE"><ArrowRightLeftIcon className="w-5 h-5" /></button>
            <button onClick={() => onDeleteClick(item.id)} className="btn-icon text-red-600 hover:text-red-800" title="DELETE"><TrashIcon className="w-5 h-5" /></button>
        </div>
    );

    const renderMobileCard = (item: MappedItem, quantityOverride?: number) => (
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
                <div className="text-right" onClick={() => onEditClick(item, 'quantity')}><div className={`text-2xl font-bold cursor-pointer hover:bg-yellow-100 rounded-md p-1 ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{quantityOverride ?? item.totalQuantity}</div><div className="text-label">QTY</div></div>
            </div>
            <div className="mobile-card-content" onClick={() => onEditClick(item, 'description')}><p className={`text-base cursor-pointer hover:bg-yellow-100 rounded-md p-1 ${item.isLowStock ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{item.description}</p></div>
            {groupBy !== 'location' && expandedRows.has(item.id) && (
                <div className="bg-gray-50 border-t border-b border-gray-200 px-4 py-3">
                    <div className="flex justify-between items-baseline mb-2">
                        <h4>LOCATION DETAILS</h4>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ETR</p>
                            <p className="text-sm font-semibold text-em-dark-blue">{item.etr}</p>
                        </div>
                    </div>
                    {item.locationsWithStock.length === 0 ? <p className="text-sm text-gray-500 italic">NO STOCK RECORDED.</p> : <div className="space-y-2">{item.locationsWithStock.map((locStock, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-700">{locStock.locationName}{locStock.subLocationDetail && <span className="text-gray-500 font-normal"> - {locStock.subLocationDetail}</span>}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">{locStock.quantity}</span>
                                <button
                                    onClick={() => onPrintSpecificLabel({
                                        itemId: item.id,
                                        description: item.description,
                                        locationName: locStock.locationName,
                                        subLocationDetail: locStock.subLocationDetail
                                    })}
                                    className="btn-icon text-gray-500 hover:text-gray-800"
                                    title={`Print label for ${locStock.locationName}`}
                                >
                                    <PrinterIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}</div>}
                </div>
            )}
            <div className="mobile-card-footer">
                <button onClick={() => toggleRowExpansion(item.id)} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">{expandedRows.has(item.id) ? 'HIDE DETAILS' : 'VIEW DETAILS'}{expandedRows.has(item.id) ? <ChevronUpIcon className="ml-1 w-4 h-4"/> : <ChevronDownIcon className="ml-1 w-4 h-4"/>}</button>
                {renderActionButtons(item)}
            </div>
        </div>
    );

    const renderTableRows = (itemsToRender: MappedItem[], quantityKey: 'totalQuantity' | 'quantityInView' = 'totalQuantity') => itemsToRender.map((item) => (
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
                <td onClick={() => onEditClick(item, 'quantity')} className={`font-bold text-lg cursor-pointer hover:bg-yellow-50 rounded-md ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{item[quantityKey]}</td>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{item.locationsWithStock.map((locStock, index) => (<div key={index} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm text-sm"><div className="flex justify-between items-center border-b pb-2 mb-2"><span className="text-em-dark-blue font-bold text-base">{locStock.locationName}</span><div className="flex items-center gap-2"><span className="bg-gray-100 text-gray-900 px-2 py-1 rounded font-bold">QTY: {locStock.quantity}</span><button onClick={() => onPrintSpecificLabel({ itemId: item.id, description: item.description, locationName: locStock.locationName, subLocationDetail: locStock.subLocationDetail })} className="btn-icon text-gray-500 hover:text-gray-800" title={`Print label for ${locStock.locationName}`}><PrinterIcon className="w-5 h-5" /></button></div></div><div className="space-y-1 text-gray-600">{locStock.subLocationDetail && <p><strong>DETAIL:</strong> {locStock.subLocationDetail}</p>}<p><strong>SOURCE:</strong> {locStock.source}</p>{locStock.source === 'PO' && (<><p><strong>PO #:</strong> {locStock.poNumber || 'N/A'}</p><p><strong>DATE:</strong> {locStock.dateReceived || 'N/A'}</p></>)}</div></div>))}</div></div></td></tr>)}
        </React.Fragment>
    ));

    const renderLocationGroupedRows = (groupItems: { item: MappedItem; stock: Stock }[]) => groupItems.map(({ item, stock: stockEntry }) => (
        <React.Fragment key={`${stockEntry.locationId}-${stockEntry.subLocationDetail}-${item.id}`}>
             <tr className={`border-b border-gray-200 last:border-0 ${item.isLowStock ? 'bg-red-50 hover:bg-red-100' : ''}`} title={item.stockTooltip}>
                <td className="w-12 text-center"><input type="checkbox" className="h-5 w-5 border-gray-300 rounded cursor-pointer" style={{ accentColor: item.accentColor }} checked={selectedItemIds.has(item.id)} onChange={() => onSelectionChange(item.id)}/></td>
                <td className="w-12 text-center"></td>
                <td className={`font-bold text-lg ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    <div className="flex items-center gap-2">
                        {item.isLowStock && <span title={`LOW STOCK ALERT: ${item.totalQuantity} <= ${item.lowAlertQuantity}`}><ExclamationTriangleIcon className="w-5 h-5" /></span>}
                        {item.id}
                    </div>
                </td>
                <td onClick={() => onEditClick(item, 'description')} className={`cursor-pointer hover:bg-yellow-50 rounded-md ${item.isLowStock ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{item.description}</td>
                <td onClick={() => onEditClick(item, 'category')} className="cursor-pointer hover:bg-yellow-50 rounded-md"><span className="badge" style={{ borderColor: item.accentColor, borderWidth: item.accentColor ? '2px' : '0', borderStyle: 'solid' }}>{item.category}{item.subCategory ? ` / ${item.subCategory}` : ''}</span></td>
                <td onClick={() => onEditClick(item, 'quantity')} className={`font-bold text-lg cursor-pointer hover:bg-yellow-50 rounded-md ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{stockEntry.quantity}</td>
                <td>{renderActionButtons(item)}</td>
            </tr>
        </React.Fragment>
    ));


    const SortableHeader = ({ sortValue, title, children }: { sortValue: SortKey, title: string, children?: React.ReactNode }) => (
        <th scope="col" title={title}>
            <button onClick={() => handleSort(sortValue)} className="flex items-center gap-2 font-bold uppercase hover:text-em-red transition-colors">
                {children}
                <SortIcon direction={sortKey === sortValue ? sortDirection : undefined} className="w-4 h-4" />
            </button>
        </th>
    );

    const GroupToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
        <div className="flex items-center space-x-3 whitespace-nowrap bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
            <label htmlFor={`group-toggle-${label.replace(/\s+/g, '-')}`} className="text-sm font-bold text-gray-700 cursor-pointer">{label}</label>
            <div className="relative inline-block w-10 align-middle select-none">
                <input type="checkbox" name={`group-toggle-${label.replace(/\s+/g, '-')}`} id={`group-toggle-${label.replace(/\s+/g, '-')}`} checked={checked} onChange={onChange} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer shadow-sm transition-all duration-300"/>
                <label htmlFor={`group-toggle-${label.replace(/\s+/g, '-')}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300"></label>
            </div>
        </div>
    );

    const isFilterActive = filterCategory !== '' || filterLocation !== '';

    const handleApplyFilters = (filters: { category: string; location: string }) => {
        setFilterCategory(filters.category);
        setFilterLocation(filters.location);
    };

    const handleClearFilters = () => {
        setFilterCategory('');
        setFilterLocation('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                 <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center flex-col sm:flex-row gap-6 w-full md:w-auto">
                        {selectedItemIds.size > 0 && <button onClick={onBulkEditClick} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 w-full sm:w-auto">BULK EDIT ({selectedItemIds.size})</button>}
                        
                        {/* Desktop Filters */}
                        <div className="hidden md:flex items-center gap-6">
                            {(view === 'all' || view === 'categories') && (
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
                            )}

                            {(view === 'all' || view === 'locations') && (
                                <div className="relative">
                                    <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="link-style-select">
                                        <option value="">ALL LOCATIONS</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Mobile Filter Button */}
                        <div className="md:hidden w-full">
                            <button 
                                onClick={() => setIsFilterModalOpen(true)}
                                className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 relative"
                            >
                                <FilterIcon className="w-5 h-5" />
                                FILTERS
                                {isFilterActive && <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-em-red"></span>}
                            </button>
                        </div>
                    </div>

                    {view === 'all' && (
                       <div className="flex flex-col sm:flex-row gap-4">
                            <GroupToggle label="GROUP BY CATEGORY" checked={groupBy === 'category'} onChange={() => setGroupBy(prev => prev === 'category' ? 'none' : 'category')} />
                            <GroupToggle label="GROUP BY LOCATION" checked={groupBy === 'location'} onChange={() => setGroupBy(prev => prev === 'location' ? 'none' : 'location')} />
                       </div>
                    )}
                     <style>{`.toggle-checkbox:checked { right: 0; border-color: #CC0000; }.toggle-checkbox:not(:checked) { right: calc(100% - 1.5rem); border-color: #e5e7eb; }.toggle-checkbox:checked + .toggle-label { background-color: #fca5a5; }`}</style>
                </div>
            </div>

            {filteredItems.length === 0 && <div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm border border-gray-200 no-items-message"><MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" /><h3>NO ITEMS FOUND</h3><p className="mt-1 text-gray-500">TRY ADJUSTING YOUR SEARCH OR FILTERS.</p></div>}
            
            <div className="md:hidden">
                {groupBy === 'category' ? (
                    Object.entries(displayData as Record<string, MappedItem[]>).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, itemsInCategory]) => (
                        <div key={category} className="mb-6">
                            <div className="bg-gray-100 px-4 py-2 rounded mb-3 text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-em-red">{category}</div>
                            {itemsInCategory.map(item => renderMobileCard(item))}
                        </div>
                    ))
                ) : groupBy === 'location' ? (
                    (displayData as { name: string; items: { item: MappedItem; stock: Stock }[] }[]).map(group => (
                         <div key={group.name} className="mb-6">
                            <div className="bg-gray-100 px-4 py-2 rounded mb-3 text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-em-red">{group.name}</div>
                            {group.items.map(({ item, stock: stockEntry }) => renderMobileCard(item, stockEntry.quantity))}
                        </div>
                    ))
                ) : (
                    (displayData as MappedItem[]).map(item => renderMobileCard(item))
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
                        <SortableHeader sortValue="quantityInView" title="THE SUM OF STOCK FOR THIS ITEM ACROSS ALL LOCATIONS">TOTAL QTY</SortableHeader>
                        <th scope="col" title="ACTIONS TO PERFORM ON A SINGLE ITEM">ACTIONS</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {groupBy === 'category' ? (
                            Object.entries(displayData as Record<string, MappedItem[]>).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, itemsInCategory]) => (
                                <React.Fragment key={category}>
                                    <tr className="bg-gray-100"><td colSpan={7} className="px-6 py-3 text-lg font-bold text-gray-800 border-l-4 border-em-red">{category}</td></tr>
                                    {renderTableRows(itemsInCategory)}
                                </React.Fragment>
                            ))
                        ) : groupBy === 'location' ? (
                             (displayData as { name: string; items: { item: MappedItem; stock: Stock }[] }[]).map(group => (
                                <React.Fragment key={group.name}>
                                    <tr className="bg-gray-100"><td colSpan={7} className="px-6 py-3 text-lg font-bold text-gray-800 border-l-4 border-em-red">{group.name}</td></tr>
                                    {renderLocationGroupedRows(group.items)}
                                </React.Fragment>
                            ))
                        ) : (
                            renderTableRows(displayData as MappedItem[])
                        )}
                    </tbody>
                </table>
            </div>
            
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
                locations={locations}
                categoryHierarchy={categoryHierarchy}
                currentCategory={filterCategory}
                currentLocation={filterLocation}
            />
        </div>
    );
};

export default InventoryTable;