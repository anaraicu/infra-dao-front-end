import React, { useEffect, useState } from "react";
import { Switch } from "@headlessui/react";
import { ReactComponent as Moon } from "../assets/icons/moon.svg";
import { ReactComponent as Sun } from "../assets/icons/sun.svg";
import { LocalStorageValueTheme } from "../constants";

function ThemeSwitcher() {
  const [checked, setChecked] = useState(LocalStorageValueTheme.LIGHT);

  const setTheme = (themeName: string) => {
    localStorage.setItem("theme", themeName);
    document.documentElement.className = themeName;
  };

  useEffect(() => {
    if (localStorage.getItem("theme") === LocalStorageValueTheme.DARK) {
      setChecked(LocalStorageValueTheme.DARK);
    } else {
      setChecked(LocalStorageValueTheme.LIGHT);
    }
  }, []);

  // function to toggle between light and dark theme
  const toggleTheme = (theme: LocalStorageValueTheme) => {
    setChecked(theme);
    setTheme(theme);
  };

  return (
    <div>
      <Switch
        checked={checked === LocalStorageValueTheme.DARK}
        onChange={() =>
          toggleTheme(
            checked === LocalStorageValueTheme.DARK
              ? LocalStorageValueTheme.LIGHT
              : LocalStorageValueTheme.DARK
          )
        }
        className="bg-gray-100 dark:bg-gray-700 rounded-[100px] p-0.5 flex items-center"
      >
        <span
          className={`${
            checked === LocalStorageValueTheme.LIGHT
              ? "fill-gray-900 dark:fill-gray-50 bg-white shadow-md dark:bg-gray-600"
              : "bg-transparent fill-gray-500 dark:fill-gray-400"
          } rounded-full p-2`}
        >
          <Sun
            onClick={() => toggleTheme(LocalStorageValueTheme.LIGHT)}
            className="w-6 h-6"
          />
        </span>
        <span
          className={`${
            checked === LocalStorageValueTheme.DARK
              ? "fill-gray-900 dark:fill-gray-50 bg-white shadow-md dark:bg-gray-600"
              : "bg-transparent fill-gray-500 dark:fill-gray-400"
          } rounded-full p-2`}
        >
          <Moon
            onClick={() => toggleTheme(LocalStorageValueTheme.DARK)}
            className="w-6 h-6"
          />
        </span>
      </Switch>
    </div>
  );
}

export default ThemeSwitcher;
