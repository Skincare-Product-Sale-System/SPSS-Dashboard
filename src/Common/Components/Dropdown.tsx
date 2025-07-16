import React, { useState, createContext, useContext, ReactNode, ElementType, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Transition } from '@headlessui/react';

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOpen: () => void;
}

const DropDownContext = createContext<DropdownContextType | undefined>(undefined);

interface DropdownProps {
  children?: ReactNode;
  as?: ElementType;
  className?: string;
}

const Dropdown = ({ as: Component = 'div', children, className }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const toggleOpen = useCallback(() => {
    setOpen((previousState) => !previousState);
  }, []); // Empty dependency array

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (open && toggleOpen) {
          toggleOpen();
        }
      }
    };

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [open, toggleOpen]); // Include toggleOpen as a dependency

  return (
    <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <Component
        ref={dropdownRef}
        className={`dropdown ${className}`}
      >
        {children}
      </Component>
    </DropDownContext.Provider>
  );
};

interface TriggerProps {
  children: ReactNode;
  type?: ElementType;
  className?: string;
  id?: string;
  href?: any;
}

export const Trigger: React.FC<TriggerProps> = ({ type, children, className, id }) => {
  const { open, toggleOpen } = useContext(DropDownContext)!;

  const getClassNameButton = className ? className : "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";
  const getClassNameLink = className ? className : "transition-all duration-200 ease-linear bg-white border-dashed dropdown-toggle text-custom-500 btn border-custom-500 hover:text-custom-500 hover:bg-custom-50 hover:border-custom-600 focus:text-custom-600 focus:bg-custom-50 focus:border-custom-600 active:text-custom-600 active:bg-custom-50 active:border-custom-600 dark:focus:ring-custom-400/20 dark:bg-custom-400/20 ";
  return (
    <>
      {type === 'a' ? (
        <Link id={id} to="/#" onClick={(e: any) => {
          e.preventDefault();
          toggleOpen();
        }} className={getClassNameLink + (open ? " show" : "")}>
          {children}
        </Link>
      ) : (
        <button id={id} onClick={toggleOpen} className={getClassNameButton}>
          {children}
        </button>
      )}
    </>
  );
};


interface ContentProps {
  as?: ElementType;
  align?: 'left' | 'right';
  className?: string;
  width?: string;
  contentClasses?: string;
  children: ReactNode;
  placement?: 'right-end' | 'start-end' | 'top-end' | 'bottom-start' | 'bottom-end' | 'top-start';
}

const Content: React.FC<ContentProps> = ({ as: Component = 'div', className, children, placement }) => {
  const { open, setOpen } = useContext(DropDownContext)!;

  // Increase the default z-index to ensure dropdown appears above all elements
  const getClassName = className || "absolute z-[9999] py-2 mt-1 text-left list-none bg-white rounded-md shadow-md dropdown-menu min-w-max dark:bg-zink-400";

  const [placementState, setPlacement] = useState('right-end' as 'right-end' | 'start-end' | 'top-end' | 'bottom-start' | 'bottom-end' | 'top-start');

  useEffect(() => {
    if (placement) setPlacement(placement);
  }, [placement]); // Add dependency array to useEffect

  const dropdownElementRef = useRef<HTMLDivElement>(null);

  const isRtl = document.getElementsByTagName("html")[0].getAttribute("dir");

  // Handle positioning for table environments
  useEffect(() => {
    if (open && dropdownElementRef.current) {
      const dropdownElement = dropdownElementRef.current;

      // Check if this dropdown is inside a table
      const isInTable = dropdownElement.closest('table') !== null ||
        className?.includes('table-dropdown-content');

      if (isInTable) {
        // For table dropdowns, use fixed positioning to escape table context
        dropdownElement.style.position = 'fixed';
        dropdownElement.style.zIndex = '9999';

        // Get the trigger button position
        const triggerElement = dropdownElement.parentElement?.querySelector('button');
        if (triggerElement) {
          const rect = triggerElement.getBoundingClientRect();

          // Position based on placement
          if (placementState.includes('top')) {
            dropdownElement.style.bottom = `${window.innerHeight - rect.top + 5}px`;
          } else {
            dropdownElement.style.top = `${rect.bottom + 5}px`;
          }

          // Default to left positioning instead of right
          dropdownElement.style.left = `${rect.left}px`;
        }
      }
    }
  }, [open, placement, className]);

  const getDropdownStyle = () => {
    if (open && dropdownElementRef.current) {
      const dropdownElement = dropdownElementRef.current;

      // Skip inline styling for table dropdowns as they're handled by the useEffect
      if (className?.includes('table-dropdown-content')) {
        return {};
      }

      dropdownElement.style.position = 'absolute';
      dropdownElement.style.zIndex = '9999';

      // Ensure the dropdown is visible by adding a higher stacking context
      // Default all placements to left side positioning
      if (placementState === 'right-end') {
        dropdownElement.style.inset = '0px auto auto 0px';
        dropdownElement.style.margin = '0px';
        dropdownElement.style.transform = 'translate(0px, 54px)';
      }
      else if (placementState === 'start-end') {
        dropdownElement.style.inset = '0px auto auto 0px';
        dropdownElement.style.margin = '0px';
        dropdownElement.style.transform = 'translate(0px, 20px)';
      }
      else if (placementState === 'top-end') {
        dropdownElement.style.inset = 'auto auto 0px 0px';
        dropdownElement.style.margin = '0px';
        dropdownElement.style.transform = 'translate(0px, -30px)';
      }
      else if (placementState === 'bottom-start') {
        dropdownElement.style.inset = '0px auto auto 0px';
        dropdownElement.style.margin = '0px';
        dropdownElement.style.transform = 'translate(0px, 54px)';
      }
      else if (placementState === 'bottom-end') {
        dropdownElement.style.inset = '0px auto auto 0px';
        dropdownElement.style.margin = '0px';
        dropdownElement.style.transform = 'translate(0px, 39px)';
      }
      else if (placementState === 'top-start') {
        dropdownElement.style.inset = 'auto auto 0px 0px';
        dropdownElement.style.margin = '0px';
        dropdownElement.style.transform = 'translate(0px, -95px)';
      }
    }
    return {};
  };

  return (
    <Transition
      as={React.Fragment}
      show={open}
    >
      {(status: any) => (
        <Component
          ref={dropdownElementRef}
          onClick={() => setOpen(false)}
          className={`${getClassName} ${status === 'entered' ? 'transition-all' : ''}`}
          style={getDropdownStyle()}
        >
          {children}
        </Component>
      )}
    </Transition>
  );
};

// interface DropdownLinkProps {
//   className?: string;
//   children: ReactNode;
//   [key: string]: any; // To accept other props for Link
// }

// const DropdownLink: React.FC<DropdownLinkProps> = ({ className = '', children, ...props }) => {
//   return (
//     <Link
//       to="#"
//       {...props}
//       className={`block w-full px-4 py-2 text-left text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover-bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out ${className}`}
//     >
//       {children}
//     </Link>
//   );
// };

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
// Dropdown.Link = DropdownLink;

export { Dropdown };
