export default interface Item {
    uuid: string; // item uuid (i-xxx)

    manufacturer?: string;   // item manufacturer (e.g. "Yamaha", "Shure", "Avolites", etc.)
    model: string;  // item model (e.g. "CL5", "SM58", "Tiger Touch II", etc.)

    path: string;  // item path in the equipment hierarchy (e.g. "Audio/Consoles/Digital")

    description?: string;   // item description (e.g. "32 input digital mixing console with 16 motorized faders and 8 DCA groups")
    images?: Array<string>;   // array of image URLs for the item
    
    purchasePrice: number;   // item purchase price (cost to buy the item)
    dayRate: number;   // item day rate (rental cost per day)

    dimensions?: {
        width: number;  // item width in centimeters
        height: number; // item height in centimeters
        depth: number;  // item depth in centimeters
    };

    weight?: number;   // item weight in kilograms

    locations?: Array<{
        uuid: string;   // location uuid (l-xxx)
        quantity?: number;   // quantity of the item available at this location. If not set, it will be assumed that all available quantity of the item is at this location. This can be useful for items that are only stored in one location, so the quantity can be left empty to avoid confusion and make it clear that all available quantity is at that location.
    }>;

    versions?: {
        optional: boolean;   // if true, the item can be booked without selecting a specific version, otherwise one of the versions must be selected when booking the item
        options: Array<{  // different versions of the same item (e.g. a box corner with different half cone configurations) that may or may not need different prepping and packing instructions
            uuid: string;   // version uuid (v-xxx)
            name: string;   // version name (e.g. "Box Corner - T", "Box Corner - 90deg", etc.)
            relations?: Array<{  // e.g. a box corner needs to be packed with 4 half cones, so the relations can be set to [{itemUuid: "i-xxx", quantity: 4}]
                itemUuid: string;   // related item uuid (i-xxx)
                quantity: number;   // quantity of the related item needed for this version
            }>;
        }>;
    }

    stock: {
        trackingType: "serial" | "bulk";   // stock tracking type (serial: each item is tracked individually with a unique serial number, bulk: only the total quantity of the item is tracked without individual serial numbers)
        elements?: Array<{   // only for serial tracking type, each element represents an individual item with a unique serial number
            uuid: string;   // element uuid (e-xxx)
            serialNumber: string;   // item serial number (e.g. "SN12345")
            isAvailable: boolean;   // availability status of the item (true: available for booking, false: not available for booking)            
            barcodes?: Array<string>;   // array of barcodes associated with the item
            history: Array<{
                date: Date;    // date of the status update
                event: string;   // event name or description related to the status update (e.g. "Booked for Event A", "Returned from Event B", "Sent for Repair", etc.)
                description?: string;   // additional description or notes about the status update (e.g. "Item was damaged during Event A and sent for repair on 2024-05-01, expected to be returned by 2024-06-15")
                updatedBy: string; // user uuid (u-xxx) who updated the status last time
            }>;
        }>;

        totalQuantity?: number;   // total quantity of the item available (for bulk only)
        stockHistory?: Array<{ // only for bulk tracking type, each entry represents a change in stock quantity
            date: Date;    // date of the stock update
            change: number;   // change in stock quantity (positive for adding stock, negative for removing stock)
            event?: string;   // event name or description related to the stock update (e.g. "Added 10 items to stock", "Removed 5 items from stock for Event A", etc.)
            description?: string;   // additional description or notes about the stock update (e.g. "Added 10 items to stock on 2024-05-01 after receiving a new shipment from the supplier")
            updatedBy: string; // user uuid (u-xxx) who updated the stock last time
        }>;
        itemBarcodes?: Array<string>;   // for bulk tracking, scanning one ofg the codes will book one (unidentified) element of the item. This can be useful for items that are tracked in bulk but still need to be scanned for booking and inventory management (e.g. empty Euroboxes, road cases, etc.)
    };
}