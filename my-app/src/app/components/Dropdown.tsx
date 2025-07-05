"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaCaretDown } from "react-icons/fa"; // Importing the dropdown icon

import { MenuItem } from "./Header";

interface Props {
  item: MenuItem;
}

export default function Dropdown(props: Props) {
  const { item } = props;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuItems = item?.children ? item.children : [];

  const toggle = () => {
    setIsOpen((old) => !old);
  };

  const transClass = isOpen ? "flex" : "hidden";

  return (
    <>
      <div className="relative">
        {/* Wrapping both the name and icon inside a button to make both clickable */}
        <button
          className="flex items-center hover:text-blue-400"
          onClick={toggle}
        >
             {item.icon && <item.icon className="text-lg" />}
          {item.title}
          <span className="ml-1">
            <FaCaretDown /> {/* Dropdown icon */}
          </span>
        </button>
        {/* Dropdown menu */}
        <div
          className={`absolute top-8 z-30 w-[250px] min-h-[50px] flex flex-col py-4 bg-zinc-400 rounded-md ${transClass}`}
        >
          {menuItems.map((subItem) => (
            <Link
              key={subItem.route}
              className="hover:bg-zinc-300 hover:text-zinc-500 px-4 py-1"
              href={subItem?.route || ""}
              onClick={toggle} // Close the dropdown when a link is clicked
            >
              {subItem.title}
            </Link>
          ))}
        </div>
      </div>
      {isOpen && (
        // Close the dropdown if the user clicks outside the dropdown area
        <div
          className="fixed top-0 right-0 bottom-0 left-0 z-20 bg-black/40"
          onClick={toggle}
        ></div>
      )}
    </>
  );
}
