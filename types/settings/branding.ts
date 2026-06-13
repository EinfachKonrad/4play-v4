export default interface Branding {
    uid: string;
    name: string;

    address: {
        street: string;
        postalCode: string;
        city: string;
        country: string;
    }

    email: string;      // Contact email for the branding
    phone: string;      // Contact phone number for the branding
    website?: string;   // Optional website URL for the branding

    vatId?: string;     // VAT identification number for the branding (e.g. XX123456789)
    taxNumber?: string; // Tax number for the branding (e.g. 123/456/78901)

    taxType?: 'net' | 'gross' | 'vatfree'; // Tax type for the branding (e.g., net, gross, VAT-free)
    smallBusiness?: boolean; // Indicates if the branding is classified as a small business under tax regulations
    defaultTaxRate?: number;   // Default tax rate (in percentage) applied to invoices and financial documents


    logoUrl: string;    // URL to the branding's logo image

    defaultStationeryId?: string; // UUID of the default stationery template

    integrations: {
        lexware: {
            enabled: boolean;   // if enabled, name, taxType and smallBusiness are set automatically based on the Lexware profile and can´t be edited manually
            apiKey?: string; // API key for integrating with Lexware, if enabled
            organizationId?: string; // Organization ID in Lexware, if integration is enabled
            lastSync?: Date; // Timestamp of the last successful synchronization with Lexware
        };
    }

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User UID of the person who made the change
    }>;
}