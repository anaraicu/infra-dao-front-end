import React from "react";

import LoginWallet from "./LoginWallet";
import ThemeSwitcher from "./ThemeSwitcher";
import { Link } from "react-router-dom";

function Header() {
  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 forced-theme:border-white/10">
      <div className="flex items-center justify-between gap-8 container h-14 py-2 sm:h-[79px] sm:py-4">
        <Link
          to={"/"}
          className="text-body-xl md:text-display-sm font-bold text-gray-900 dark:text-gray-50"
        >
          InfraDAO
        </Link>

        <span className="flex items-center gap-3">
          <ThemeSwitcher />
          <LoginWallet />
        </span>
      </div>
    </div>
  );
}

export default Header;
