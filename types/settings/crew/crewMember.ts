export default interface CrewMember {
    uuid: string; // crew member uuid (u-xxx)
    
    type: "internal" | "external";   // type of crew member, internal crew members are employees of the company and external crew members are freelancers or contractors that are not employed by the company. This can be used to differentiate between internal and external crew members in the system and to apply different rules or permissions to them if needed.

    firstName: string;
    lastName: string;

    skillTags?: Array<string>;   // array of skill tags assigned to the crew member, used for filtering and searching crew members based on their skills (e.g. "sound", "lighting", "camera", "stage management", etc.)

    dateOfBirth?: Date;
    email?: string;
    phone?: string;

    roleUuid: string;   // role uuid (r-xxx) of the crew member, used for determining the permissions of the crew member in the system

    defaultDayRate?: number;   // only for external crew members, the day rate of the crew member.

    calendarSubscriptions?: Array<{  // calendar sync (webcal/ics) url: (Domain)/api/calendar/(crew member uuid)/(calendar sync uuid)/webcal or (Domain)/api/calendar/(crew member uuid)/(calendar sync uuid)/ics, used for synchronizing the crew member's calendar with external calendar applications like Google Calendar, Apple Calendar, Outlook, etc.
        uuid: string;   // calendar sync uuid (cs-xxx)
        name: string;

        type: "webcal" | "ics";
        subscribedEvents: Array<string>;   // array for subscription options (e.g. "all", "bookings", "absences", "positions", "roles", etc.) that determine which events are included in the calendar feed for the crew member.
    }>;

    timeclock: {
        enabled: boolean;   // if true, the timeclock feature is enabled for the crew member, allowing them to clock in and out of projects and events they are assigned to.
        autoGrant: "default" | boolean;   // if true, clock entries for this crew member will be automatically granted without needing manual approval. If false, clock entries will require manual approval by a manager or admin. If set to "default", the system default setting for auto granting clock entries will be applied.
        clockEntries: Array<{
            uuid: string;   // timeclock entry uuid (tc-xxx)
            Date: Date;  // date and time of the clock entry
            type: "clockIn" | "clockOut";   // type of the clock entry, either clock in or clock out
            comment?: string;   // optional comment to provide context for the clock entry (e.g. "Clocked in for setup", "Clocked out for lunch break", etc.)
            granted?: "auto" | boolean;   // if true, the clock entry has been granted by a manager or admin, if false, the clock entry is pending approval and will not be included in time reports or calculations until it is granted. If granting function is disabled in the system settings or if autoGrant is set to true for the crew member, this field will be set to "auto" to indicate that the clock entry is automatically granted without needing manual approval.
        }>
    };

}