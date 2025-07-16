import React, { createContext, useContext, useState, useEffect } from 'react';

interface DrawerContextType {
  show?: any;
  onHide?: any;
  drawerLevel: number;
}

// Global counter to track how many drawers are currently open
let openDrawerCount = 0;

const DrawerContext = createContext<DrawerContextType>({
  show: false,
  onHide: () => { },
  drawerLevel: 0
});

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
  const [drawerLevel, setDrawerLevel] = useState<number>(0);

  useEffect(() => {
    const bodyElement = document.body;

    // Increment counter when a drawer is shown
    if (show) {
      openDrawerCount++;
      setDrawerLevel(openDrawerCount);
      bodyElement.classList.add('overflow-hidden');
    } else {
      // Decrement counter when a drawer is hidden
      if (openDrawerCount > 0) {
        openDrawerCount--;
      }

      // Only remove overflow-hidden if no drawers are open
      if (openDrawerCount === 0) {
        bodyElement.classList.remove('overflow-hidden');
      }
    }

    // Cleanup function - ensure proper handling when component unmounts
    return () => {
      if (show) {
        openDrawerCount--;
        // Only remove overflow-hidden if no drawers are open
        if (openDrawerCount === 0) {
          bodyElement.classList.remove('overflow-hidden');
        }
      }
    };
  }, [show]);

  return (
    <DrawerContext.Provider value={{ show, onHide, drawerLevel }}>
      {children}
    </DrawerContext.Provider>
  );
};
