import React, { createContext, useContext, useState, useEffect } from 'react';

interface ModalContextType {
  isModal: boolean;
  setIsModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleModalToggle: () => void;
  show: boolean;
  onHide: () => void;
  modalLevel: number;
}

// Global counter to track how many modals are currently open
let openModalCount = 0;

export const ModalContext = createContext<ModalContextType>({
  isModal: false,
  setIsModal: () => { },
  handleModalToggle: () => { },
  show: false,
  onHide: () => { },
  modalLevel: 0,
});

export const useModal = () => useContext(ModalContext);

interface ModalContextProviderProps {
  show: boolean;
  onHide: () => void;
  children: React.ReactNode;
}

export const ModalContextProvider: React.FC<ModalContextProviderProps> = ({ show, onHide, children }) => {
  const [isModal, setIsModal] = useState<boolean>(false);
  const [modalLevel, setModalLevel] = useState<number>(0);

  const handleModalToggle = () => {
    setIsModal(!isModal);
  };

  useEffect(() => {
    const bodyElement = document.body;

    // Increment counter when a modal is shown
    if (show) {
      openModalCount++;
      setModalLevel(openModalCount);
      bodyElement.classList.add('overflow-hidden');
    } else {
      // Decrement counter when a modal is hidden
      if (openModalCount > 0) {
        openModalCount--;
      }

      // Only remove overflow-hidden if no modals are open
      if (openModalCount === 0) {
        bodyElement.classList.remove('overflow-hidden');
      }
    }

    // Cleanup function - ensure proper handling when component unmounts
    return () => {
      if (show) {
        openModalCount--;
        // Only remove overflow-hidden if no modals are open
        if (openModalCount === 0) {
          bodyElement.classList.remove('overflow-hidden');
        }
      }
    };
  }, [show]);

  return (
    <ModalContext.Provider value={{ isModal, setIsModal, handleModalToggle, show, onHide, modalLevel }}>
      {children}
    </ModalContext.Provider>
  );
};
