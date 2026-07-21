import { LucideIcon } from "lucide-react";
import React, { useEffect } from "react";

export type ContextMenuItem<TPayload> = {
  id: string;
  label: string;
  onSelect: (payload: TPayload) => void;
  icon?: LucideIcon;
  disabled?: boolean;
  danger?: boolean;
};

export type ContextMenuState<TPayload> = {
  x: number;
  y: number;
  payload: TPayload;
  items: ContextMenuItem<TPayload>[];
};

type ContextMenuProps<TPayload> = {
  menu: ContextMenuState<TPayload> | null;
  onClose: () => void;
};

export default function ContextMenu<TPayload>({ menu, onClose }: ContextMenuProps<TPayload>) {
  useEffect(() => {
    if (!menu) {
      return;
    }

    const closeOnPointerDown = () => onClose();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("scroll", closeOnPointerDown, true);
    window.addEventListener("resize", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("scroll", closeOnPointerDown, true);
      window.removeEventListener("resize", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu, onClose]);

  if (!menu) {
    return null;
  }

  return (
    <div
      className="fixed z-50 min-w-[180px] rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-2xl"
      style={{ top: menu.y, left: menu.x }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {menu.items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={item.disabled}
          className={`text-xs h-full cursor-pointer inline-flex w-full px-2 py-1.5 text-left text-sm transition-colors ${item.disabled ? "cursor-not-allowed text-neutral-500" : item.danger ? "text-red-400 hover:bg-red-950/40" : "text-gray-200 hover:bg-neutral-800"}`}
          onClick={() => {
            if (item.disabled) {
              return;
            }

            item.onSelect(menu.payload);
            onClose();
          }}
        >
          {item.icon ? <item.icon className="my-auto mr-2 h-3 w-3" /> : null}
          {item.label}
        </button>
      ))}
    </div>
  );
}