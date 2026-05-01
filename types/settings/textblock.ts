export default interface Textblock {
    uuid: string;
    companyUuid: string; // UUID of the company this text block belongs to

    category: string; // Category of the text block (e.g., "terms", "privacy", "footer", etc.)
    documentType: Array<string>; // Types of documents this text block can be used for (e.g., "invoice", "offer", "deliveryNote", etc.)

    name: string;
    content: string; // Markdown content of the text block

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User ID of the person who made the change
    }>;
}