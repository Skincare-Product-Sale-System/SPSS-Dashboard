import React, { createContext, useContext } from 'react';

export interface DrawerContextType {
  show?: any;
  onHide?: any;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawerContext = () => {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawerContext must be used within a DrawerContextProvider');
  }
  return context;
};

interface DrawerContextProviderProps {
  children: React.ReactNode;
  show: any;
  onHide: () => void;
}

export const DrawerContextProvider: React.FC<DrawerContextProviderProps> = ({ show, onHide, children }) => {
  return (
    <DrawerContext.Provider value={{ show, onHide }}>
      {children}
    </DrawerContext.Provider>
  );
};
