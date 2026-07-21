import { createContext, useContext } from "react";

type SoftwareTabContextValue = {
  setCurrentTabTitle: (title: string) => void;
  resetCurrentTabTitle: () => void;
};

const noop = () => {};

export const SoftwareTabContext = createContext<SoftwareTabContextValue>({
  setCurrentTabTitle: noop,
  resetCurrentTabTitle: noop,
});

export default function useSoftwareTab() {
  return useContext(SoftwareTabContext);
}
