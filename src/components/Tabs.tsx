import * as TabsPrimitive from "@radix-ui/react-tabs";
import classNames from "classnames";
import type { ReactElement, ReactNode } from "react";
import { Children, isValidElement, useState } from "react";

export interface TabsProps extends TabsPrimitive.TabsProps {
  children: ReactElement<TabProps>[];
}

export const Tabs = ({
  children,
  defaultValue,
  value,
  onValueChange,
  ...props
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (defaultValue) {
      return defaultValue;
    }
    return children[0].props.id;
  });
  return (
    <TabsPrimitive.Root
      {...props}
      value={value || activeTab}
      onValueChange={onValueChange || setActiveTab}
    >
      <TabsPrimitive.List
        className="flex items-center whitespace-nowrap justify-start w-full border-b border-b-gray-200 dark:border-b-gray-800 gap-8 overflow-x-scroll md:overflow-x-visible"
        role="tablist"
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child) || child.props.hidden) return null;
          const isActive = child.props.id === (value || activeTab);
          const triggerClass = classNames(
            "inline-flex items-center flex-initial whitespace-nowrap py-4 text-body-md font-medium",
            "uppercase",
            {
              "border-b-2 border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50 ":
                isActive,
              "text-gray-500 dark:text-gray-300 dark:border-gray-50": !isActive,
            }
          );
          // const borderClass = classNames(
          //   "absolute bottom-[-1px] left-0 w-full h-0 border-b ",
          //   "border-b-white dark:border-b-black",
          //   { hidden: !isActive }
          // );
          return (
            <TabsPrimitive.Trigger
              data-testid={child.props.name}
              value={child.props.id}
              className={triggerClass}
            >
              {child.props.name}
              <span />
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
      <div className="h-full overflow-auto">
        {Children.map(children, (child) => {
          if (!isValidElement(child) || child.props.hidden) return null;
          return (
            <TabsPrimitive.Content
              value={child.props.id}
              className="h-full py-10"
              data-testid={`tab-${child.props.id}`}
            >
              {child.props.children}
            </TabsPrimitive.Content>
          );
        })}
      </div>
    </TabsPrimitive.Root>
  );
};

interface TabProps {
  children: ReactNode;
  id: string;
  name: string;
  hidden?: boolean;
}

export const Tab = ({ children, ...props }: TabProps) => {
  return <div {...props}>{children}</div>;
};
