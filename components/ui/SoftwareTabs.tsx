import { Copy, X } from "lucide-react";
import { useState } from "react";
import ContextMenu, { ContextMenuState } from "./ContextMenu";

export type SoftwareTab = {
  key: string;
  basePath: string;
  path: string;
  label: string;
  closable: boolean;
  customLabel?: boolean;
};

type SoftwareTabsProps = {
  tabs: SoftwareTab[];
  activeTabKey: string;
  onSelectTab: (tab: SoftwareTab) => void;
  onCloseTab: (key: string) => void;
  onCloseAllTabs: () => void;
  onCloseOtherTabs: (key: string) => void;
  onDuplicateTab: (tab: SoftwareTab) => void;
};

export default function SoftwareTabs({
  tabs,
  activeTabKey,
  onSelectTab,
  onCloseTab,
  onCloseAllTabs,
  onCloseOtherTabs,
  onDuplicateTab,
}: SoftwareTabsProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState<SoftwareTab> | null>(null);
  const closableTabsCount = tabs.filter((tab) => tab.closable).length;

  return (
    <div className="hidden border-b border-gray-800 md:block">
      <ul className="flex min-w-full items-end gap-1 overflow-x-auto px-4 pt-4">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTabKey;

          return (
            <li key={tab.key} className="min-w-[180px] flex-1 basis-0 shrink-0">
              <div
                className={[
                  "group flex w-full items-center gap-2 rounded-t-md border border-gray-700 border-b-0 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-gray-800 text-white"
                    : "bg-gray-900/40 text-gray-300 hover:bg-gray-800/70 hover:text-white",
                ].join(" ")}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  setContextMenu({
                    x: event.clientX,
                    y: event.clientY,
                    payload: tab,
                    items: [
                      {
                        id: "duplicate",
                        label: "Diesen Tab duplizieren",
                        icon: Copy,
                        disabled: tab.basePath === "/",
                        onSelect: onDuplicateTab,
                      },
                      {
                        id: "close-others",
                        label: "Alle Tabs bis auf diesen schließen",
                        disabled: closableTabsCount === 0,
                        onSelect: (selectedTab) => onCloseOtherTabs(selectedTab.key),
                      },
                      {
                        id: "close-all",
                        label: "Alle Tabs schließen",
                        disabled: closableTabsCount === 0,
                        danger: true,
                        onSelect: onCloseAllTabs,
                      },
                    ],
                  });
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectTab(tab)}
                  className="cursor-pointer flex-1 truncate text-left"
                  title={tab.label}
                >
                  {tab.label}
                </button>
                {tab.closable ? (
                  <button
                    type="button"
                    onClick={() => onCloseTab(tab.key)}
                    className="cursor-pointer rounded p-0.5 text-gray-400 hover:bg-gray-700 hover:text-white"
                    aria-label={`${tab.label} schließen`}
                    title={`${tab.label} schließen`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
    </div>
  );
}
