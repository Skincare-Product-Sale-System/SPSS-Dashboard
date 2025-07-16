import React, { useEffect, useRef, useState } from 'react';

// Images
import logoSm from "assets/images/logo-sm.png";
import avatar1 from "assets/images/users/avatar-1.png";
import avatar5 from "assets/images/users/avatar-5.png";
import user2 from "assets/images/users/user-2.jpg";
import img2 from "assets/images/small/img-2.jpg";

import userDummayImage from "assets/images/users/user-dummy-img.jpg";
import SimpleBar from 'simplebar-react';


// Icons
import { MessagesSquare, SquareUser, Bot, UserRound, ScrollText, Settings, ChevronsLeft, Search, Plus, X, MoreVertical, Phone, MapPin, Mail, BellRing, Video, PanelRightOpen, Mic, Image, Send, PhoneCall, ImagePlus, Star } from 'lucide-react';
import Tab from 'Common/Components/Tab/Tab';
import { Nav } from 'Common/Components/Tab/Nav';
import { Link } from 'react-router-dom';
import { Dropdown } from 'Common/Components/Dropdown';
import { ContactList, RecentChats, RecentFind, Documents } from "Common/data";

// react-redux
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

import {
    getChat as onGetChat,
    addChat as onAddChat,
    deleteChat as onDeleteChat,
    bookmarkChat as onBookmarkChat
} from 'slices/thunk';
import Drawer from 'Common/Components/Drawer';
import Modal from 'Common/Components/Modal';
import PrismCode from 'Common/Components/Prism';

const Chat = () => {
    const [Chat_Box_Username, setChat_Box_Username] = useState<any>("Marie Prohaska");
    const [Chat_Box_Image, setChat_Box_Image] = useState<any>(avatar5);
    const [Chat_Box_Desiganation, setChat_Box_Desiganation] = useState<any>("Angular Developer");
    const [currentRoomId, setCurrentRoomId] = useState<any>(1);

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const handleToggleDrawer = () => setIsOpen(!isOpen);

    const [show, setShow] = useState<boolean>(false);
    const toggleCallModal = () => setShow(!show);

    const [contact, setContact] = useState<boolean>(false);
    const toggleContactModal = () => setContact(!contact);

    // Content
    const handlechatbotList = (name: any) => {
        const chartlist = document.getElementById('chartlist');
        const botlist = document.getElementById('botlist');
        if (name === 'bot') {
            chartlist?.classList.remove('active');
            botlist?.classList.add('active');
        } else {
            botlist?.classList.remove('active');
            chartlist?.classList.add('active');
        }
    };

    // Responsive


    const dispatch = useDispatch<any>();

    const selectDataList = createSelector(
        (state: any) => state.Chat,
        (state) => ({
            dataList: state.chats
        })
    );

    const { dataList } = useSelector(selectDataList);
    const [data, setData] = useState<any>([]);

    // Get Message
    useEffect(() => {
        dispatch(onGetChat(currentRoomId));
    }, [dispatch, currentRoomId]);

    useEffect(() => {
        setData(dataList);
    }, [dataList]);


    // Add Message
    const [curMessage, setcurMessage] = useState<string>("");
    const addMessage = () => {
        if (curMessage !== '') {
            const message: any = {
                id: Math.floor(Math.random() * 100),
                msg: curMessage,
                img: avatar1,
                isSender: true,
            };
            dispatch(onAddChat(message));
        }
        setcurMessage("");
    };

    const onKeyPress = (e: any) => {
        const { key, value } = e;
        if (key === "Enter") {
            e.preventDefault();
            setcurMessage(value);
            addMessage();
        }
    };

    //Use For Chat Box
    const userChatOpen = (ele: any) => {
        setChat_Box_Username(ele.name);
        setChat_Box_Image(ele.img);
        setChat_Box_Desiganation(ele.designation);
        setCurrentRoomId(ele.roomId);

        dispatch(onGetChat(ele.roomId));

        document.querySelector(".menu-content")?.classList.add("hidden");
        document.querySelector(".chat-content")?.classList.add("show");
    };

    // Retun To Contact
    const retunToContact = () => {
        document.querySelector(".menu-content")?.classList.remove("hidden");
        document.querySelector(".chat-content")?.classList.remove("show");
    };

    // BookMark Message
    const handleBookmarkClick = (ele: any) => {
        dispatch(onBookmarkChat(ele.id));
    };

    // Copy Message
    const handleCopyClick = (ele: any) => {
        const copy = ele.msg;

        if (copy) {
            navigator.clipboard.writeText(copy);
        }

        const copyClipboardElement = document.getElementById("copyClipBoard");
        if (copyClipboardElement) {
            copyClipboardElement.classList.remove("hidden");
            setTimeout(() => {
                copyClipboardElement.classList.add("hidden");
            }, 1000);
        }
    };

    // Delete Message
    const handleDelete = (ele: any) => {
        if (ele) {
            dispatch(onDeleteChat(ele.id));
        }
    };

    const chatRef = useRef<any>(null);

    useEffect(() => {
        if (chatRef.current?.el) {
            chatRef.current.getScrollElement().scrollTop = chatRef.current.getScrollElement().scrollHeight;
        }
    }, [data]);


    // Recent Chats
    const [recentChatslist, setRecentChatslist] = useState<any>(RecentChats);
    const filterRecentChatsData = (e: any) => {
        const search = e.target.value;
        const keysToSearch = ['name', 'designation'];
        const filteredData = RecentChats.filter((item: any) => {
            const searchMatch = !search || keysToSearch.some((key: any) => item[key].toLowerCase().includes(search.toLowerCase()));
            return searchMatch;
        });

        setRecentChatslist(filteredData);
    };

    // Contact List
    const [contactlist, setContactlist] = useState<any>(ContactList);

    const filterContactData = (e: any) => {
        const search = e.target.value;
        const keysToSearch = ['name', 'designation'];
        const filteredData = ContactList.filter((item: any) => {
            const searchMatch = !search || keysToSearch.some((key: any) => item[key].toLowerCase().includes(search.toLowerCase()));
            return searchMatch;
        });

        setContactlist(filteredData);
    };

    // Recent Find
    const [recentFindlist, setRecentFindlist] = useState<any>(RecentFind);
    const filterRecentFindData = (e: any) => {
        const search = e.target.value;
        const keysToSearch = ['topic'];
        const filteredData = RecentFind.filter((item: any) => {
            const searchMatch = !search || keysToSearch.some((key: any) => item[key].toLowerCase().includes(search.toLowerCase()));
            return searchMatch;
        });

        setRecentFindlist(filteredData);
    };

    // Documents
    const [documentslist, setDocumentslist] = useState<any>(Documents);
    const filterDocumentslistData = (e: any) => {
        const search = e.target.value;
        const keysToSearch = ['title'];
        const filteredData = Documents.filter((item: any) => {
            const searchMatch = !search || keysToSearch.some((key: any) => item[key].toLowerCase().includes(search.toLowerCase()));
            return searchMatch;
        });

        setDocumentslist(filteredData);
    };

    document.title = `Chat | Tailwick - React Admin & Dashboard Template`;

    return (
        <React.Fragment>
            <div className="container-fluid group-data-[content=boxed]:max-w-boxed mx-auto relative">
                <div className="flex gap-5 mt-5">
                    <Tab.Container defaultActiveKey='mainChatList'>
                        <div className="fixed inset-x-0 bottom-12 2xl:w-20 shrink-0 xl:relative z-[20] text-center xl:bottom-auto">
                            <div className="xl:min-h-[calc(100vh_-_theme('height.header')_*_2.4)] inline-block card xl:h-[calc(100%_-_theme('spacing.5'))] shadow-lg xl:shadow-md">
                                <div className="flex items-center h-full p-2 2xl:p-4 xl:flex-col">
                                    <Link to="#!" className="hidden xl:block">
                                        <img src={logoSm} alt="" className="h-8 mx-auto" />
                                    </Link>
                                    <Nav className="flex gap-2 my-auto text-center xl:pt-8 xl:flex-col nav-tabs">
                                        <Nav.Item eventKey='mainChatList' className="group/item tabs chatTab">
                                            <Link to="#!" className="inline-flex items-center justify-center size-12 transition-all duration-200 ease-linear rounded-md mainChatList">
                                                <MessagesSquare className="mx-auto transition-all size-5 duration-200 ease-linear fill-slate-100 text-slate-500 dark:text-zink-200 dark:fill-zink-500 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" onClick={() => { handlechatbotList("chat"); retunToContact(); }} />
                                            </Link>
                                        </Nav.Item>
                                        <Nav.Item eventKey='contactList' className="group/item tabs">
                                            <Link to="#!" className="inline-flex items-center justify-center size-12 transition-all duration-200 ease-linear rounded-md">
                                                <SquareUser className="mx-auto transition-all size-5 duration-200 ease-linear fill-slate-100 text-slate-500 dark:text-zink-200 dark:fill-zink-500 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" onClick={() => { handlechatbotList("contactList"); retunToContact(); }} />
                                            </Link>
                                        </Nav.Item>
                                        <Nav.Item eventKey='botChat' className="group/item botTab">
                                            <Link to="#!" className="inline-flex items-center justify-center size-12 transition-all duration-200 ease-linear rounded-md botChat">
                                                <Bot className="mx-auto transition-all size-5 duration-200 ease-linear fill-slate-100 text-slate-500 dark:text-zink-200 dark:fill-zink-500 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" onClick={() => { handlechatbotList("bot"); retunToContact(); }} />
                                            </Link>
                                        </Nav.Item>
                                        <Nav.Item eventKey='profile' className="group/item tabs">
                                            <Link to="#!" className="inline-flex items-center justify-center size-12 transition-all duration-200 ease-linear rounded-md">
                                                <UserRound className="mx-auto transition-all size-5 duration-200 ease-linear fill-slate-100 text-slate-500 dark:text-zink-200 dark:fill-zink-500 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" onClick={retunToContact} />
                                            </Link>
                                        </Nav.Item>
                                        <Nav.Item eventKey='fileDocument' className="group/item tabs">
                                            <Link to="#!" className="inline-flex items-center justify-center size-12 transition-all duration-200 ease-linear rounded-md">
                                                <ScrollText className="mx-auto transition-all size-5 duration-200 ease-linear fill-slate-100 text-slate-500 dark:text-zink-200 dark:fill-zink-500 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" onClick={retunToContact} />
                                            </Link>
                                        </Nav.Item>
                                    </Nav>
                                    <ul className="flex items-center gap-2 my-auto text-center xl:mb-0 xl:mt-auto xl:pt-4 xl:flex-col">
                                        <li>
                                            <Link to="/pages-account-settings" className="inline-flex items-center justify-center size-12 transition-all duration-200 ease-linear rounded-md group/item"><Settings className="mx-auto transition-all size-5 duration-200 ease-linear fill-slate-100 text-slate-500 dark:text-zink-200 dark:fill-zink-500 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" /></Link>
                                        </li>
                                        <li className="hidden md:block">
                                            <div className="relative dropdown">
                                                <Link to="#!" type="button" className="inline-flex items-center justify-center size-12 transition-all duration-200 ease-linear bg-pink-100 rounded-md group/item dropdown-toggle dark:bg-pink-500/20" id="profilDropdown" data-bs-toggle="dropdown">
                                                    <img src={avatar1} alt="" className="h-12 rounded-md" />
                                                </Link>

                                                <ul className="absolute z-50 hidden py-2 mt-1 ltr:text-left rtl:text-right list-none bg-white rounded-md shadow-md dropdown-menu min-w-[10rem] dark:bg-zink-600" aria-labelledby="profilDropdown">
                                                    <li>
                                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="/auth-login-basic">Logout</Link>
                                                    </li>
                                                    <li>
                                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="/auth-login-cover">Switch Account</Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="block w-full xl:block xl:w-80 shrink-0 menu-content">
                            <div className="h-[calc(100vh_-_theme('spacing.10')_*_6)] xl:min-h-[calc(100vh_-_theme('height.header')_*_2.4)] card xl:h-[calc(100%_-_theme('spacing.5'))]">
                                <div className="flex flex-col h-full">
                                    <Tab.Content className="tab-content">
                                        <Tab.Pane eventKey='mainChatList' className="tab-pane" id="mainChatList">
                                            <div className="card-body">
                                                <div className="flex items-center gap-3">
                                                    <button className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500"><ChevronsLeft className="size-4 mx-auto" /></button>
                                                    <h6 className="text-15 grow">Chats</h6>
                                                    <button data-modal-target="addContactModal" className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500" onClick={toggleContactModal}><Plus className="size-4 mx-auto" /></button>
                                                </div>
                                                <div className="relative mt-5">
                                                    <input type="text" className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200" placeholder="Search for ..." autoComplete="off" onChange={(e) => filterRecentChatsData(e)} />
                                                    <Search className="inline-block size-4 absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 dark:text-zink-200 fill-slate-100 dark:fill-zink-600" />
                                                </div>
                                            </div>
                                            <SimpleBar className="max-h-[calc(100vh_-_380px)] xl:max-h-[calc(100vh_-_300px)]">
                                                <ul className="flex flex-col gap-1" id="chatList">
                                                    <li className="px-5">
                                                        <p className="mb-1 text-slate-500 dark:text-zink-200">Recent Chats</p>
                                                    </li>
                                                    {(recentChatslist || []).map((item: any, key: number) => (
                                                        <React.Fragment key={key}>
                                                            {key === 3 && <li className="px-5">
                                                                <p className="mb-1 text-slate-500 dark:text-zink-200">All Conversion</p>
                                                            </li>}

                                                            <li>
                                                                <Link to="#!" className={`flex items-center gap-3 px-5 py-2 [&.active]:bg-slate-50 dark:[&.active]:bg-zink-600 group/item ${item.status} ${Chat_Box_Username === item.name && "active"}`} onClick={() => userChatOpen(item)}>
                                                                    <div className="relative flex items-center justify-center font-semibold rounded-full text-slate-500 dark:text-zink-200 size-9 bg-slate-100 dark:bg-zink-600">
                                                                        {item.img ? <img src={item.img} alt="" className="rounded-full h-9" /> : (item.name.split(' ').map((word: any) => word.charAt(0)).join(''))}
                                                                        <span className="absolute bottom-0 ltr:right-0 rtl:left-0 size-2.5 border-2 border-white dark:border-zink-700 rounded-full group-[.online]/item:bg-green-400 group-[.offline]/item:bg-slate-400 dark:group-[.offline]/item:bg-zink-500 bg-red-500"></span>
                                                                    </div>
                                                                    <div className="overflow-hidden grow">
                                                                        <h6 className="mb-1">{item.name}</h6>
                                                                        {item.message ? <p className="text-xs truncate text-slate-500 dark:text-zink-200">{item.message}</p> :
                                                                            <p className="text-xs truncate text-slate-500 dark:text-zink-200">{item.designation}</p>}
                                                                    </div>
                                                                    {item.timestamp && <div className="self-start shrink-0 text-slate-500 dark:text-zink-200">
                                                                        <small>{item.timestamp}</small>
                                                                    </div>}
                                                                </Link>
                                                            </li>
                                                        </React.Fragment>
                                                    ))}

                                                    {!recentChatslist.length && <li className="px-5">
                                                        <p className="mb-1 text-slate-500 dark:text-zink-200">No Conversion Found</p>
                                                    </li>}
                                                </ul>
                                            </SimpleBar>
                                        </Tab.Pane>
                                        <Tab.Pane eventKey='contactList' className="tab-pane" id="contactList">
                                            <div className="card-body">
                                                <div className="flex items-center gap-3">
                                                    <button className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500"><ChevronsLeft className="size-4 mx-auto" /></button>
                                                    <h6 className="text-15 grow">Contacts</h6>
                                                    <button className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500" onClick={toggleContactModal}><Plus className="size-4 mx-auto" /></button>
                                                </div>
                                                <div className="relative mt-5">
                                                    <input type="text" className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200" placeholder="Search for ..." autoComplete="off" onChange={(e: any) => filterContactData(e)} />
                                                    <Search className="inline-block size-4 absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 dark:text-zink-200 fill-slate-100 dark:fill-zink-600" />
                                                </div>
                                            </div>
                                            <SimpleBar className="max-h-[calc(100vh_-_390px)] xl:max-h-[calc(100vh_-_300px)]">
                                                <ul className="flex flex-col gap-1">
                                                    <li className="px-5">
                                                        <p className="mb-1 text-slate-500 dark:text-zink-200">Contact List</p>
                                                    </li>
                                                    {(contactlist || []).map((item: any, key: number) => (<li key={key}>
                                                        <div className={`flex items-center gap-3 px-5 py-2 [&.active]:bg-slate-50 group/item dark:[&.active]:bg-zink-600 offline ${Chat_Box_Username === item.name && "active"}`} onClick={() => userChatOpen(item)}>
                                                            <div className="relative flex items-center justify-center font-semibold rounded-full text-slate-500 dark:text-zink-200 size-9 bg-slate-100 dark:bg-zink-600">
                                                                {item.img ? <img src={item.img} alt="" className="rounded-full h-9" /> : (item.name.split(' ').map((word: any) => word.charAt(0)).join(''))}
                                                                <span className="absolute bottom-0 ltr:right-0 rtl:left-0 size-2.5 border-2 border-white dark:border-zink-700 rounded-full group-[.online]/item:bg-green-400 group-[.offline]/item:bg-slate-400 dark:group-[.offline]/item:bg-zink-500 bg-red-500"></span>
                                                            </div>
                                                            <Link to="#!" className="overflow-hidden grow">
                                                                <h6 className="mb-1">{item.name}</h6>
                                                                <p className="text-xs truncate text-slate-500 dark:text-zink-200">{item.designation}</p>
                                                            </Link>
                                                            <Dropdown className="relative dropdown shrink-0">
                                                                <Dropdown.Trigger type="button" className="dropdown-toggle" id="contactListDropdown1" data-bs-toggle="dropdown"><MoreVertical className="inline-block size-4 ml-1" /></Dropdown.Trigger>

                                                                <Dropdown.Content className="absolute z-50 py-2 mt-1 ltr:text-left rtl:text-right list-none bg-white rounded-md shadow-md dropdown-menu min-w-[10rem] dark:bg-zink-600" aria-labelledby="contactListDropdown1">
                                                                    <li>
                                                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">Send Message</Link>
                                                                    </li>
                                                                    <li>
                                                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">Edit</Link>
                                                                    </li>
                                                                    <li>
                                                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">Delete</Link>
                                                                    </li>
                                                                </Dropdown.Content>
                                                            </Dropdown>
                                                        </div>
                                                    </li>))}

                                                    {!contactlist.length && <li className="px-5">
                                                        <p className="mb-1 text-slate-500 dark:text-zink-200">No Contact Found</p>
                                                    </li>}

                                                </ul>
                                            </SimpleBar>
                                        </Tab.Pane>
                                        <Tab.Pane eventKey='botChat' className="tab-pane" id="botChat">
                                            <div className="card-body">
                                                <div className="flex items-center gap-3">
                                                    <button className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500"><ChevronsLeft className="size-4 mx-auto" /></button>
                                                    <h6 className="text-15 grow">AI Bot</h6>
                                                </div>
                                                <div className="relative mt-5">
                                                    <input type="text" className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200" placeholder="Search for ..." autoComplete="off" onChange={(e) => filterRecentFindData(e)} />
                                                    <Search className="inline-block size-4 absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 dark:text-zink-200 fill-slate-100 dark:fill-zink-600" />
                                                </div>
                                            </div>
                                            <p className="mx-5 mb-2 text-slate-500 dark:text-zink-200">Recent Find</p>
                                            <SimpleBar className="max-h-[calc(100vh_-_410px)] xl:max-h-[calc(100vh_-_330px)]">
                                                <ul className="flex flex-col gap-1">
                                                    {(recentFindlist || []).map((item: any, key: number) => (<li key={key}>
                                                        <Link to="#!" className="flex items-center gap-3 px-5 py-2.5 [&.active]:bg-slate-50 dark:[&.active]:bg-zink-600 active">
                                                            <div className="relative flex items-center justify-center font-semibold rounded-full text-slate-500 size-7 dark:text-zink-200 shrink-0">
                                                                <MessagesSquare className="size-4" />
                                                            </div>
                                                            <h6 className="font-medium truncate grow">{item.topic}</h6>
                                                        </Link>
                                                    </li>))}

                                                    {!recentFindlist.length && <li className="px-5">
                                                        <p className="mb-1 text-slate-500 dark:text-zink-200">No Data Found</p>
                                                    </li>}
                                                </ul>
                                            </SimpleBar>
                                        </Tab.Pane>
                                        <Tab.Pane eventKey='profile' className="tab-pane" id="profile">
                                            <SimpleBar className="max-h-[calc(100vh_-_250px)] xl:max-h-full card-body">
                                                <div className="flex items-center gap-3">
                                                    <h6 className="text-15 grow">Profile</h6>
                                                    <button className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 hover:text-red-500 dark:bg-zink-600 dark:text-zink-200 dark:hover:text-red-500"><X className="size-4 mx-auto " /></button>
                                                </div>
                                                <div className="text-center">
                                                    <div className="size-20 mx-auto mt-8 bg-pink-100 rounded-full dark:bg-pink-500/20">
                                                        <img src={Chat_Box_Image} alt="" className="h-20 rounded-full" />
                                                    </div>
                                                    <h5 className="mt-4 text-16">{Chat_Box_Username}</h5>
                                                    <p className="text-slate-500 dark:text-zink-200">{Chat_Box_Desiganation}</p>
                                                </div>
                                                <div className="mt-5">
                                                    <p className="mb-3 text-slate-500 dark:text-zink-200">Object</p>
                                                    <p>If several languages coalesce, the grammar of the resulting language is more simple and regular than that of the individual.</p>
                                                </div>
                                                <div className="mt-5">
                                                    <p className="mb-4 text-slate-500 dark:text-zink-200">Personal Information</p>
                                                    <h6 className="mb-3 font-medium"><Phone className="inline-block size-4 mr-1 text-slate-500 dark:text-zink-200" /> <span className="align-middle">+(103) 1234 567 8954</span></h6>
                                                    <h6 className="mb-3 font-medium"><MapPin className="inline-block size-4 mr-1 text-slate-500 dark:text-zink-200" /> <span className="align-middle">California, USA</span></h6>
                                                    <h6 className="font-medium"><Mail className="inline-block size-4 mr-1 text-slate-500 dark:text-zink-200" /> <span className="align-middle">william@tailwick.com</span></h6>
                                                </div>
                                                <div className="mt-5">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <p className="text-slate-500 dark:text-zink-200 grow">Settings</p>
                                                        <Link to="#!" className="text-sm underline text-slate-500 dark:text-zink-200 shrink-0">View More</Link>
                                                    </div>
                                                    <div className="flex items-center mb-3">
                                                        <div className="relative inline-block w-10 align-middle transition duration-200 ease-in ltr:mr-2 rtl:ml-2">
                                                            <input type="checkbox" name="muteNotification" id="muteNotification" className="absolute block size-5 transition duration-300 ease-linear border-2 rounded-full appearance-none cursor-pointer border-slate-200 dark:border-zink-600 bg-white/80 dark:bg-zink-400 peer/published checked:bg-custom-500 dark:checked:bg-custom-500 ltr:checked:right-0 rtl:checked:left-0 checked:border-custom-100 dark:checked:border-custom-900 arrow-none checked:bg-none" />
                                                            <label htmlFor="muteNotification" className="block h-5 overflow-hidden duration-300 ease-linear border rounded-full cursor-pointer cursor-pointertransition border-slate-200 dark:border-zink-500 bg-slate-200 dark:bg-zink-600 peer-checked/published:bg-custom-100 dark:peer-checked/published:bg-custom-900 peer-checked/published:border-custom-100 dark:peer-checked/published:border-custom-900"></label>
                                                        </div>
                                                        <label htmlFor="muteNotification" className="inline-block text-base font-medium cursor-pointer">Mute Notifications</label>
                                                    </div>
                                                    <div className="flex items-center mb-3">
                                                        <div className="relative inline-block w-10 align-middle transition duration-200 ease-in ltr:mr-2 rtl:ml-2">
                                                            <input type="checkbox" name="blockAccount" id="blockAccount" className="absolute block size-5 transition duration-300 ease-linear border-2 rounded-full appearance-none cursor-pointer border-slate-200 dark:border-zink-600 bg-white/80 dark:bg-zink-400 peer/published checked:bg-custom-500 dark:checked:bg-custom-500 ltr:checked:right-0 rtl:checked:left-0 checked:border-custom-100 dark:checked:border-custom-900 arrow-none checked:bg-none" />
                                                            <label htmlFor="blockAccount" className="block h-5 overflow-hidden duration-300 ease-linear border rounded-full cursor-pointer cursor-pointertransition border-slate-200 dark:border-zink-500 bg-slate-200 dark:bg-zink-600 peer-checked/published:bg-custom-100 dark:peer-checked/published:bg-custom-900 peer-checked/published:border-custom-100 dark:peer-checked/published:border-custom-900"></label>
                                                        </div>
                                                        <label htmlFor="blockAccount" className="inline-block text-base font-medium cursor-pointer">Block Account</label>
                                                    </div>
                                                    <Link to="#!">
                                                        <p className="mb-3"><BellRing className="inline-block size-4 mr-1 text-slate-500 dark:text-zink-200" /> <span className="align-middle">Custom Notification</span></p>
                                                    </Link>
                                                </div>
                                            </SimpleBar>
                                        </Tab.Pane>
                                        <Tab.Pane eventKey='fileDocument' className="tab-pane" id="fileDocument">
                                            <div className="card-body">
                                                <div className="flex items-center gap-3">
                                                    <button className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500"><ChevronsLeft className="size-4 mx-auto" /></button>
                                                    <h6 className="text-15 grow">Documents</h6>
                                                </div>
                                                <div className="relative mt-5">
                                                    <input type="text" className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200" placeholder="Search for ..." autoComplete="off" onChange={(e) => filterDocumentslistData(e)} />
                                                    <Search className="inline-block size-4 absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 dark:text-zink-200 fill-slate-100 dark:fill-zink-600" />
                                                </div>
                                            </div>
                                            <SimpleBar className="max-h-[calc(100vh_-_380px)] xl:max-h-[calc(100vh_-_300px)]">
                                                <div className="flex flex-col gap-3">
                                                    {(documentslist || []).map((item: any, key: number) => (<Link to="#!" className="flex items-center gap-3 !py-3 border-y border-dashed rounded-md card-body border-slate-200 dark:border-zink-500" key={key}>
                                                        <div className="flex items-center justify-center text-sm font-semibold rounded-md size-9 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 shrink-0">
                                                            {item.img ? <img src={item.img} alt="" className="object-cover rounded-md h-9" /> : (item.title.split(".")[1]).toUpperCase()}
                                                        </div>
                                                        <div className="grow">
                                                            <h6>{item.title}</h6>
                                                            <p className="text-slate-500 dark:text-zink-200">{item.size}</p>
                                                        </div>
                                                    </Link>))}

                                                    {!documentslist.length && <Link to="#!" className="flex items-center gap-3 !py-3 border-y border-dashed rounded-md card-body border-slate-200 dark:border-zink-500">
                                                        <p className="mb-1 text-slate-500 dark:text-zink-200">No Data Found</p>
                                                    </Link>}
                                                </div>
                                            </SimpleBar>
                                        </Tab.Pane>
                                    </Tab.Content>
                                </div>
                            </div>
                        </div>
                    </Tab.Container>
                    <div id='chartlist' className={`h-[calc(100vh_-_theme('spacing.10')_*_6)] xl:min-h-[calc(100vh_-_theme('height.header')_*_2.4)] card w-full hidden [&.show]:block [&.active]:xl:block chat-content active`}>
                        <div className="px-4 py-3 text-sm unreadConversations-alert text-yellow-500 border border-transparent rounded-md bg-yellow-50 dark:bg-yellow-400/20 hidden" id="copyClipBoard">
                            <span className="font-bold">Message Copied</span>
                        </div>
                        <div className="relative flex flex-col h-full">
                            <div className="card-body">
                                <div className="flex items-center gap-3">
                                    <button className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500" onClick={retunToContact}><ChevronsLeft className="size-4 mx-auto" /></button>
                                    <Link to="#!" data-drawer-target="drawerEnd" className="flex items-center gap-3 ltr:mr-auto rtl:ml-auto shrink-0" id="userChatProfile">
                                        <div className="size-10 rounded-full bg-slate-100 dark:bg-zink-600">
                                            {Chat_Box_Image === undefined ? (
                                                <img src={userDummayImage} className="h-10 rounded-full" alt="" />
                                            ) : (
                                                <img src={Chat_Box_Image} className="h-10 rounded-full" alt="" />
                                            )}
                                        </div>
                                        <div>
                                            <h6> {Chat_Box_Username}</h6>
                                            <p className="text-sm text-slate-500 dark:text-zink-200">{Chat_Box_Desiganation}</p>
                                        </div>
                                    </Link>
                                    <ul className="flex items-center">
                                        <li>
                                            <Link to="#!" className="inline-flex items-center justify-center size-10 transition-all duration-200 ease-linear rounded-md group/item" onClick={toggleCallModal}><Phone className="mx-auto transition-all size-4 duration-200 ease-linear fill-slate-100 text-slate-500 dark:fill-zink-600 dark:text-zink-200 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" /></Link>
                                        </li>
                                        <li>
                                            <Link to="#!" className="inline-flex items-center justify-center size-10 transition-all duration-200 ease-linear rounded-md group/item"><Video className="mx-auto transition-all size-4 duration-200 ease-linear fill-slate-100 text-slate-500 dark:fill-zink-600 dark:text-zink-200 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" /></Link>
                                        </li>
                                        <li>
                                            <Link to="#!" id="searchChatButton" className="inline-flex items-center justify-center size-10 transition-all duration-200 ease-linear rounded-md group/item"><Search className="mx-auto transition-all size-4 duration-200 ease-linear fill-slate-100 text-slate-500 dark:fill-zink-600 dark:text-zink-200 group-hover/item:text-custom-500 dark:group-hover/item:text-custom-500 group-[.active]/item:fill-custom-100 dark:group-[.active]/item:fill-custom-500/20 group-[.active]/item:text-custom-500 dark:group-[.active]/item:text-custom-500" /></Link>
                                        </li>
                                        <li className="hidden md:block">
                                            <Link to="#!" data-drawer-target="drawerEnd" className="inline-flex items-center justify-center size-10 transition-all duration-200 ease-linear rounded-md group/item" onClick={handleToggleDrawer}>
                                                <PanelRightOpen className="size-4 mx-auto transition-all duration-200 ease-linear fill-slate-100 dark:fill-zink-600 dark:text-zink-200 text-slate-500 group-hover/item:text-custom-500 group-hover/item:fill-custom-100 dark:group-hover/item:fill-custom-500/20 dark:group-hover/item:text-custom-500 group-[.active]/item:hidden block" />
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="relative bg-slate-50 dark:bg-zink-600/50 grow">
                                <div className="absolute inset-x-0 top-0 z-10 hidden transition-all duration-200 ease-linear bg-white border-y border-slate-200 dark:bg-zink-700 dark:border-zink-500" id="searchChat">
                                    <input type="text" className="w-full px-5 py-2 focus:outline-none" placeholder="Search for ..." autoComplete="off" />
                                </div>
                                <SimpleBar ref={chatRef} className="h-[calc(100vh_-_410px)] xl:h-[calc(100vh_-_330px)]">
                                    <ul className="flex flex-col gap-5 list-none card-body">
                                        {(data || []).map((msg: any, key: number) => (
                                            <React.Fragment key={key}>
                                                {(msg.usermessages || []).map((item: any, key: number) => (<li className={`flex chat-message group/item [&.right]:justify-end ${item.isSender && "right"}`} key={key}>
                                                    <div className="flex gap-3">
                                                        <Link to="#!" className="flex items-center self-end justify-center text-sm font-semibold rounded-full size-9 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 shrink-0 group-[.right]/item:order-3">
                                                            {!item.isSender ? <img src={Chat_Box_Image || userDummayImage} alt="" className="object-cover rounded-full h-9" /> : <img src={avatar1} alt="" className="object-cover rounded-full h-9" />}
                                                        </Link>
                                                        <div className="grow group-[.right]/item:order-2 flex flex-col gap-3">
                                                            <div className="flex gap-3">
                                                                <div className="relative p-4 bg-white dark:bg-zink-700 rounded-md ltr:rounded-bl-none rtl:rounded-br-none shadow-sm 2xl:max-w-sm ltr:group-[.right]/item:rounded-br-none rtl:group-[.right]/item:rounded-bl-none ltr:group-[.right]/item:rounded-bl-md rtl:group-[.right]/item:rounded-br-md group-[.right]/item:order-2">
                                                                    {item.bookmark && <Star className="block size-2 rtl:ml-2 ltr:mr-2" />}
                                                                    {item.msg}
                                                                    {item.attachments && <div className="grid grid-cols-2 gap-4 mt-4 2xl:grid-cols-3">
                                                                        {(item.attachments || []).map((item: any, key: number) => (<Link to="#!" key={key}>
                                                                            <img src={item.img} alt="" className="rounded-md" />
                                                                        </Link>))}
                                                                    </div>}
                                                                </div>
                                                                <Dropdown className="relative transition-all duration-200 ease-linear opacity-0 dropdown shrink-0 group-hover/item:opacity-100 group-[.right]/item:order-1">
                                                                    <Dropdown.Trigger type="button" className="dropdown-toggle" id="dropdownMenuButton" data-bs-toggle="dropdown"><MoreVertical className="inline-block size-4 ml-1" /></Dropdown.Trigger>

                                                                    <Dropdown.Content placement={item.isSender ? (msg.usermessages.length / 2 <= key) ? "top-start" : "start-end" : (msg.usermessages.length / 2 <= key) ? "top-start" : "start-end"} className="absolute z-50 py-2 mt-1 ltr:text-left rtl:text-right list-none bg-white rounded-md shadow-md dropdown-menu min-w-[10rem] dark:bg-zink-600" aria-labelledby="dropdownMenuButton">
                                                                        <li>
                                                                            <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">Reply</Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">Forward</Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!" onClick={() => handleCopyClick(item)}>Copy</Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!" onClick={() => handleBookmarkClick(item)}>Bookmark</Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!" onClick={() => handleDelete(item)}>Delete</Link>
                                                                        </li>
                                                                    </Dropdown.Content>
                                                                </Dropdown>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </ul>
                                </SimpleBar>
                            </div>
                            <div className="card-body">
                                <div className="flex items-center gap-2">
                                    <div className="grow">
                                        <input type="text" id="inputText" className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200" placeholder="Type your message here ..."
                                            value={curMessage}
                                            onKeyDown={onKeyPress}
                                            onChange={e => setcurMessage(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button type="button" className="flex items-center justify-center size-[37.5px] transition-all duration-200 ease-linear p-0 text-slate-500 btn bg-transparent border-transparent hover:text-slate-700 focus:text-slate-700 active:text-slate-700 dark:text-zink-200 dark:hover:text-zink-50 dark:focus:text-zink-50 dark:active:text-zink-50"><Mic className="size-4" /></button>
                                        <button type="button" className="flex items-center justify-center size-[37.5px] transition-all duration-200 ease-linear p-0 text-slate-500 btn bg-transparent border-transparent hover:text-slate-700 focus:text-slate-700 active:text-slate-700 dark:text-zink-200 dark:hover:text-zink-50 dark:focus:text-zink-50 dark:active:text-zink-50"><Image className="size-4" /></button>
                                        <button type="button" className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20" disabled={!curMessage} onClick={addMessage}><Send className="inline-block size-4 mr-1 align-middle" /> <span className="align-middle">Send</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id='botlist' className={`h-[calc(100vh_-_theme('spacing.10')_*_6)] xl:min-h-[calc(100vh_-_theme('height.header')_*_2.4)] card w-full hidden [&.show]:block [&.active]:xl:block bot-content`}>
                        <div className="relative">
                            <SimpleBar className="h-[calc(100vh_-_320px)] xl:h-[calc(100vh_-_250px)]">
                                <div className="sticky top-0 flex items-center gap-3 shadow-sm bg-white/60 dark:bg-zink-700/30 backdrop-blur-sm card-body">
                                    <div className="relative flex items-center justify-center size-8 font-semibold rounded-full text-slate-500 bg-slate-100 dark:text-zink-200 dark:bg-zink-600">
                                        <img src={user2} alt="" className="h-8 rounded-full" />
                                    </div>
                                    <h6>What is Tailwind CSS, and what is Utility-First CSS?</h6>
                                </div>
                                <div className="flex gap-3 card-body bg-slate-50 dark:bg-zink-600">
                                    <div className="flex items-center justify-center size-8 font-semibold rounded-full text-slate-500 bg-slate-100 shrink-0 dark:text-zink-200 dark:bg-zink-600">
                                        <Bot className="size-5" />
                                    </div>
                                    <div className="grow">
                                        <p className="mb-2">Tailwind CSS is a <b>utility-first</b> CSS framework designed for rapid UI development. Instead of providing pre-built components, it offers low-level utility classes that let you build custom designs without ever leaving your HTML.</p>
                                        <p className="mb-0">Utility-first CSS is an approach where you use small, single-purpose classes to build your user interface. These utility classes are composed to create complex designs directly in the HTML, rather than relying on custom CSS. This approach favors composition over inheritance, making it easier to maintain and scale your codebase.</p>
                                    </div>
                                </div>
                                <div className="sticky top-0 flex items-center gap-3 shadow-sm bg-white/60 backdrop-blur-sm card-body dark:bg-zink-700/30">
                                    <div className="relative flex items-center justify-center size-8 font-semibold rounded-full text-slate-500 bg-slate-100">
                                        <img src={user2} alt="" className="h-8 rounded-full" />
                                    </div>
                                    <h6>How to install and set up Tailwind CSS in a project?</h6>
                                </div>
                                <div className="flex gap-3 card-body bg-slate-50 dark:bg-zink-600">
                                    <div className="flex items-center justify-center size-8 font-semibold rounded-full text-slate-500 bg-slate-100 shrink-0 dark:text-zink-200 dark:bg-zink-600">
                                        <Bot className="size-5" />
                                    </div>
                                    <div className="grow">
                                        <p className="mb-2">To install Tailwind CSS, you can use npm or yarn by running the following commands:</p>
                                        <p className="mb-2">Using npm:</p>
                                        <PrismCode code={`npm install tailwindcss`} language={("js")} plugins={["line-numbers"]} />
                                        <p className="mt-4 mb-2">Using yarn:</p>
                                        <PrismCode code={`yarn add tailwindcss`} language={("js")} plugins={["line-numbers"]} />
                                        <p className="mt-4 mb-2">After installing, create a configuration file called <code className="text-xs text-pink-500 select-all">tailwind.config.js</code> in your project's root directory using the following command:</p>
                                        <PrismCode code={`npx tailwindcss init`} language={("js")} plugins={["line-numbers"]} />
                                        <p className="mt-4 mb-2">In your project's CSS file, import Tailwind's base styles, components, and utilities using the <code className="text-xs text-pink-500 select-all">@import</code> directive:</p>
                                        <PrismCode code={`@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';`} language={("js")} plugins={["line-numbers"]} />
                                    </div>
                                </div>
                            </SimpleBar>
                            <div className="card-body">
                                <div className="flex items-center gap-2">
                                    <div className="grow">
                                        <input type="text" id="inputText" className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200" placeholder="Type your message here ..." required autoComplete="off" />
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button type="button" className="flex items-center justify-center size-[37.5px] transition-all duration-200 ease-linear p-0 text-slate-500 btn bg-transparent border-transparent hover:text-slate-700 focus:text-slate-700 active:text-slate-700 dark:text-zink-200 dark:hover:text-zink-50 dark:focus:text-zink-50 dark:active:text-zink-50"><Mic className="size-4" /></button>
                                        <button type="button" className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20"><Send className="inline-block size-4 mr-1 align-middle" /> <span className="align-middle">Send</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Drawer */}
            <Drawer show={isOpen} onHide={handleToggleDrawer} id="drawerEnd" drawer-end="true" className="fixed inset-y-0 flex flex-col w-full transition-transform duration-300 ease-in-out transform bg-white shadow ltr:right-0 rtl:left-0 md:w-80 z-drawer dark:bg-zink-600">
                <div className="h-full p-4 overflow-y-auto">
                    <div>
                        <div className="flex items-center gap-3">
                            <button id="closeChatRightSidebar" className="inline-flex items-center justify-center h-8 transition-all duration-200 ease-linear rounded-md shrink-0 text-slate-500 hover:text-custom-500"><ChevronsLeft className="size-4 mx-auto" /></button>
                            <h6 className="text-15 grow">Profile</h6>
                            <Drawer.Header data-drawer-close="drawerEnd" className="inline-flex items-center justify-center size-8 transition-all duration-200 ease-linear rounded-md shrink-0 bg-slate-100 text-slate-500 hover:text-red-500 dark:bg-zink-600 dark:text-zink-200 dark:hover:text-red-500">
                                <X className="size-4 mx-auto"></X></Drawer.Header>
                        </div>
                        <Drawer.Body>
                            <div>
                                <div className="text-center">
                                    <div className="size-20 mx-auto mt-8 rounded-full bg-slate-100 dark:bg-zink-600">
                                        <img src={Chat_Box_Image} alt="" className="h-20 rounded-full" />
                                    </div>
                                    <h5 className="mt-4 text-16">{Chat_Box_Username}</h5>
                                    <p className="text-slate-500 dark:text-zink-200">{Chat_Box_Desiganation}</p>
                                </div>
                                <div className="mt-5">
                                    <p className="mb-4 text-slate-500 dark:text-zink-200">Personal Information</p>
                                    <h6 className="mb-3 font-medium"><Phone className="inline-block size-4 ltr:mr-1 rtl:ml-1 text-slate-500 dark:text-zink-200" /> <span className="align-middle">+(103) 1234 567 8954</span></h6>
                                    <h6 className="mb-3 font-medium"><MapPin className="inline-block size-4 ltr:mr-1 rtl:ml-1 text-slate-500 dark:text-zink-200" /> <span className="align-middle">California, USA</span></h6>
                                    <h6 className="font-medium"><Mail className="inline-block size-4 ltr:mr-1 rtl:ml-1 text-slate-500 dark:text-zink-200" /> <span className="align-middle">william@tailwick.com</span></h6>
                                </div>
                                <div className="mt-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <p className="text-slate-500 dark:text-zink-200 grow">Settings</p>
                                        <Link to="#!" className="text-sm underline text-slate-500 dark:text-zink-200 shrink-0">View More</Link>
                                    </div>
                                    <div className="flex items-center mb-3">
                                        <div className="relative inline-block w-10 align-middle transition duration-200 ease-in ltr:mr-2 rtl:ml-2">
                                            <input type="checkbox" name="muteNotification1" id="muteNotification1" className="absolute block size-5 transition duration-300 ease-linear border-2 rounded-full appearance-none cursor-pointer border-slate-200 dark:border-zink-600 bg-white/80 dark:bg-zink-400 peer/published checked:bg-custom-500 dark:checked:bg-custom-500 ltr:checked:right-0 rtl:checked:left-0 checked:border-custom-100 dark:checked:border-custom-900 arrow-none checked:bg-none" />
                                            <label htmlFor="muteNotification1" className="block h-5 overflow-hidden duration-300 ease-linear border rounded-full cursor-pointer cursor-pointertransition border-slate-200 dark:border-zink-500 bg-slate-200 dark:bg-zink-600 peer-checked/published:bg-custom-100 dark:peer-checked/published:bg-custom-900 peer-checked/published:border-custom-100 dark:peer-checked/published:border-custom-900"></label>
                                        </div>
                                        <label htmlFor="muteNotification1" className="inline-block text-base font-medium cursor-pointer">Mute Notifications</label>
                                    </div>
                                    <div className="flex items-center mb-3">
                                        <div className="relative inline-block w-10 align-middle transition duration-200 ease-in ltr:mr-2 rtl:ml-2">
                                            <input type="checkbox" name="blockAccount1" id="blockAccount1" className="absolute block size-5 transition duration-300 ease-linear border-2 rounded-full appearance-none cursor-pointer border-slate-200 dark:border-zink-600 bg-white/80 dark:bg-zink-400 peer/published checked:bg-custom-500 dark:checked:bg-custom-500 ltr:checked:right-0 rtl:checked:left-0 checked:border-custom-100 dark:checked:border-custom-900 arrow-none checked:bg-none" />
                                            <label htmlFor="blockAccount1" className="block h-5 overflow-hidden duration-300 ease-linear border rounded-full cursor-pointer cursor-pointertransition border-slate-200 dark:border-zink-500 bg-slate-200 dark:bg-zink-600 peer-checked/published:bg-custom-100 dark:peer-checked/published:bg-custom-900 peer-checked/published:border-custom-100 dark:peer-checked/published:border-custom-900"></label>
                                        </div>
                                        <label htmlFor="blockAccount1" className="inline-block text-base font-medium cursor-pointer">Block Account</label>
                                    </div>
                                    <Link to="#!">
                                        <p className="mb-3"><BellRing className="inline-block size-4 ltr:mr-1 rtl:ml-1 text-slate-500 dark:text-zink-200" /> <span className="align-middle">Custom Notification</span></p>
                                    </Link>
                                </div>
                                <div className="mt-5">
                                    <p className="mb-4 text-slate-500 dark:text-zink-200">Recent Shares</p>

                                    <div>
                                        <div className="flex flex-col gap-3">
                                            <Link to="#!" className="flex items-center gap-3 p-2 border border-dashed rounded-md border-slate-200 dark:border-zink-500">
                                                <div className="flex items-center justify-center text-sm font-semibold rounded-md size-9 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 shrink-0">
                                                    <img src={img2} alt="" className="object-cover rounded-md h-9" />
                                                </div>
                                                <div className="grow">
                                                    <h6>Preview-01.jpg</h6>
                                                    <p className="text-slate-500 dark:text-zink-200">1.2 MB</p>
                                                </div>
                                            </Link>
                                            <Link to="#!" className="flex items-center gap-3 p-2 border border-dashed rounded-md border-slate-200 dark:border-zink-500">
                                                <div className="flex items-center justify-center text-sm font-semibold rounded-md size-9 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 shrink-0">
                                                    TXT
                                                </div>
                                                <div className="grow">
                                                    <h6>changelog.txt</h6>
                                                    <p className="text-slate-500 dark:text-zink-200">140.62 KB</p>
                                                </div>
                                            </Link>
                                            <Link to="#!" className="flex items-center gap-3 p-2 border border-dashed rounded-md border-slate-200 dark:border-zink-500">
                                                <div className="flex items-center justify-center text-sm font-semibold rounded-md size-9 bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200 shrink-0">
                                                    PSD
                                                </div>
                                                <div className="grow">
                                                    <h6>tailwick-design.psd</h6>
                                                    <p className="text-slate-500 dark:text-zink-200">97.59 MB</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Drawer.Body>
                    </div>
                </div>
            </Drawer>

            {/* Contact Modal */}
            <Modal show={contact} onHide={toggleContactModal} modal-center="true"
                className="fixed flex flex-col transition-all duration-300 ease-in-out left-2/4 z-drawer -translate-x-2/4 -translate-y-2/4"
                dialogClassName="w-screen md:w-[30rem] bg-white shadow rounded-md dark:bg-zink-600 flex flex-col h-full">
                <Modal.Header className="flex items-center justify-between p-4 border-b dark:border-zink-500"
                    closeButtonClass="transition-all duration-200 ease-linear text-slate-400 hover:text-red-500">
                    <Modal.Title className="text-16">Add Contact</Modal.Title>
                </Modal.Header>
                <Modal.Body className="max-h-[calc(theme('height.screen')_-_180px)] overflow-y-auto p-4">
                    <form action="#!">
                        <div className="relative size-24 mx-auto mb-4 rounded-full shadow-md bg-slate-100 profile-user dark:bg-zink-500">
                            <img src={userDummayImage} alt="" className="object-cover w-full h-full rounded-full user-profile-image" />
                            <div className="absolute bottom-0 right-0 flex items-center justify-center size-8 rounded-full profile-photo-edit">
                                <input id="profile-img-file-input" type="file" className="hidden profile-img-file-input" required />
                                <label htmlFor="profile-img-file-input" className="flex items-center justify-center size-8 bg-white rounded-full shadow-lg cursor-pointer dark:bg-zink-600 profile-photo-edit">
                                    <ImagePlus className="size-4 text-slate-500 fill-slate-200 dark:text-zink-200 dark:fill-zink-500" />
                                </label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="contactnameInput" className="inline-block mb-2 text-base font-medium">Contact Name</label>
                            <input type="text" id="contactnameInput" className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200" placeholder="Enter Name" required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="destinationInput" className="inline-block mb-2 text-base font-medium">Destination</label>
                            <input type="text" id="destinationInput" className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200" placeholder="Destination" required />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="reset" data-modal-close="addContactModal" className="text-red-500 bg-white btn hover:text-red-500 hover:bg-red-100 focus:text-red-500 focus:bg-red-100 active:text-red-500 active:bg-red-100 dark:bg-zink-600 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10 dark:active:bg-red-500/10" onClick={toggleContactModal}>Cancel</button>
                            <button type="submit" className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20" onClick={toggleContactModal}>Add Contact</button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>



            {/* Call Modal */}
            <Modal show={show} onHide={toggleCallModal} modal-center="true"
                className="fixed flex flex-col transition-all duration-300 ease-in-out left-2/4 z-drawer -translate-x-2/4 -translate-y-2/4"
                dialogClassName="w-screen md:w-[30rem] bg-white shadow rounded-md dark:bg-zink-600 flex flex-col h-full">
                <Modal.Body className="max-h-[calc(theme('height.screen')_-_180px)] p-8">
                    <div className="text-center">
                        <div className="size-20 mx-auto rounded-full bg-slate-100 dark:bg-zink-500">
                            <img src={Chat_Box_Image} alt="" className="h-20 rounded-full" />
                        </div>
                        <h5 className="mt-4 mb-1 text-16">{Chat_Box_Username}</h5>
                        <p className="text-green-500">Calling...</p>
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <Link to="#!" className="flex items-center justify-center size-12 p-0 text-white bg-green-500 border-green-500 rounded-full btn hover:text-white hover:bg-green-600 hover:border-green-600 focus:text-white focus:bg-green-600 focus:border-green-600 focus:ring focus:ring-green-100 active:text-white active:bg-green-600 active:border-green-600 active:ring active:ring-green-100 dark:ring-green-400/10"><PhoneCall /></Link>
                        <Link to="#!" className="flex items-center justify-center size-12 text-white bg-red-500 border-red-500 rounded-full btn hover:text-white hover:bg-red-600 hover:border-red-600 focus:text-white focus:bg-red-600 focus:border-red-600 focus:ring focus:ring-red-100 active:text-white active:bg-red-600 active:border-red-600 active:ring active:ring-red-100 dark:ring-red-400/20" onClick={toggleCallModal}><Phone /></Link>
                    </div>
                </Modal.Body>
            </Modal>


        </React.Fragment>
    );
};

export default Chat;