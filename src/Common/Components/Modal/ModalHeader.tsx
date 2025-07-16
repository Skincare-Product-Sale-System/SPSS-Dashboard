import React, { ElementType } from 'react';
import { useModalContext } from './ModalContext';
import { X } from 'lucide-react';

interface ModalHeaderProps {
    children: React.ReactNode;
    className?: string;
    id?: string;
    as?: ElementType;
    href?: string;
    closeButtonClass?: string;
}

const ModalHeader = ({ children, className, closeButtonClass, as: Component = "div", ...props }: ModalHeaderProps) => {
    const { onHide, handleModalToggle } = useModalContext();

    return (
        <Component
            {...props}
            className={className ? className : ''}
            onClick={onHide || (() => handleModalToggle())}
        >
            {children}
            <button data-modal-close="closeModal"
                className={closeButtonClass ? closeButtonClass : ''}
            >
                <X className='lucide lucide-x size-5'></X>
            </button>

        </Component>

    );
}

export default ModalHeader;