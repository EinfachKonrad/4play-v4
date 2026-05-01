export default interface Warehouse {
    uuid: string;
    name: string;

    address: {
        street: string;
        postalCode: string;
        city: string;
        country: string;
    };

    nameingScheme: {
        aisle: 'numeric' | 'alphabetic';
        space1: ' ' | '-' | '_' | ''; // Separator between aisle and shelf
        shelf: 'numeric' | 'alphabetic';
        space2: ' ' | '-' | '_' | ''; // Separator between shelf and level
        level: 'numeric' | 'alphabetic';
        space3: ' ' | '-' | '_' | ''; // Separator between level and lot
        lot: 'numeric' | 'alphabetic';
    }

    layout: Array<{
        uuid: string; // Unique identifier for the shelf
        aisle: string; // Identifier for the aisle (e.g., "A", "1")
        shelf: string; // Identifier for the shelf (e.g., "1", "A")
        levels: {
            level: string; // Identifier for the level (e.g., "1", "A")
            lots: number; // Number of lots on this level
        }

        position: {
            x: number; // X coordinate in the warehouse layout
            y: number; // Y coordinate in the warehouse layout
        }
    }>;
                

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User ID of the person who made the change
    }>;
}
