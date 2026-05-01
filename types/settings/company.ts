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

    vatId: string;     // VAT identification number for the company
    vatNumber: string; // VAT number for the company
    vatRate: number;   // VAT rate applied to the company's products/services

    logoUrl: string;    // URL to the company's logo image
    primaryColor: string;   // Hex code for the primary color used in the branding
    secondaryColor: string; // Hex code for the secondary color used in the branding

    defaultStationeryUuid: string; // UUID of the default stationery template

    lexware: {
        enabled: boolean;
        apiKey?: string;
    }

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User ID of the person who made the change
    }>;
}