import React, { createContext, useContext, ReactNode, ElementType, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
interface DropdownContextType {
  toggleOpen: any;
}
const DropDownContext = createContext<DropdownContextType | undefined>(undefined);
interface DropdownProps {
  children?: ReactNode;
  as?: ElementType;
  className?: string;
  active?: any;
  id?: any;
  subitemId?: any;
}
const Dropdown = ({ as: Component = 'div', children, className, id, subitemId }: DropdownProps) => {
  const toggleOpen = (ref: any) => {
    if (ref) {
      activateParentDropdown(ref);
    } else {
      initActiveMenu();
    }
  }; // Empty dependency array

  const activateParentDropdown = (item: any) => {
    item.classList.add("active");
    const openDropdowns = document.querySelectorAll('.dropdown-button.active');
    const mainAttrItem = item?.closest("div[main-item]");

    openDropdowns.forEach((dropdown: any) => {
      dropdown.classList.remove('active', 'show');
      const dropdownsToShow = dropdown?.closest("div[main-item]")?.querySelectorAll('div.dropdown-content:not(.hidden)');
      if (dropdownsToShow && dropdownsToShow.length > 0)
        dropdownsToShow.forEach((elem: any) => {
          elem.classList.add('hidden');
        });
    });

    item.classList.add("active");
    if (!(document.documentElement.getAttribute("data-layout") === "vertical" && document.documentElement.getAttribute("data-sidebar-size") === "sm"))
      item.nextElementSibling?.classList.remove("hidden");
    let parentCollapseDiv = item?.closest(".dropdown-content");
    const parentDropButton = parentCollapseDiv?.parentElement.firstChild;
    parentDropButton?.classList.add("active");
    parentDropButton?.classList.add("show");
    parentDropButton?.parentElement?.querySelector(".dropdown-content")?.classList.remove("hidden");

    if (parentDropButton) {
      const parentParentCollapseDiv = parentDropButton?.closest(".dropdown-content");
      const parentParentDropButton = parentParentCollapseDiv?.parentElement.firstChild;
      parentParentDropButton?.classList.add("active");
      parentParentDropButton?.classList.add("show");
      parentParentDropButton?.parentElement?.querySelector(".dropdown-content")?.classList.remove("hidden");
    }

    mainAttrItem?.classList.add('active', 'show');
    if (!(document.documentElement.getAttribute("data-layout") === "vertical" && document.documentElement.getAttribute("data-sidebar-size") === "sm"))
      mainAttrItem?.querySelector(".dropdown-content").classList.remove("hidden");
  };

  function activeOnLoad(item: any) {
    if (item?.classList.contains('dropdown-content')) {
      if (item?.parentElement) {
        const parentButton = item?.parentElement.children[0];
        parentButton?.classList.add("show");
        const mainAttrItem = item?.closest("div[main-item]");
        item?.parentElement.children[1].classList?.add("hidden");
        mainAttrItem?.querySelector(".dropdown-content")?.classList.remove("hidden");
      }
    } else {
      item?.classList.add("active");
      item?.classList.add("show");

      let parentCollapseDiv = item?.closest(".dropdown-content");
      if (document.documentElement.getAttribute("data-layout") === "vertical" && document.documentElement.getAttribute("data-sidebar-size") !== "sm") {
        parentCollapseDiv?.classList.remove('hidden');
        parentCollapseDiv?.classList.remove('hidden');
      }
      const parentDropButton = parentCollapseDiv?.parentElement.firstChild;
      parentDropButton?.classList.add("active");
      parentDropButton?.classList.add("show");

      const mainParentContent = parentCollapseDiv?.parentElement.closest(".dropdown-content");
      if (mainParentContent) {
        if (document.documentElement.getAttribute("data-layout") === "vertical" && document.documentElement.getAttribute("data-sidebar-size") !== "sm") {
          mainParentContent?.classList.remove('hidden');
        }
        const mainButton = mainParentContent?.parentElement.children[0];
        mainButton?.classList.add("active", "show");
      }
    }
  }
  function removeActivation(items: any) {
    items.forEach((item: any) => {
      if (item.classList.contains("dropdown-button")) {
        const menu = item?.nextElementSibling;
        menu?.classList.add('hidden');
      }
      // }
      if (item.classList.contains("active")) {
        item.classList.remove("active");
        item.classList.remove("show");
        const parentEle = item?.closest(".dropdown-content");
        if (parentEle) {
          parentEle.classList.add("hidden");
        }
      }
    });
  }

  const currentPath = useLocation();
  const initActiveMenu = useCallback(() => {
    const pathName = process.env.PUBLIC_URL + currentPath.pathname;
    const ul: any = document.getElementById("navbar-nav");
    if (!ul) return; // Kiểm tra xem ul có tồn tại không

    const items = ul.getElementsByTagName("a");
    let itemsArray = [...items]; // converts NodeList to Array
    removeActivation(itemsArray);
    let matchingMenuItem = itemsArray.find((x) => {
      return x.pathname === pathName;
    });
    if (matchingMenuItem) {
      activeOnLoad(matchingMenuItem);
    }
  }, [currentPath.pathname]);

  useEffect(() => {
    // Thay thế behavior: 'smooth' bằng behavior: 'auto' để tránh lỗi scroll
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Thêm timeout để đảm bảo menu được khởi tạo sau khi component đã render
    const timer = setTimeout(() => {
      initActiveMenu();
    }, 0);
    return () => clearTimeout(timer);
  }, [initActiveMenu]);
  return (
    <DropDownContext.Provider value={{ toggleOpen }}>
      <Component
        main-item={id}
        sub-item={subitemId}
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
export const Trigger: React.FC<TriggerProps> = ({ children, className, id }) => {
  const { toggleOpen } = useContext(DropDownContext)!;
  const contentRef = useRef<any>(null);
  return (
    <>
      <Link
        ref={contentRef}
        id={id} to="/#" onClick={(e: any) => {
          e.preventDefault();
          toggleOpen(contentRef.current);
        }} className={className}>
        {children}
      </Link>
    </>
  );
};
interface ContentProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  currentPath?: any;
}
const Content: React.FC<ContentProps> = ({ as: Component = 'div', className, children }) => {
  const getClassName = className ? className : "absolute z-50 py-2 mt-1 text-left list-none bg-white rounded-md shadow-md dropdown-menu min-w-max dark:bg-zink-400";
  return (
    <Component
      className={getClassName}
    >
      {children}
    </Component>
  );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
export { Dropdown };