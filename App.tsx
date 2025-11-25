import React, { useState, useCallback, useMemo } from 'react';
import { InventoryItem, Location, Stock, ReportDataItem } from './types';
import Header from './components/Header';
import InventoryTable from './components/InventoryTable';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import MoveStockModal from './components/MoveStockModal';
import ImportDataModal from './components/ImportDataModal';
import GenerateReportModal from './components/GenerateReportModal';
import ReportPreviewModal from './components/ReportPreviewModal';
import BulkEditModal from './components/BulkEditModal';
import { useHistoryState } from './hooks/useHistoryState';
import LocationTabs from './components/LocationTabs';

// New location data
const initialLocations: Location[] = [
    { id: 'wh-j', name: 'WH-J', subLocationPrompt: 'SHELF or RACK' },
    { id: 'wh-c', name: 'WH-C' },
    { id: 'wh-k', name: 'WH-K' },
    { id: 'prod', name: 'PROD', subLocationPrompt: 'SHELF, OFFICE, or ROOM' },
    { id: 'inspect', name: 'INSPECT' },
];

const initialItems: InventoryItem[] = [
    { id: '563-11-SAMP', description: '11" SAMPLE', category: 'OUTDOOR LED BOARD', subCategory: 'RED' },
    { id: '563-15-SAMP', description: '15" SAMPLE', category: 'OUTDOOR LED BOARD', subCategory: 'AMBER' },
];

const initialStock: Stock[] = [
    { itemId: '563-11-SAMP', locationId: 'wh-c', quantity: 900, source: 'OH' },
    { itemId: '563-11-SAMP', locationId: 'prod', quantity: 75, source: 'OH' },
    { itemId: '563-15-SAMP', locationId: 'wh-c', quantity: 450, source: 'OH' },
    { itemId: '563-15-SAMP', locationId: 'prod', quantity: 50, source: 'OH' },
];

// Initial colors for demo
const initialColors: Record<string, string> = {
    'RED': '#EF4444',
    'AMBER': '#F59E0B',
    'GREEN': '#10B981',
    'BLUE': '#3B82F6'
};

const App: React.FC = () => {
    // UI State (not part of undo/redo history)
    const [locations] = useState<Location[]>(initialLocations);
    const [isAddItemModalOpen, setAddItemModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isMoveModalOpen, setMoveModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [isBulkEditModalOpen, setBulkEditModalOpen] = useState(false);

    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [itemToMove, setItemToMove] = useState<InventoryItem | null>(null);
    const [itemToDuplicate, setItemToDuplicate] = useState<InventoryItem | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [reportData, setReportData] = useState<ReportDataItem[] | null>(null);
    const [selectedLocationView, setSelectedLocationView] = useState('all');

    // History State (for undo/redo)
    const [appState, setAppState, undo, redo, canUndo, canRedo] = useHistoryState({
        items: initialItems,
        stock: initialStock,
        categoryColors: initialColors,
    });
    const { items, stock, categoryColors } = appState;

    const handleOpenMoveModal = useCallback((item: InventoryItem) => {
        setItemToMove(item);
        setMoveModalOpen(true);
    }, []);
    
    const handleOpenDuplicateModal = useCallback((item: InventoryItem) => {
        setItemToDuplicate(item);
        setAddItemModalOpen(true);
    }, []);
    
    const handleOpenEditModal = useCallback((item: InventoryItem) => {
        setItemToEdit(item);
        setEditModalOpen(true);
    }, []);

    const handleCloseAddItemModal = () => {
        setAddItemModalOpen(false);
        setItemToDuplicate(null);
    };

    const handleDeleteItem = useCallback((itemId: string) => {
        if (window.confirm('Are you sure you want to delete this item and all its stock records? This action cannot be undone.')) {
            setAppState(prev => ({
                ...prev,
                items: prev.items.filter(item => item.id !== itemId),
                stock: prev.stock.filter(s => s.itemId !== itemId),
            }));
            setSelectedItemIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    }, [setAppState]);
    
    const handleAddItem = useCallback((
        item: InventoryItem, 
        newStockEntries: Omit<Stock, 'itemId'>[], 
        colors?: { category?: string, subCategory?: string }
    ) => {
        setAppState(prev => {
            const newStockWithItemId = newStockEntries.map(entry => ({...entry, itemId: item.id }));
            const nextColors = { ...prev.categoryColors };
            if (colors) {
                if (item.category && colors.category) nextColors[item.category] = colors.category;
                if (item.subCategory && colors.subCategory) nextColors[item.subCategory] = colors.subCategory;
            }
            return {
                ...prev,
                items: [...prev.items, item],
                stock: [...prev.stock, ...newStockWithItemId],
                categoryColors: nextColors
            }
        });
        handleCloseAddItemModal();
    }, [setAppState]);
    
    const handleEditItem = useCallback((updatedItem: InventoryItem, colors?: { category?: string, subCategory?: string }) => {
        setAppState(prev => {
            const nextColors = { ...prev.categoryColors };
            if (colors) {
                if (updatedItem.category && colors.category) nextColors[updatedItem.category] = colors.category;
                if (updatedItem.subCategory && colors.subCategory) nextColors[updatedItem.subCategory] = colors.subCategory;
            }
            return {
                ...prev,
                items: prev.items.map(item => item.id === updatedItem.id ? updatedItem : item),
                categoryColors: nextColors
            };
        });
        setEditModalOpen(false);
        setItemToEdit(null);
    }, [setAppState]);

    const handleMoveStock = useCallback((
        itemId: string,
        fromLocationId: string,
        toLocationId: string,
        quantity: number,
        toSubLocationDetail?: string
    ) => {
        setAppState(prev => {
            const newStock = [...prev.stock];
            const fromStockIndex = newStock.findIndex(s => s.itemId === itemId && s.locationId === fromLocationId);
            if (fromStockIndex === -1) return prev;

            const fromStock = newStock[fromStockIndex];
            newStock[fromStockIndex] = { ...fromStock, quantity: fromStock.quantity - quantity };

            const toStockIndex = newStock.findIndex(s => s.itemId === itemId && s.locationId === toLocationId);
            if (toStockIndex > -1) {
                 const toStock = newStock[toStockIndex];
                 newStock[toStockIndex] = { ...toStock, quantity: toStock.quantity + quantity, subLocationDetail: toSubLocationDetail || toStock.subLocationDetail };
            } else {
                newStock.push({ itemId, locationId: toLocationId, quantity, subLocationDetail: toSubLocationDetail, source: fromStock.source, poNumber: fromStock.poNumber, dateReceived: fromStock.dateReceived });
            }

            return { ...prev, stock: newStock.filter(s => s.quantity > 0) };
        });
        setMoveModalOpen(false);
    }, [setAppState]);

    const handleImportData = useCallback((importedItems: InventoryItem[], importedStock: Stock[], importedLocations: Omit<Location, 'id'>[]) => {
      setAppState(prev => {
        const itemMap = new Map(prev.items.map(item => [item.id, item]));
        importedItems.forEach(item => {
            const existingItem = itemMap.get(item.id);
            const mergedItem = { ...existingItem, ...item };
            itemMap.set(item.id, mergedItem);
        });
        const newItems = Array.from(itemMap.values());

        const locationNameToId = new Map(locations.map(l => [l.name, l.id]));
        const importedItemIds = new Set(importedItems.map(i => i.id));
        const stockToKeep = prev.stock.filter(s => !importedItemIds.has(s.itemId));
        const newStockFromImport = importedStock
            .map(impS => {
                const locationId = locationNameToId.get(impS.locationId);
                return locationId ? { ...impS, locationId } : null;
            })
            .filter((s): s is Stock => s !== null);
        const newStock = [...stockToKeep, ...newStockFromImport];

        return { ...prev, items: newItems, stock: newStock };
      });
  
      setImportModalOpen(false);
      alert('Data imported successfully! Existing data for imported items has been overwritten.');
    }, [locations, setAppState]);

    const handleBulkUpdate = useCallback((changes: { description?: string; category?: string; subCategory?: string; }) => {
        setAppState(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (selectedItemIds.has(item.id)) {
                    return {
                        ...item,
                        description: changes.description !== undefined ? changes.description : item.description,
                        category: changes.category !== undefined ? changes.category : item.category,
                        subCategory: changes.subCategory !== undefined ? changes.subCategory : item.subCategory,
                    };
                }
                return item;
            })
        }));
        setBulkEditModalOpen(false);
        setSelectedItemIds(new Set()); // Clear selection
    }, [selectedItemIds, setAppState]);


    const handleSelectionChange = useCallback((itemId: string) => {
        setSelectedItemIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) newSet.delete(itemId);
            else newSet.add(itemId);
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback((itemIds: string[], select: boolean) => {
        setSelectedItemIds(prev => {
            const newSet = new Set(prev);
            itemIds.forEach(id => select ? newSet.add(id) : newSet.delete(id));
            return newSet;
        });
    }, []);

    const generateReportData = useCallback((itemsToReport: InventoryItem[]): ReportDataItem[] => {
        const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));
        const report: ReportDataItem[] = [];
        itemsToReport.forEach(item => {
            const itemStock = stock.filter(s => s.itemId === item.id);
            if (itemStock.length > 0) {
                itemStock.forEach(s => report.push({ ...item, locationName: locationMap.get(s.locationId) || 'Unknown', ...s }));
            } else {
                report.push({ ...item, locationName: 'N/A', quantity: 0, source: 'OH' });
            }
        });
        return report;
    }, [locations, stock]);

    const handleGenerateReport = useCallback((options: { type: 'all' | 'category' | 'selected' | 'single', value?: string }) => {
        let itemsToReport: InventoryItem[] = [];
        switch(options.type) {
            case 'all': itemsToReport = items; break;
            case 'category': itemsToReport = items.filter(i => (i.category || 'Uncategorized') === options.value); break;
            case 'selected': itemsToReport = items.filter(i => selectedItemIds.has(i.id)); break;
            case 'single': itemsToReport = items.filter(i => i.id === options.value); break;
        }
        if (itemsToReport.length === 0) { alert("No items to report."); return; }
        setReportData(generateReportData(itemsToReport));
        setReportModalOpen(false);
    }, [items, selectedItemIds, generateReportData]);

    const handleExportAllListings = useCallback(() => {
        if (items.length === 0) {
            alert("No inventory to export.");
            return;
        }

        const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));
        const dataToExport: any[] = [];

        items.forEach(item => {
            const itemStock = stock.filter(s => s.itemId === item.id);
            if (itemStock.length > 0) {
                itemStock.forEach(s => {
                    dataToExport.push({
                        'ID': item.id,
                        'DESCRIPTION': item.description,
                        'CATEGORY': item.category || '',
                        'SUB_CATEGORY': item.subCategory || '',
                        'LOCATION': locationMap.get(s.locationId) || s.locationId,
                        'SUB_LOCATION': s.subLocationDetail || '',
                        'QTY': s.quantity,
                        'SOURCE': s.source,
                        'PO_NUMBER': s.poNumber || '',
                        'DATE_RECEIVED': s.dateReceived || '',
                    });
                });
            } else {
                dataToExport.push({
                    'ID': item.id,
                    'DESCRIPTION': item.description,
                    'CATEGORY': item.category || '',
                    'SUB_CATEGORY': item.subCategory || '',
                    'LOCATION': '',
                    'SUB_LOCATION': '',
                    'QTY': 0,
                    'SOURCE': 'OH',
                    'PO_NUMBER': '',
                    'DATE_RECEIVED': '',
                });
            }
        });
        
        const formatCsvField = (field: any) => {
            const str = String(field ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(row => headers.map(header => formatCsvField(row[header as keyof typeof row])).join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'inventory_listings.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [items, stock, locations]);

    return (
        <div className="min-h-screen bg-gray-100 text-em-gray">
            <Header
                onAddItemClick={() => setAddItemModalOpen(true)}
                onImportClick={() => setImportModalOpen(true)}
                onExportClick={handleExportAllListings}
                onReportClick={() => setReportModalOpen(true)}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
            />
            <main className="fluid-container py-8">
                <LocationTabs 
                    locations={locations}
                    selectedLocation={selectedLocationView}
                    onSelectLocation={setSelectedLocationView}
                />
                <InventoryTable
                    items={items}
                    locations={locations}
                    stock={stock}
                    onMoveClick={handleOpenMoveModal}
                    onDeleteClick={handleDeleteItem}
                    onDuplicateClick={handleOpenDuplicateModal}
                    onEditClick={handleOpenEditModal}
                    selectedItemIds={selectedItemIds}
                    onSelectionChange={handleSelectionChange}
                    onSelectAll={handleSelectAll}
                    onGenerateReportForItem={(itemId) => handleGenerateReport({ type: 'single', value: itemId })}
                    categoryColors={categoryColors}
                    onBulkEditClick={() => setBulkEditModalOpen(true)}
                    locationView={selectedLocationView}
                />
            </main>
            {isAddItemModalOpen && <AddItemModal onClose={handleCloseAddItemModal} onAddItem={handleAddItem} locations={locations} existingItemIds={items.map(i => i.id)} itemToDuplicate={itemToDuplicate} currentCategoryColors={categoryColors}/>}
            {isEditModalOpen && itemToEdit && <EditItemModal item={itemToEdit} onClose={() => setEditModalOpen(false)} onEditItem={handleEditItem} currentCategoryColors={categoryColors} />}
            {isMoveModalOpen && itemToMove && <MoveStockModal item={itemToMove} locations={locations} stock={stock} onClose={() => setMoveModalOpen(false)} onMoveStock={handleMoveStock} />}
            {isImportModalOpen && <ImportDataModal onClose={() => setImportModalOpen(false)} onImport={handleImportData} />}
            {isReportModalOpen && <GenerateReportModal onClose={() => setReportModalOpen(false)} onGenerate={handleGenerateReport} items={items} selectedItemCount={selectedItemIds.size}/>}
            {reportData && <ReportPreviewModal reportData={reportData} onClose={() => setReportData(null)}/>}
            {isBulkEditModalOpen && <BulkEditModal onClose={() => setBulkEditModalOpen(false)} onSaveChanges={handleBulkUpdate} selectedItemCount={selectedItemIds.size}/>}
        </div>
    );
};

export default App;