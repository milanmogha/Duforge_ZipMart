import React from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaSearch, FaUser, FaStore } from "react-icons/fa";
import "./BottomNavbar.css";


interface ButtonNavbarProps {
  activePage: string; // Indicate the active page
}

const BottomNavbar: React.FC<ButtonNavbarProps> = ({ activePage }) => {
  const navigate = useNavigate();

  const navItems = [
    { name: "Shop", icon: <FaStore />, route: "/landing" },
    { name: "Explore", icon: <FaSearch />, route: "/explore" },
    { name: "Cart", icon: <FaShoppingCart />, route: "/cart" },
    // { name: "Favourite", icon: <FaHeart />, route: "/favorite" },
    { name: "Account", icon: <FaUser />, route: "/account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg border-t flex justify-around py-2 z-10">
      {navItems.map((item) => (
     <button
     key={item.name}
     className={`flex bg-white flex-col items-center justify-center focus:outline-none border-2 transition-all ${
       activePage === item.name.toLowerCase()
         ? "text-black font-bold border-[#4ac76f]"
         : "text-gray-500 border-transparent hover:text-black hover:font-bold hover:border-[#4ac76f]"
     }`}
     onClick={() => navigate(item.route)}
   >
     <div className="text-lg">{item.icon}</div>
     <span className="text-xs">{item.name}</span>
   </button>
   
     
      ))}
    </div>
  );
};

export default BottomNavbar;
