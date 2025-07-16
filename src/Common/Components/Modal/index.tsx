import React, { ElementType } from "react";
import ModalHeader from "./ModalHeader";
import { ModalBody, ModalFooter, ModalTitle } from "./ModalContent";
import { ModalContextProvider, useModal } from "./ModalContext";

interface ModalProps {
    show?: any;
    onHide?: any;
    className?: string;
    children: React.ReactNode;
    as?: ElementType;
    id?: string;
    placement?: string;
    dialogClassName?: string;
}

const ModalInner = ({ children, className, id, dialogClassName, as: Component = "div", ...props }: Omit<ModalProps, 'show' | 'onHide'>) => {
    const { modalLevel } = useModal();

    // Calculate z-index based on modal level (1050 base + level)
    const zIndexValue = modalLevel > 1 ? `z-[${1050 + modalLevel}]` : 'z-[1050]';

    return (
        <div {...props} id={id ? id : "defaultModal"} className={`${className} ${zIndexValue}`}>
            <Component
                className={dialogClassName ? dialogClassName : ''}
            >
                {children}
            </Component>
        </div>
    );
};

const Modal = ({ show, onHide, children, className, placement, id, dialogClassName, as, ...props }: ModalProps) => {
    return (
        <React.Fragment>
            <ModalContextProvider show={show} onHide={onHide}>
                <ModalInner
                    className={`${className} ${!show ? "show hidden" : ""}`}
                    id={id}
                    dialogClassName={dialogClassName}
                    as={as}
                    {...props}
                >
                    {children}
                </ModalInner>
            </ModalContextProvider>
            <div onClick={onHide} className={`fixed inset-0 bg-slate-900/40 dark:bg-zink-800/70 z-[1049] backdrop-overlay ${!show ? "hidden" : ""}`} id="backDropDiv"></div>
        </React.Fragment>
    );
};

export default Object.assign(Modal, {
    Header: ModalHeader,
    Title: ModalTitle,
    Body: ModalBody,
    Footer: ModalFooter
});