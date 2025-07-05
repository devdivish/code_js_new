import React from 'react';
import { FaSearch, FaUserCircle, FaCog } from 'react-icons/fa';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
      <div className="text-2xl font-bold">DOCUVISION</div>
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <FaSearch className="absolute top-3 left-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="bg-gray-700 text-white w-full pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-700">
          <FaCog />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-700">
          <FaUserCircle size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header;