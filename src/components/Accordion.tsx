import React, { useState } from "react";

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-900 dark:border-gray-50 rounded-3xl text-gray-900 dark:text-gray-50">
      <div
        className="flex items-center justify-between cursor-pointer p-6"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-display-xs md:text-display-sm font-semibold">
          {title}
        </div>
        <div className="text-display-sm md:text-display-md leading-none">
          {isOpen ? "-" : "+"}
        </div>
      </div>

      {isOpen && (
        <div className="p-6 border-t border-gray-900 dark:border-gray-50">
          {children}
        </div>
      )}
    </div>
  );
};

export const Accordion: React.FC = ({ children }) => {
  return <div className="flex flex-col gap-4 w-full">{children}</div>;
};
