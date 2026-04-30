export default interface Role {
    uuid: string; // role uuid (r-xxx)
    name: string; // role name (e.g. "Crew Member", "Manager", "Admin", etc.)
    description?: string; // role description (optional)
    color?: string;   // role color in hex format (e.g. "#FF0000" for red), used for displaying the role

    permissions: Array<string>; // array of permissions assigned to the role (e.g. "viewCalendar", "editCalendar", "viewContacts", "editContacts", "viewEquipment", "editEquipment", "viewProjects", "editProjects", "manageUsers", etc.)
}