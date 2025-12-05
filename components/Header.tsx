import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { CameraIcon } from './icons/CameraIcon';

interface HeaderProps {
    onAddItemClick: () => void;
    onImportClick: () => void;
    onExportClick: () => void;
    onReportClick: () => void;
    onPrintBatchClick: () => void;
    onSearchClick: () => void;
    onScanClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onAddItemClick, onImportClick, onExportClick, onReportClick, onPrintBatchClick, onSearchClick, onScanClick
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
                <div className="flex flex-col md:flex-row items-center md:justify-between h-auto py-4 md:h-20 md:py-0">
                    <div className="flex-shrink-0 w-full md:w-auto">
                        <h1 className="titlefont text-3xl sm:text-4xl lg:text-5xl text-center md:text-left">
                            <span className="text-em-red">ELECTRO-MECH</span> INVENTORY
                        </h1>
                    </div>
                    <div className="flex items-center justify-center space-x-3 mt-4 md:mt-0">
                         <button onClick={onAddItemClick} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-em-red hover:bg-red-700 rounded-md transition duration-150 shadow-sm">
                            <PlusIcon className="h-5 w-5 mr-1" />
                            <span className="hidden sm:inline">ADD ITEM</span>
                            <span className="sm:hidden">ADD</span>
                        </button>
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md transition duration-150 border border-gray-600">
                                <span>ACTIONS</span>
                                <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50 animate-fade-in-down">
                                    <button onClick={() => handleMenuAction(onImportClick)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">IMPORT DATA (CSV)</button>
                                    <button onClick={() => handleMenuAction(onExportClick)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">EXPORT LISTINGS</button>
                                    <button onClick={() => handleMenuAction(onReportClick)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">GENERATE REPORT</button>
                                    <button onClick={() => handleMenuAction(onPrintBatchClick)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">PRINT BARCODES</button>
                                </div>
                            )}
                        </div>
                        <button onClick={onSearchClick} className="p-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md transition duration-150 border border-gray-600" title="Search Inventory">
                           <MagnifyingGlassIcon className="h-5 w-5"/>
                        </button>
                         <button onClick={onScanClick} className="p-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md transition duration-150 border border-gray-600" title="Scan Barcode">
                           <CameraIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;