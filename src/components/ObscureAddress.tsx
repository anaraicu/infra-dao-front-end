import React from "react";

interface ObscureAddressProps {
  text: string;
}

const ObscureAddress: React.FC<ObscureAddressProps> = ({ text }) => {
  if (!text) {
    return <span></span>;
  }

  return (
    <span className="text-gray-900 dark:text-gray-50 [word-break:break-word] text-left">
      {text
        .split("")
        .reduce(
          (state: string, curr: string, index: number) =>
            state + (index <= 4 || index >= 39 ? curr : "*")
        )
        .split("*")
        .filter((segment) => segment)
        .join("***")}
    </span>
  );
};

export default ObscureAddress;
