import { useState, useEffect } from "react";
import { loadFromSessionStorage, saveToSessionStorage } from "@/lib/sessionStorage";
import Instance from "@/types/settings/instance";

async function fetchLocalStorage() {
        const storedInstance = loadFromSessionStorage("instanceConfig") as Instance | null;
        if (storedInstance) return storedInstance;
}

export default function useInstanceConfig() {
    const [instanceConfig, setInstanceConfig] = useState<Instance | null>(null);

    useEffect(() => {
        async function fetchInstanceConfig() {
            const localData = await fetchLocalStorage();
            if (localData) {
                setInstanceConfig(localData);
                return;
            }
            try {
                const response = await fetch("/api/settings/instance");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                if (process.env.DEV_INSTANCE === "true") {
                    console.log("[useInstanceConfig] Fetched instance config from API:", response);
                }
                const data: Instance = await response.json();
                if (process.env.DEV_INSTANCE === "true") {
                    console.log("[useInstanceConfig] Fetched instance config data:", data);
                }
                setInstanceConfig(data);
                saveToSessionStorage("instanceConfig", data);
            } catch (error) {
                console.error(error);
            }
        }

        fetchInstanceConfig();
    }, []);

    return instanceConfig;
}
