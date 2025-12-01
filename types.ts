export interface InventoryItem {
    id: string; // Unique identifier, e.g., product SKU
    description: string;
    category?: string;
    subCategory?: string;
    threeYearAvg?: number;
    fy2023?: number;
    fy2024?: number;
    fy2025?: number;
}

export interface Location {
    id: string; // Unique identifier for the location
    name: string;
    subLocationPrompt?: string;
}

export interface Stock {
    itemId: string;
    locationId: string;
    quantity: number;
    subLocationDetail?: string;
    source: 'OH' | 'PO';
    poNumber?: string;
    dateReceived?: string;
}

export interface ReportDataItem extends InventoryItem, Omit<Stock, 'itemId' | 'locationId'> {
    locationName: string;
}