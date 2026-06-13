export default interface Instance {
    uid: string;
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
        faviconUrl?: string; // URL to the instance favicon (optional)
    };

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User UID of the person who made the change
    }>;
}