import React, { useEffect, useState } from 'react';
import { Dropdown } from 'Common/Components/Dropdown';
import { get } from "lodash";

//i18n
import i18n from "../i18n";
import languages from './languages';

const LanguageDropdown = () => {
    const [selectedLang, setSelectedLang] = useState("");

    useEffect(() => {
        // Get the current language from localStorage or default to 'en'
        const currentLanguage = localStorage.getItem("I18N_LANGUAGE") || "en";
        setSelectedLang(currentLanguage);
        // Initialize the language
        i18n.changeLanguage(currentLanguage);
    }, []);

    const changeLanguageAction = (lang: string) => {
        // Change language using i18n
        i18n.changeLanguage(lang);
        // Store the selected language
        localStorage.setItem("I18N_LANGUAGE", lang);
        setSelectedLang(lang);
    };

    return (
        <React.Fragment>
            <Dropdown className="relative flex items-center h-header">
                <Dropdown.Trigger type="button" className="inline-flex justify-center items-center p-0 text-topbar-item transition-all size-[37.5px] duration-200 ease-linear bg-topbar rounded-md dropdown-toggle btn hover:bg-topbar-item-bg-hover hover:text-topbar-item-hover group-data-[topbar=dark]:bg-topbar-dark group-data-[topbar=dark]:hover:bg-topbar-item-bg-hover-dark group-data-[topbar=dark]:hover:text-topbar-item-hover-dark group-data-[topbar=brand]:bg-topbar-brand group-data-[topbar=brand]:hover:bg-topbar-item-bg-hover-brand group-data-[topbar=brand]:hover:text-topbar-item-hover-brand group-data-[topbar=dark]:dark:bg-zink-700 group-data-[topbar=dark]:dark:hover:bg-zink-600 group-data-[topbar=dark]:dark:text-zink-500 group-data-[topbar=dark]:dark:hover:text-zink-50" id="flagsDropdown" data-bs-toggle="dropdown">
                    <img src={get(languages, `${selectedLang}.flag`)} alt="header-lang-img" className="h-5 rounded-sm" />
                </Dropdown.Trigger>
                <Dropdown.Content placement="start-end" className="absolute z-50 p-4 ltr:text-left rtl:text-right bg-white rounded-md shadow-md !top-4 dropdown-menu min-w-[10rem] flex flex-col gap-4 dark:bg-zink-600" aria-labelledby="flagsDropdown">
                    {Object.keys(languages).map(key => (
                        <a href="#!" className={`flex items-center gap-3 group/items language ${selectedLang === key ? "active" : "none"}`} data-lang="en" title="English" onClick={() => changeLanguageAction(key)} key={key}>
                            <img src={get(languages, `${key}.flag`)} alt="" className="object-cover h-4 rounded-full" />
                            <h6 className="transition-all duration-200 ease-linear font-15medium text- text-slate-600 dark:text-zink-200 group-hover/items:text-custom-500">{get(languages, `${key}.label`)}</h6>
                        </a>

                    ))}
                </Dropdown.Content>
            </Dropdown>
        </React.Fragment>
    );
};

export default LanguageDropdown;
