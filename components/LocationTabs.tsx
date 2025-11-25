import React from 'react';
import { Location } from '../types';

interface LocationTabsProps {
    locations: Location[];
    selectedLocation: string;
    onSelectLocation: (locationId: string) => void;
}

const LocationTabs: React.FC<LocationTabsProps> = ({ locations, selectedLocation, onSelectLocation }) => {
    const baseStyle = "px-4 py-3 text-sm font-bold text-center border-b-4 transition-colors duration-200 cursor-pointer whitespace-nowrap";
    const activeStyle = "border-em-red text-em-red";
    const inactiveStyle = "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300";

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                <button
                    onClick={() => onSelectLocation('all')}
                    className={`${baseStyle} ${selectedLocation === 'all' ? activeStyle : inactiveStyle}`}
                >
                    All Inventory
                </button>
                {locations.map((location) => (
                    <button
                        key={location.id}
                        onClick={() => onSelectLocation(location.id)}
                        className={`${baseStyle} ${selectedLocation === location.id ? activeStyle : inactiveStyle}`}
                    >
                        {location.name}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default LocationTabs;