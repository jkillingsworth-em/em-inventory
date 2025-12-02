import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

type View = 'all' | 'categories' | 'locations';

interface NavigationViewProps {
    currentView: View;
    onSelectView: (view: View) => void;
}

const navLinks: { id: View, name: string }[] = [
    { id: 'all', name: 'ALL INVENTORY' },
    { id: 'categories', name: 'CATEGORIES' },
    { id: 'locations', name: 'LOCATIONS' },
];

const NavigationView: React.FC<NavigationViewProps> = ({ currentView, onSelectView }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (view: View) => {
        onSelectView(view);
        setIsMobileMenuOpen(false);
    };

    const baseStyle = "px-4 py-3 text-lg font-bold text-center border-b-4 transition-colors duration-200 cursor-pointer whitespace-nowrap uppercase";
    const activeStyle = "border-em-red text-em-red";
    const inactiveStyle = "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300";

    const selectedViewName = navLinks.find(l => l.id === currentView)?.name || 'SELECT VIEW';

    return (
        <div className="mb-6 border-b border-gray-200">
            {/* Desktop View: Full tabs */}
            <nav className="hidden md:flex -mb-px space-x-4" aria-label="Tabs">
                {navLinks.map((link) => (
                    <button
                        key={link.id}
                        onClick={() => onSelectView(link.id)}
                        className={`${baseStyle} ${currentView === link.id ? activeStyle : inactiveStyle}`}
                    >
                        {link.name}
                    </button>
                ))}
            </nav>

            {/* Mobile View: Dropdown */}
            <div className="md:hidden relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-full flex justify-between items-center px-4 py-3 text-lg font-bold uppercase text-em-red"
                >
                    <span>{selectedViewName}</span>
                    <ChevronDownIcon className={`w-6 h-6 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white rounded-b-md shadow-lg border border-gray-200 z-30 animate-fade-in-down">
                        {navLinks.map(link => (
                             <button
                                key={link.id}
                                onClick={() => handleSelect(link.id)}
                                className={`block w-full text-left px-4 py-3 text-base font-medium ${currentView === link.id ? 'bg-red-50 text-em-red' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                {link.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NavigationView;
