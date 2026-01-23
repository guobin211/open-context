import React, { createContext } from 'react';

export interface GlobalContextValue {}

const GlobalContext = createContext<GlobalContextValue>({});

export const useGlobalContext = () => React.useContext(GlobalContext);

export const GlobalContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <GlobalContext.Provider value={{}}>{children}</GlobalContext.Provider>;
};
