export default interface RentalItem {
    uuid: string; // item uuid (i-xxx)

    manufacturer?: string;   // item manufacturer (e.g. "Yamaha", "Shure", "Avolites", etc.)
    model: string;  // item model (e.g. "CL5", "SM58", "Tiger Touch II", etc.)

    path: string;  // item path in the equipment hierarchy (e.g. "Audio/Consoles/Digital")

    description?: string;   // item description (e.g. "32 input digital mixing console with 16 motorized faders and 8 DCA groups")
    images?: Array<string>;   // array of image URLs for the item

    dimensions?: {
        width: number;  // item width in centimeters
        height: number; // item height in centimeters
        depth: number;  // item depth in centimeters
    };

    weight?: number;   // item weight in kilograms

    companies: Array<{
        uuid: string;   // company uuid (c-xxx) that rents out the item
        dayRate?: number;   // rental cost per day for this item from this company
        quantity?: number;   // quantity of the item available for rent from this company. If not set, it will be assumed that there is an infinite amount available for rent from this company. This can be useful for items that are rented from a supplier on demand, so the quantity can be left empty to avoid confusion and make it clear that the item is available for rent without a specific quantity limit.
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
        };
    }>;
}