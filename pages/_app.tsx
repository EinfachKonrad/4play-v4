import "@/styles/globals.css";
import Footer from "@/components/ui/Footer";
import { SessionProvider, useSession } from "next-auth/react";
import type { AppProps } from "next/app";
import Sidebar from "@/components/ui/Sidebar";
import { getNavigationLabelForPath } from "@/components/ui/Sidebar";
import { useRouter } from "next/router";
import Head from "next/head";
import useInstanceConfig from "@/hooks/useInstanceConfig";
import { useCallback, useEffect, useMemo, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import SoftwareTabs, { type SoftwareTab } from "@/components/ui/SoftwareTabs";
import { loadFromSessionStorage, saveToSessionStorage } from "@/lib/sessionStorage";
import { SoftwareTabContext } from "@/hooks/useSoftwareTab";

const SOFTWARE_TABS_KEY = "software-tabs-v1";

const DASHBOARD_TAB: SoftwareTab = {
  key: "/",
  basePath: "/",
  path: "/",
  label: "Dashboard",
  closable: false,
  customLabel: false,
};

function normalizePath(value: string) {
  return value.split("#")[0] || "/";
}

function getPathname(value: string) {
  return normalizePath(value).split("?")[0] || "/";
}

function getTabInstanceId(path: string) {
  const queryString = path.includes("?") ? path.split("?")[1] ?? "" : "";
  if (!queryString) return null;

  const params = new URLSearchParams(queryString);
  const instanceId = params.get("tab");
  return instanceId ? instanceId : null;
}

function getBasePath(pathname: string) {
  if (pathname === "/") return "/";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  return `/${segments[0]}`;
}

function getTabKey(pathname: string, fullPath?: string) {
  const instanceId = fullPath ? getTabInstanceId(fullPath) : null;
  if (instanceId) {
    return `${pathname}?tab=${instanceId}`;
  }

  if (pathname === "/") return "/";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) {
    return getBasePath(pathname);
  }

  return pathname;
}

function getLabelForPath(pathname: string) {
  const navigationLabel = getNavigationLabelForPath(pathname);
  if (navigationLabel) {
    return navigationLabel;
  }

  const basePath = getBasePath(pathname);
  if (basePath === "/") {
    return "Dashboard";
  }

  const slug = basePath.replace("/", "");
  if (!slug) return "Tab";

  return slug[0].toUpperCase() + slug.slice(1);
}

function appendTabInstanceToPath(path: string) {
  const [pathname, query = ""] = normalizePath(path).split("?");
  const params = new URLSearchParams(query);
  const uniqueInstance = `copy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  params.set("tab", uniqueInstance);
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function sanitizeTabs(savedTabs: unknown) {
  if (!Array.isArray(savedTabs)) {
    return [DASHBOARD_TAB];
  }

  const filteredTabs = savedTabs.filter((tab): tab is SoftwareTab => {
    if (!tab || typeof tab !== "object") return false;

    const candidate = tab as Partial<SoftwareTab>;
    const candidatePath = typeof candidate.path === "string" ? candidate.path : null;
    return (
      typeof candidate.basePath === "string" &&
      candidatePath !== null &&
      typeof candidate.label === "string" &&
      typeof candidate.closable === "boolean" &&
      (typeof candidate.customLabel === "undefined" || typeof candidate.customLabel === "boolean")
    );
  }).map((tab) => ({
    key: typeof tab.key === "string" ? tab.key : getTabKey(getPathname(tab.path), tab.path),
    basePath: tab.basePath,
    path: tab.path,
    label: tab.label,
    closable: tab.closable,
    customLabel: tab.customLabel === true,
  }));

  const withoutDashboard = filteredTabs.filter((tab) => tab.basePath !== "/");
  return [DASHBOARD_TAB, ...withoutDashboard];
}

function AppContent({ Component, pageProps }: { Component: AppProps["Component"]; pageProps: AppProps["pageProps"] }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const instanceConfig = useInstanceConfig();
  const [tabs, setTabs] = useState<SoftwareTab[]>([DASHBOARD_TAB]);
  const [activeTabKey, setActiveTabKey] = useState("/");

  const shouldShowSoftwareTabs = useMemo(() => router.pathname !== "/login", [router.pathname]);

  useEffect(() => {
    const cachedState = loadFromSessionStorage(SOFTWARE_TABS_KEY) as { tabs?: unknown; activeTabKey?: string; activeTabBasePath?: string } | null;
    if (!cachedState) return;

    const restoredTabs = sanitizeTabs(cachedState.tabs);
    setTabs(restoredTabs);

    const restoredActiveKey = typeof cachedState.activeTabKey === "string"
      ? cachedState.activeTabKey
      : typeof cachedState.activeTabBasePath === "string"
        ? cachedState.activeTabBasePath
        : "/";
    const hasActiveTab = restoredTabs.some((tab) => tab.key === restoredActiveKey);
    setActiveTabKey(hasActiveTab ? restoredActiveKey : "/");
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && router.pathname !== "/login") {
      router.push("/login");
    }
    
    // Redirect to password change if mustChangePassword is true
    if (status === "authenticated" && session?.user?.mustChangePassword && router.pathname !== "/onboarding/password") {
      router.push("/onboarding/password");
    }
  }, [status, router.pathname, session]);

  useEffect(() => {
    if (!shouldShowSoftwareTabs) return;

    const currentTabPath = normalizePath(router.asPath);
    const currentPathname = getPathname(currentTabPath);
    const currentTabKey = getTabKey(currentPathname, currentTabPath);
    const currentBasePath = getBasePath(currentPathname);

    setTabs((previousTabs) => {
      const nextTabs = sanitizeTabs(previousTabs);
      const matchingTabIndex = nextTabs.findIndex((tab) => tab.key === currentTabKey);

      if (matchingTabIndex >= 0) {
        const updatedTabs = [...nextTabs];
        updatedTabs[matchingTabIndex] = {
          ...updatedTabs[matchingTabIndex],
          key: currentTabKey,
          basePath: currentBasePath,
          path: currentTabPath,
          label: updatedTabs[matchingTabIndex].customLabel ? updatedTabs[matchingTabIndex].label : getLabelForPath(currentPathname),
        };

        return updatedTabs;
      }

      return [
        ...nextTabs,
        {
          key: currentTabKey,
          basePath: currentBasePath,
          path: currentTabPath,
          label: getLabelForPath(currentPathname),
          closable: currentBasePath !== "/",
          customLabel: false,
        },
      ];
    });

    setActiveTabKey(currentTabKey);
  }, [router.asPath, shouldShowSoftwareTabs]);

  useEffect(() => {
    saveToSessionStorage(SOFTWARE_TABS_KEY, {
      tabs,
      activeTabKey,
    });
  }, [tabs, activeTabKey]);

  function handleSelectTab(tab: SoftwareTab) {
    setActiveTabKey(tab.key);

    const currentPath = normalizePath(router.asPath);
    if (currentPath === tab.path) return;

    router.push(tab.path);
  }

  const setCurrentTabTitle = useCallback((title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    const currentTabPath = normalizePath(router.asPath);
    const currentPathname = getPathname(currentTabPath);
    const currentTabKey = getTabKey(currentPathname, currentTabPath);

    setTabs((currentTabs) => {
      const index = currentTabs.findIndex((tab) => tab.key === currentTabKey);
      if (index < 0) return currentTabs;

      const nextTabs = [...currentTabs];
      nextTabs[index] = {
        ...nextTabs[index],
        label: nextTitle,
        customLabel: true,
      };
      return nextTabs;
    });
  }, [router.asPath]);

  const resetCurrentTabTitle = useCallback(() => {
    const currentTabPath = normalizePath(router.asPath);
    const currentPathname = getPathname(currentTabPath);
    const currentTabKey = getTabKey(currentPathname, currentTabPath);
    const defaultLabel = getLabelForPath(currentPathname);

    setTabs((currentTabs) => {
      const index = currentTabs.findIndex((tab) => tab.key === currentTabKey);
      if (index < 0) return currentTabs;

      const nextTabs = [...currentTabs];
      nextTabs[index] = {
        ...nextTabs[index],
        label: defaultLabel,
        customLabel: false,
      };
      return nextTabs;
    });
  }, [router.asPath]);

  function handleCloseTab(tabKey: string) {
    if (tabKey === "/") return;

    let navigationPathAfterClose: string | null = null;

    setTabs((currentTabs) => {
      const index = currentTabs.findIndex((tab) => tab.key === tabKey);
      if (index < 0) return currentTabs;

      const nextTabs = currentTabs.filter((tab) => tab.key !== tabKey);

      if (activeTabKey === tabKey) {
        const rightNeighbor = currentTabs[index + 1];
        const leftNeighbor = currentTabs[index - 1];
        const fallbackTab = rightNeighbor ?? leftNeighbor ?? DASHBOARD_TAB;

        navigationPathAfterClose = fallbackTab.path;
        setActiveTabKey(fallbackTab.key);
      }

      return nextTabs;
    });

    if (navigationPathAfterClose) {
      const currentPath = normalizePath(router.asPath);
      const targetPath = normalizePath(navigationPathAfterClose);
      if (currentPath !== targetPath) {
        router.push(targetPath);
      }
    }
  }

  const handleCloseAllTabs = useCallback(() => {
    setTabs([DASHBOARD_TAB]);
    setActiveTabKey("/");

    if (normalizePath(router.asPath) !== "/") {
      router.push("/");
    }
  }, [router]);

  const handleCloseOtherTabs = useCallback((tabKey: string) => {
    let navigationPathAfterClose: string | null = null;
    let activeKeyAfterClose = "/";

    setTabs((currentTabs) => {
      const selectedTab = currentTabs.find((tab) => tab.key === tabKey);
      if (!selectedTab) {
        return currentTabs;
      }

      const nextTabs = selectedTab.key === "/"
        ? [DASHBOARD_TAB]
        : [DASHBOARD_TAB, selectedTab];

      navigationPathAfterClose = selectedTab.path;
      activeKeyAfterClose = selectedTab.key;
      return nextTabs;
    });

    setActiveTabKey(activeKeyAfterClose);

    if (navigationPathAfterClose && normalizePath(router.asPath) !== normalizePath(navigationPathAfterClose)) {
      router.push(navigationPathAfterClose);
    }
  }, [router]);

  const handleDuplicateTab = useCallback((tab: SoftwareTab) => {
    if (tab.basePath === "/") {
      return;
    }

    const duplicatedPath = appendTabInstanceToPath(tab.path);
    const duplicatedPathname = getPathname(duplicatedPath);
    const duplicatedKey = getTabKey(duplicatedPathname, duplicatedPath);

    setTabs((currentTabs) => {
      if (currentTabs.some((candidate) => candidate.key === duplicatedKey)) {
        return currentTabs;
      }

      const selectedIndex = currentTabs.findIndex((candidate) => candidate.key === tab.key);
      const insertAt = selectedIndex >= 0 ? selectedIndex + 1 : currentTabs.length;
      const duplicatedTab: SoftwareTab = {
        key: duplicatedKey,
        basePath: getBasePath(duplicatedPathname),
        path: duplicatedPath,
        label: `${tab.label} (Kopie)`,
        closable: true,
        customLabel: true,
      };

      const nextTabs = [...currentTabs];
      nextTabs.splice(insertAt, 0, duplicatedTab);
      return nextTabs;
    });

    setActiveTabKey(duplicatedKey);
    router.push(duplicatedPath);
  }, [router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex">
        <div className="m-auto">
          <Spinner />
        </div>
      </main>
    );
  }

  if (status === "unauthenticated" && router.pathname !== "/login") {
    return null;
  }

  return (
    <>
      <Head>
        <title>wird geladen... &bull; {instanceConfig?.name ?? "4play"}</title>
      </Head>
      <main className="min-h-screen flex">
        {router.pathname !== "/login" && (
          <div className="order-1">
            <Sidebar />
          </div>
        )}
        <div className="order-2 flex-1 flex flex-col">
          {shouldShowSoftwareTabs ? (
            <SoftwareTabs
              tabs={tabs}
              activeTabKey={activeTabKey}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onCloseAllTabs={handleCloseAllTabs}
              onCloseOtherTabs={handleCloseOtherTabs}
              onDuplicateTab={handleDuplicateTab}
            />
          ) : null}
          <SoftwareTabContext.Provider value={{ setCurrentTabTitle, resetCurrentTabTitle }}>
            <div className="flex-1 p-10">
              <Component {...pageProps} />
            </div>
          </SoftwareTabContext.Provider>
          <Footer />
        </div>
      </main>
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...restPageProps } = pageProps;

  return (
    <SessionProvider session={session}>
      <AppContent Component={Component} pageProps={restPageProps} />
    </SessionProvider>
  );
}
