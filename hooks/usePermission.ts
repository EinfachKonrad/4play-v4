import { useSession } from "next-auth/react";

export function usePermissions(): string[] {
    const { data: session } = useSession();
    return session?.user?.permissions ?? [];
}