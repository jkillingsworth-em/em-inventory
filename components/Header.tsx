import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';

interface HeaderProps {
    onAddItemClick: () => void;
    onImportClick: () => void;
    onExportClick: () => void;
    onReportClick: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onAddItemClick, onImportClick, onExportClick, onReportClick,
    canUndo, canRedo, onUndo, onRedo 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuAction = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    };

    return (
        <header className="bg-em-dark-blue shadow-md sticky top-0 z-40">
            <div className="fluid-container">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <h1 className="truncate">
                            <span className="text-em-red">ELECTRO-MECH</span> INVENTORY
                        </h1>
                        <div className="flex items-center space-x-1 bg-black bg-opacity-20 rounded-lg">
                            <button onClick={onUndo} disabled={!canUndo} className="p-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Undo">
                                <UndoIcon className="w-5 h-5 text-white" />
                            </button>
                            <button onClick={onRedo} disabled={!canRedo} className="p-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Redo">
                                <RedoIcon className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                         <button onClick={onAddItemClick} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-em-red hover:bg-red-700 rounded-md transition duration-150 shadow-sm">
                            <PlusIcon className="h-5 w-5 mr-1" />
                            <span className="hidden sm:inline">Add Item</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md transition duration-150 border border-gray-600">
                                <span>Actions</span>
                                <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50 animate-fade-in-down">
                                    <button onClick={() => handleMenuAction(onImportClick)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Import Data (CSV)</button>
                                    <button onClick={() => handleMenuAction(onExportClick)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export Listings</button>
                                    <button onClick={() => handleMenuAction(onReportClick)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Generate Report</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;