export default interface Company {
    uuid: string;
    name: string;

    address: {
        street: string;
        postalCode: string;
        city: string;
        country: string;
    }

    email: string;      // Contact email for the company
    phone: string;      // Contact phone number for the company
    website?: string;   // Optional website URL for the company

    vatId?: string;     // VAT identification number for the company (e.g. XX123456789)
    taxNumber?: string; // Tax number for the company (e.g. 123/456/78901)

    taxType: 'net' | 'gross' | 'vatfree'; // Tax type for the company (e.g., net, gross, VAT-free)
    smallBusiness: boolean; // Indicates if the company is classified as a small business under tax regulations
    defaultTaxRate: number;   // Default tax rate (in percentage) applied to invoices and financial documents


    logoUrl: string;    // URL to the company's logo image
    primaryColor: string;   // Hex code for the primary color used in the branding
    secondaryColor: string; // Hex code for the secondary color used in the branding

    defaultStationeryUuid: string; // UUID of the default stationery template

    lexware: {
        enabled: boolean;   // if enabled, name, taxType and smallBusiness are set automatically based on the Lexware profile and can´t be edited manually
        apiKey?: string; // API key for integrating with Lexware, if enabled
        organizationId?: string; // Organization ID in Lexware, if integration is enabled
        lastSync?: Date; // Timestamp of the last successful synchronization with Lexware
    }

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User ID of the person who made the change
    }>;
}