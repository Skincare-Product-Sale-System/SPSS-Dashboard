import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ModalContextProps {
  isModal: boolean;
  setIsModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleModalToggle: () => void;
  show: boolean;
  onHide: () => void;
}

interface ModalContextProviderProps {
  show: boolean;
  onHide: () => void;
  children: React.ReactNode;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalContextProvider');
  }
  return context;
};

export const ModalContextProvider: React.FC<ModalContextProviderProps> = ({ show, onHide, children }) => {
  const [isModal, setIsModal] = useState<boolean>(false);

  const handleModalToggle = () => {
    setIsModal(!isModal);
  };

  useEffect(() => {
    const bodyElement = document.body;

    // Thêm class overflow-hidden khi modal hiển thị
    if (show) {
      bodyElement.classList.add('overflow-hidden');
    } else {
      // Đảm bảo xóa class overflow-hidden khi modal đóng
      bodyElement.classList.remove('overflow-hidden');
    }

    // Cleanup function - đảm bảo luôn xóa class khi component unmount
    return () => {
      bodyElement.classList.remove('overflow-hidden');
    };
  }, [show]);

  return (
    <ModalContext.Provider value={{ isModal, setIsModal, handleModalToggle, show, onHide }}>
      {children}
    </ModalContext.Provider>
  );
};
