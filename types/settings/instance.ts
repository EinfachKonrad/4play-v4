export default interface Instance {
    uuid: string;
    active: boolean; // Indicates if the configuration is active or not
    name: string | "4play";

    defaultLocale: string | "de-DE"; // Default language/locale for the instance (e.g., "en-US")

    support: {
        email: string; // Support email address for the instance
        website?: string; // Optional support website URL
        phone?: string; // Optional support phone number
    };

    design: {
        logoUrl?: string; // URL to the instance logo (optional)
        primaryColor: string | "#374151"; // Primary color for the instance (e.g., "#FF5733")
        secondaryColor: string | "#1F2937"; // Secondary color for the instance (e.g., "#C70039")
        backgroundColor: string | "#000000"; // Background color for the instance (e.g., "#F0F0F0")
        textColor: string | "#ffffff"; // Text color for the instance (e.g., "#333333")
        linkColor: string | "#60a5fa"; // Link color for the instance (e.g., "#1E90FF")
    };

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User ID of the person who made the change
    }>;
}