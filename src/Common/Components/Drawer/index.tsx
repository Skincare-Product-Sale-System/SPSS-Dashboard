import React, { ElementType } from 'react';
import { DrawerContextProvider } from './DrawerContext';
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

const Drawer = ({ children, className, show, onHide, id, as: Component = "div", ...props }: DrawerProps) => {

  return (
    <React.Fragment>
      <DrawerContextProvider show={show} onHide={onHide}>
        <Component
          {...props} id={id ? id : ''} className={`${className ? className : ''} ${!show ? "show hidden" : ""}`}
        >
          {children}
        </Component>
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
