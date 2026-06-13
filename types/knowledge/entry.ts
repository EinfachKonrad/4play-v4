export default interface Entry {
    uid: string;

    title: string;
    content: string; // Markdown content of the entry

    path: string; // Unique path for the entry (e.g., "getting started/installation")

    files?: Array<{
        uid: string;
        name: string;
        url: string; // URL to access the file
        type: string; // MIME type of the file
    }>;

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string; // User uid of the person who made the change
    }>;
}