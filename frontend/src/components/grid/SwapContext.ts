import React from 'react';

export interface SwapSelection {
  personalId: string;
  dia: number;
}

export const SwapContext = React.createContext<{
  selected: SwapSelection | null;
  setSelected: (s: SwapSelection | null) => void;
}>({
  selected: null,
  setSelected: () => {},
});
