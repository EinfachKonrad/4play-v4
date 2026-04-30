export default interface Bundle {
    uuid: string; // bundle uuid (b-xxx)

    name: string;  // bundle name (e.g. "Audio Bundle", "Video Bundle", "Lighting Bundle", etc.)
    description?: string;   // bundle description (e.g. "A bundle of essential audio equipment for a small event, including a digital mixing console, a set of microphones, and a stage box")

    path: string;  // bundle path in the equipment hierarchy (e.g. "Audio/Bundles")

    images?: Array<string>;   // array of image URLs for the bundle

    files?: Array<{ // files related to the bundle, such as setup instructions, packing instructions, etc.
        name: string;
        url: string;
    }>;

    dimensions?: {
        width: number;  // bundle width in centimeters
        height: number; // bundle height in centimeters
        depth: number;  // bundle depth in centimeters
    };

    weight?: number;   // bundle weight in kilograms

    dayRate: number;   // bundle day rate (rental cost per day for the entire bundle)

    contents: Array<{
        uuid: string;   // item or bundle uuid (i-xxx or b-xxx)
        quantity: number;   // quantity of the item included in the bundle
        reservationType: "always" | "onBook";  // always: the reserved quantity will be set unavailable; onBook: the reserved quantity will only be unavailable for the duration the bundle is booked.
        optional: boolean;   // if true, the item is optional in the bundle and needs to be included manually when a booking is made. This can be useful for optional items like a fronst filter.
        displayOnLabel: boolean;   // if true, the item will be listed on the bundle label, otherwise it will be hidden on the label (useful for items that are included in the bundle but dont need to be listed on the tour label (e.g. the case the label is attached to)
        displayOnAllDocuments: boolean;   // if false, the item won´t be displayed on documents that are not set to "detailed" mode (e.g. on a packing list in "compact" mode, the item will be hidden, but it will be visible on the same packing list in "detailed" mode and on the tour label regardless of the mode). This can be useful for items that are included in the bundle but dont need to be listed on all documents (e.g. Super Clamp Wedges)
        extend?: boolean; // Only for bundles. When true, all contents od that bundle will be displayed. When false, the bundle will be displayed as a single line without showing its contents. This can be useful for bundles that are included in other bundles, so they can be displayed as a single line on the documents without taking up too much space by showing all their contents (e.g. a "Stage Box Bundle" that includes 1 stage box and 4 multicore cables can be included in an "Audio Bundle" and set to not extend, so on the documents it will just show "1 x Stage Box Bundle" instead of listing all the individual items included in the stage box bundle)
        extendOnLabel: boolean; // Only for bundles. When true, all contents of that bundle will be displayed on the tour label. If false, only the name and quantity of the bundle will be displayed on the tour label, without showing its contents. This can be useful for bundles that are included in other bundles, so they can be displayed on the tour label as a single line without showing all their contents (e.g. a "Stage Box Bundle" that includes 1 stage box and 4 multicore cables can be included in an "Audio Bundle" and set to not extend on the label, so on the tour label it will just show "1 x Stage Box Bundle" instead of listing all the individual items included in the stage box bundle)
        extendOnAllDocuments: boolean; // When true, all contents of that bundle will be displayed on all documents. If false, only the name and quantity of the bundle will be displayed on documents that are not set to "detailed" mode (e.g. on a packing list in "compact" mode, the bundle will be shown as a single line without showing its contents, but on the same packing list in "detailed" mode and on the tour label, all contents of the bundle will be displayed).
        versionUuid?: string;   // version uuid (v-xxx) if the item has different versions and a specific version is included in the bundle, otherwise it can be left empty to indicate that any version of the item can be included in the bundle
    }>;

    elements?: Array<{
        uuid: string;   // element uuid (e-xxx)
        barcodes?: Array<string>;   // array of barcodes associated with the element
        history: Array<{
            date: Date;    // date of the status update
            event: string;   // event name or description related to the status update (e.g. "Booked for Event A", "Returned from Event B", "Sent for Repair", etc.)
            description?: string;   // additional description or notes about the status update (e.g. "Item was damaged during Event A and sent for repair on 2024-05-01, expected to be returned by 2024-06-15")
            updatedBy: string; // user uuid (u-xxx) who updated the status last time
        }>;
        verificationHistory: Array<{
            date: Date;    // date of the verification
            completed: boolean;   // verification status (true: the element has been verified and is ready for use, false: the element has not been verified or is not ready for use)
            missingParts?: Array<string>;   // array of missing parts or issues found during the verification (e.g. ["Missing XLR cable", "Broken fader", "Not powering on", etc.])
            verifiedBy: string; // user uuid (u-xxx) who performed the verification
        }>;
    }>;
}