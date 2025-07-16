import React from 'react';
import { Dropdown } from './Components/Dropdown';
import { BellRing, Clock, MoveRight, ShoppingBag } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import { Link } from 'react-router-dom';

// Image
import avatar3 from "assets/images/users/avatar-3.png";
import avatar5 from "assets/images/users/avatar-5.png";
import avatar7 from "assets/images/users/avatar-7.png";

interface Notification {
    id: number; type: string; imageClassName?: string; image?: string; boldName?: string; name?: string; description?: string; price?: string; time: string; date: string
}

const notification: Notification[] = [
    { id: 1, type: "follower", imageClassName: "size-10 rounded-md shrink-0 bg-slate-100", image: avatar3, boldName: "@willie_passem", name: "followed you", time: "4 sec", date: "Wednesday 03:42 PM" },
    { id: 2, type: "mention", imageClassName: "size-10 bg-yellow-100 rounded-md shrink-0", image: avatar5, boldName: "@caroline_jessica", name: "commented on your post", time: "15 min", description: "Amazing! Fast, to the point, professional and really amazing to work with them!!!", date: "Wednesday 03:42 PM", },
    { id: 3, type: "invite", imageClassName: "size-10 rounded-md shrink-0 bg-slate-100", name: "Successfully purchased a business plan for", price: "$199.99", time: "Yesterday", date: "Monday 11:26 AM" },
    { id: 4, type: "mention", boldName: "@scott", name: "liked your post", time: "1 Week", date: "Thursday 06:59 AM" },
]

const NotificationDropdown = () => {

    const [filter, setFilter] = React.useState<string>("all");
    return (
        <>
            <Dropdown className="relative flex items-center h-header">
                <Dropdown.Trigger type="button" className="inline-flex justify-center relative items-center p-0 text-topbar-item transition-all size-[37.5px] duration-200 ease-linear bg-topbar rounded-md dropdown-toggle btn hover:bg-topbar-item-bg-hover hover:text-topbar-item-hover group-data-[topbar=dark]:bg-topbar-dark group-data-[topbar=dark]:hover:bg-topbar-item-bg-hover-dark group-data-[topbar=dark]:hover:text-topbar-item-hover-dark group-data-[topbar=brand]:bg-topbar-brand group-data-[topbar=brand]:hover:bg-topbar-item-bg-hover-brand group-data-[topbar=brand]:hover:text-topbar-item-hover-brand group-data-[topbar=dark]:dark:bg-zink-700 group-data-[topbar=dark]:dark:hover:bg-zink-600 group-data-[topbar=brand]:text-topbar-item-brand group-data-[topbar=dark]:dark:hover:text-zink-50 group-data-[topbar=dark]:dark:text-zink-200 group-data-[topbar=dark]:text-topbar-item-dark" id="notificationDropdown" data-bs-toggle="dropdown">
                    <BellRing className="inline-block size-5 stroke-1 fill-slate-100 group-data-[topbar=dark]:fill-topbar-item-bg-hover-dark group-data-[topbar=brand]:fill-topbar-item-bg-hover-brand"></BellRing>
                    <span className="absolute top-0 right-0 flex w-1.5 h-1.5">
                        <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-sky-400"></span>
                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    </span>
                </Dropdown.Trigger>
                <Dropdown.Content placement="start-end" className="absolute z-50 ltr:text-left rtl:text-right bg-white rounded-md shadow-md !top-4 dropdown-menu min-w-[20rem] lg:min-w-[26rem] dark:bg-zink-600" aria-labelledby="notificationDropdown">
                    <div className="p-4">
                        <h6 className="mb-4 text-16">Notifications <span className="inline-flex items-center justify-center size-5 ml-1 text-[11px] font-medium border rounded-full text-white bg-orange-500 border-orange-500">15</span></h6>
                        <ul className="flex flex-wrap w-full p-1 mb-2 text-sm font-medium text-center rounded-md filter-btns text-slate-500 bg-slate-100 nav-tabs dark:bg-zink-500 dark:text-zink-200">
                            <li className={`group grow ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                                <Link to="#" data-filter="all" className="inline-block nav-link px-1.5 w-full py-1 text-xs transition-all duration-300 ease-linear rounded-md text-slate-500 border border-transparent group-[.active]:bg-white group-[.active]:text-custom-500 hover:text-custom-500 active:text-custom-500 dark:text-zink-200 dark:hover:text-custom-500 dark:group-[.active]:bg-zink-600 -mb-[1px]">View All</Link>
                            </li>
                            <li className={`group grow ${filter === "mention" ? "active" : ""}`} onClick={() => setFilter("mention")}>
                                <Link to="#" data-filter="mention" className="inline-block nav-link px-1.5 w-full py-1 text-xs transition-all duration-300 ease-linear rounded-md text-slate-500 border border-transparent group-[.active]:bg-white group-[.active]:text-custom-500 hover:text-custom-500 active:text-custom-500 dark:text-zink-200 dark:hover:text-custom-500 dark:group-[.active]:bg-zink-600 -mb-[1px]">Mentions</Link>
                            </li>
                            <li className={`group grow ${filter === "follower" ? "active" : ""}`} onClick={() => setFilter("follower")}>
                                <Link to="#" data-filter="follower" className="inline-block nav-link px-1.5 w-full py-1 text-xs transition-all duration-300 ease-linear rounded-md text-slate-500 border border-transparent group-[.active]:bg-white group-[.active]:text-custom-500 hover:text-custom-500 active:text-custom-500 dark:text-zink-200 dark:hover:text-custom-500 dark:group-[.active]:bg-zink-600 -mb-[1px]">Followers</Link>
                            </li>
                            <li className={`group grow ${filter === "invite" ? "active" : ""}`} onClick={() => setFilter("invite")}>
                                <Link to="#" data-filter="invite" className="inline-block nav-link px-1.5 w-full py-1 text-xs transition-all duration-300 ease-linear rounded-md text-slate-500 border border-transparent group-[.active]:bg-white group-[.active]:text-custom-500 hover:text-custom-500 active:text-custom-500 dark:text-zink-200 dark:hover:text-custom-500 dark:group-[.active]:bg-zink-600 -mb-[1px]">Invites</Link>
                            </li>
                        </ul>

                    </div>
                    <SimpleBar className="max-h-[350px]">
                        <div className="flex flex-col gap-1">
                            {
                                (notification || []).filter((data: Notification) => filter === "all" || data.type === filter)?.map((item: Notification, index: number) => (
                                    <a key={index} href="#!" className="flex gap-3 p-4 product-item hover:bg-slate-50 dark:hover:bg-zink-500">
                                        {index === notification.length - 1 ?
                                            <div className="relative shrink-0">
                                                <div className="size-10 bg-pink-100 rounded-md">
                                                    <img src={avatar7} alt="" className="rounded-md" />
                                                </div>
                                                <div className="absolute text-orange-500 -bottom-0.5 -right-0.5 text-16">
                                                    <i className="ri-heart-fill"></i>
                                                </div>
                                            </div> :
                                            item.image ? <div className={item.imageClassName}>
                                                <img src={item.image} alt="" className="rounded-md" />
                                            </div> :
                                                <div className="flex items-center justify-center size-10 bg-red-100 rounded-md shrink-0">
                                                    <ShoppingBag className="size-5 text-red-500 fill-red-200"></ShoppingBag>
                                                </div>
                                        }
                                        <div className="grow">
                                            <h6 className="mb-1 font-medium">{item.boldName && <b>{item.boldName}</b>} {item.name} {item.price && <span className="text-red-500">{item.price}</span>}</h6>
                                            <p className={`text-sm text-slate-500 dark:text-zink-300 ${index === notification.length - 3 ? "mb-3" : "mb-0"}`}>
                                                <Clock className="inline-block size-3 mr-1"></Clock> <span className="align-middle">{item.date}</span></p>
                                            {item.description && <div className="p-2 rounded bg-slate-100 text-slate-500 dark:bg-zink-500 dark:text-zink-300">{item.description}</div>}
                                        </div>
                                        <div className="flex items-center self-start gap-2 text-xs text-slate-500 shrink-0 dark:text-zink-300">
                                            <div className="w-1.5 h-1.5 bg-custom-500 rounded-full"></div> {item.time}
                                        </div>
                                    </a>
                                ))
                            }

                        </div>
                    </SimpleBar>
                    <div className="flex items-center gap-2 p-4 border-t border-slate-200 dark:border-zink-500">
                        <div className="grow">
                            <a href="#!">Manage Notification</a>
                        </div>
                        <div className="shrink-0">
                            <button type="button" className="px-2 py-1.5 text-xs text-white transition-all duration-200 ease-linear btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100">View All Notification
                                <MoveRight className="inline-block size-3 ml-1"></MoveRight>
                            </button>
                        </div>
                    </div>
                </Dropdown.Content >
            </Dropdown >
        </>
    );
};

export default NotificationDropdown;
