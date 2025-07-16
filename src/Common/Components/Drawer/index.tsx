import React, { ElementType } from 'react';
import { DrawerContextProvider, useDrawerContext } from './DrawerContext';
import DrawerHeader from './DrawerHeader';
import { DrawerBody, DrawerFooter, DrawerTitle } from './DrawerContent';

interface DrawerProps {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  show?: any;
  onHide?: any;
}

const DrawerInner = ({ children, className, id, as: Component = "div", ...props }: Omit<DrawerProps, 'show' | 'onHide'>) => {
  const { drawerLevel } = useDrawerContext();

  // Calculate z-index based on drawer level (1050 base + level)
  const zIndexValue = drawerLevel > 1 ? `z-[${1050 + drawerLevel}]` : 'z-[1050]';

  return (
    <Component
      {...props}
      id={id ? id : ''}
      className={`${className ? className : ''} ${zIndexValue}`}
    >
      {children}
    </Component>
  );
};

const Drawer = ({ children, className, show, onHide, id, as, ...props }: DrawerProps) => {
  return (
    <React.Fragment>
      <DrawerContextProvider show={show} onHide={onHide}>
        <DrawerInner
          className={`${className ? className : ''} ${!show ? "show hidden" : ""}`}
          id={id}
          as={as}
          {...props}
        >
          {children}
        </DrawerInner>
      </DrawerContextProvider>
      <div onClick={onHide} className={`fixed inset-0 bg-slate-900/40 dark:bg-zink-800/70 z-[1049] backdrop-overlay ${!show ? "hidden" : ""}`} id="backDropDiv"></div>
    </React.Fragment>
  );
};

export default Object.assign(Drawer, {
  Header: DrawerHeader,
  Title: DrawerTitle,
  Body: DrawerBody,
  Footer: DrawerFooter
});
