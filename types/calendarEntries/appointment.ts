export default interface Appointment {
    uuid: string; // appointment uuid (a-xxx)

    eventUuid: string; // event uuid (e-xxx) that the appointment is linked to

    name: string;
    description: string;

    location: string;   // location name (e.g. "Main Stage", "Rehearsal Room", "Warehouse", "5 Spooner Street", etc.)

    date: {
        start: Date;  // appointment start date and time
        end: Date;    // appointment end date and time
    }

    repeat?: {
        interval: number;   // repeat interval (e.g. 1 for every day, 2 for every 2 days, etc.)
        unit: "day" | "week" | "month" | "year";   // repeat unit (e.g. "day", "week", "month", "year")
        iterations?: number;   // number of iterations (e.g. 5 for repeating 5 times)
        endDate?: Date;   // end date of the repeat (e.g. "2024-12-31"), if not set, the repeat will continue indefinitely until the iterations are reached or the appointment is deleted
    }
    
    crew?: Array<{
        uuid: string;   // crew member uuid (u-xxx)
    }>;
}
