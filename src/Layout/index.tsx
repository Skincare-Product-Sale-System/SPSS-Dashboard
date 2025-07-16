import React, { useEffect, useState } from 'react';
import Sidebar from './VerticalLayout/Sidebar';
import Header from './Header';
import Footer from './Footer';
import RightSidebar from './RightSidebar';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { Settings } from 'lucide-react';
import CartDrawer from 'Common/CartDrawer';

import {
  changeLayout,
  changeLayoutSemiDark,
  changeSkin,
  changeLayoutMode,
  changeDirection,
  changeLayoutContentWidth,
  // changeLeftsidebarSizeType,
  changeNavigation,
  changeLeftSidebarColorType,
  changeLayoutTopbarColor
} from "../slices/thunk";

const Layout = ({ children }: any) => {

  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch<any>();

  const handleToggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const [show, setShow] = React.useState<boolean>(false);
  const handleDrawer = () => setShow(!show);

  const selectLayoutState = (state: any) => state.Layout;
  const selectLayoutProperties = createSelector(
    selectLayoutState,
    (layout) => ({
      layoutType: layout.layoutType,
      layoutSemiDarkType: layout.layoutSemiDarkType,
      layoutSkintype: layout.layoutSkintype,
      layoutModeType: layout.layoutModeType,
      layoutDirectionType: layout.layoutDirectionType,
      layoutContentWidthType: layout.layoutContentWidthType,
      layoutSidebarSizeType: layout.layoutSidebarSizeType,
      layoutNavigationType: layout.layoutNavigationType,
      layoutSidebarColorType: layout.layoutSidebarColorType,
      layoutTopbarColorType: layout.layoutTopbarColorType,
    })
  );
  // Inside your component
  const {
    layoutType,
    layoutSemiDarkType,
    layoutSkintype,
    layoutModeType,
    layoutDirectionType,
    layoutContentWidthType,
    layoutSidebarSizeType,
    layoutNavigationType,
    layoutSidebarColorType,
    layoutTopbarColorType
  } = useSelector(selectLayoutProperties);

  /*
    layout settings
    */
  useEffect(() => {
    if (
      layoutType ||
      layoutSemiDarkType ||
      layoutSkintype ||
      layoutModeType ||
      layoutDirectionType ||
      layoutContentWidthType ||
      // layoutSidebarSizeType ||
      layoutNavigationType ||
      layoutSidebarColorType ||
      layoutTopbarColorType
    ) {
      window.dispatchEvent(new Event('resize'));
      dispatch(changeLayout(layoutType));
      dispatch(changeLayoutSemiDark(layoutSemiDarkType));
      dispatch(changeSkin(layoutSkintype));
      dispatch(changeLayoutMode(layoutModeType));
      dispatch(changeDirection(layoutDirectionType));
      dispatch(changeLayoutContentWidth(layoutContentWidthType));
      // dispatch(changeLeftsidebarSizeType(layoutSidebarSizeType));
      dispatch(changeNavigation(layoutNavigationType));
      dispatch(changeLeftSidebarColorType(layoutSidebarColorType));
      dispatch(changeLayoutTopbarColor(layoutTopbarColorType));
    }
  }, [layoutType,
    layoutSemiDarkType,
    layoutSkintype,
    layoutModeType,
    layoutDirectionType,
    layoutContentWidthType,
    // layoutSidebarSizeType,
    layoutNavigationType,
    layoutSidebarColorType,
    layoutTopbarColorType,
    dispatch]);

  useEffect(() => {
    document.documentElement.classList.add("scroll-smooth", "group");
    document.body.classList.add('text-base', 'bg-body-bg', 'text-body', 'font-public', 'dark:text-zink-100', 'dark:bg-zink-800', 'group-data-[skin=bordered]:bg-body-bordered', 'group-data-[skin=bordered]:dark:bg-zink-700');

    // Đảm bảo xóa overflow-hidden nếu có
    document.body.classList.remove('overflow-hidden');

    // Đặt overflow-y của body và html để cho phép scroll
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto';

    return () => {
      document.documentElement.classList.remove("scroll-smooth", "group");
      document.body.classList.remove('text-base', 'bg-body-bg', 'text-body', 'font-public', 'dark:text-zink-100', 'dark:bg-zink-800', 'group-data-[skin=bordered]:bg-body-bordered', 'group-data-[skin=bordered]:dark:bg-zink-700');
    };
  }, []);

  return (
    <>
      <div className="group-data-[sidebar-size=sm]:min-h-sm group-data-[sidebar-size=sm]:relative">
        <Sidebar layoutType={layoutType} layoutSidebarSizeType={layoutSidebarSizeType} />
        <Header handleToggleDrawer={handleToggleDrawer} handleDrawer={handleDrawer} />
        <div className='relative min-h-screen group-data-[sidebar-size=sm]:min-h-sm'>
          <div className="group-data-[sidebar-size=lg]:ltr:md:ml-vertical-menu group-data-[sidebar-size=lg]:rtl:md:mr-vertical-menu group-data-[sidebar-size=md]:ltr:ml-vertical-menu-md group-data-[sidebar-size=md]:rtl:mr-vertical-menu-md group-data-[sidebar-size=sm]:ltr:ml-vertical-menu-sm group-data-[sidebar-size=sm]:rtl:mr-vertical-menu-sm pt-[calc(theme('spacing.header')_*_1)] pb-[calc(theme('spacing.header')_*_0.8)] px-4 group-data-[navbar=bordered]:pt-[calc(theme('spacing.header')_*_1.3)] group-data-[navbar=hidden]:pt-0 group-data-[layout=horizontal]:mx-auto group-data-[layout=horizontal]:max-w-screen-2xl group-data-[layout=horizontal]:px-0 group-data-[layout=horizontal]:group-data-[sidebar-size=lg]:ltr:md:ml-auto group-data-[layout=horizontal]:group-data-[sidebar-size=lg]:rtl:md:mr-auto group-data-[layout=horizontal]:md:pt-[calc(theme('spacing.header')_*_1.8)] group-data-[layout=horizontal]:px-3 group-data-[layout=horizontal]:group-data-[navbar=hidden]:pt-[calc(theme('spacing.header')_*_0.9)]">
            <div className='container-fluid group-data-[content=boxed]:max-w-boxed mx-auto'>
              {children}
            </div>
          </div>
          <Footer />
        </div>
      </div>
      {layoutNavigationType === "hidden" && <div className="fixed items-center bottom-6 right-12 h-header group-data-[navbar=hidden]:flex">
        <button type="button" className="inline-flex items-center justify-center size-12 p-0 transition-all duration-200 ease-linear rounded-md shadow-lg text-sky-50 bg-sky-500" onClick={handleToggleDrawer}>
          <Settings className="inline-block size-5" />
        </button>
      </div>}
      <RightSidebar isOpen={isOpen} handleToggleDrawer={handleToggleDrawer} />
      <CartDrawer show={show} handleDrawer={handleDrawer} />

    </>
  );
};

export default Layout;
