export default interface CrewMember {
    uid: string; // crew member uid
    
    type: "internal" | "external";   // type of crew member, internal crew members are employees of the company and external crew members are freelancers or contractors that are not employed by the company. This can be used to differentiate between internal and external crew members in the system and to apply different rules or permissions to them if needed.

    firstName: string;
    lastName: string;

    skillTags?: Array<string>;   // array of skill tags assigned to the crew member, used for filtering and searching crew members based on their skills (e.g. "sound", "lighting", "camera", "stage management", etc.)

    dateOfBirth?: Date;
    email?: string;
    phone?: string;

    roleUid: string;   // role uid of the crew member, used for determining the permissions of the crew member in the system
    passwordHash?: string;   // hashed password for authentication
    mustChangePassword?: boolean;   // if true, the crew member must change their password on next login
    locked?: boolean;   // if true, the crew member's account is locked and they cannot log in or access the system

    calendarSubscriptions?: Array<{  // calendar sync (webcal/ics) url: (Domain)/api/calendar/(crew member uid)/(calendar sync uid)/webcal or (Domain)/api/calendar/(crew member uid)/(calendar sync uid)/ics, used for synchronizing the crew member's calendar with external calendar applications like Google Calendar, Apple Calendar, Outlook, etc.
        uid: string;   // calendar sync uid
        name: string;

        type: "webcal" | "ics";
        subscribedEvents: Array<string>;   // array for subscription options (e.g. "all", "bookings", "absences", "positions", "roles", etc.) that determine which events are included in the calendar feed for the crew member.
    }>;

    timeclock: {
        enabled: boolean;   // if true, the timeclock feature is enabled for the crew member, allowing them to clock in and out of projects and events they are assigned to.
        autoGrant: "default" | boolean;   // if true, clock entries for this crew member will be automatically granted without needing manual approval. If false, clock entries will require manual approval by a manager or admin. If set to "default", the system default setting for auto granting clock entries will be applied.
        clockEntries: Array<{
            uid: string;   // timeclock entry uid
            Date: Date;  // date and time of the clock entry
            type: "clockIn" | "clockOut";   // type of the clock entry, either clock in or clock out
            comment?: string;   // optional comment to provide context for the clock entry (e.g. "Clocked in for setup", "Clocked out for lunch break", etc.)
            granted?: "auto" | boolean;   // if true, the clock entry has been granted by a manager or admin, if false, the clock entry is pending approval and will not be included in time reports or calculations until it is granted. If granting function is disabled in the system settings or if autoGrant is set to true for the crew member, this field will be set to "auto" to indicate that the clock entry is automatically granted without needing manual approval.
        }>
    };

    licenses?: Array<{
        uid: string;   // license uid
        type: 'firstAid' | 'driversLicense' | 'examination' | 'training' | 'other';   // type of the license (e.g. "forklift", "scissor lift", "first aid", etc.)
        name: string;   // name of the license (e.g. "Forklift Operator License", "Scissor Lift Certification", "First Aid Training Certificate", etc.)
        validUntil?: Date;   // optional expiration date for the license, used for tracking when licenses need to be renewed or updated.
    }>;

}