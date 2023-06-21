import React from "react";
import classNames from "../util/classnames";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "PRIMARY" | "SECONDARY" | "GREEN" | "RED";
  className?: string;
  children: React.ReactNode;
};

export const BaseButton = React.memo(
  ({ size, variant, children, className, ...rest }: ButtonProps) => (
    <button className={getButtonClassNames(className, size, variant)} {...rest}>
      {children}
    </button>
  )
);

export const PrimaryButton = React.memo(
  ({ children, className, ...rest }: ButtonProps) => {
    return (
      <BaseButton
        className={classNames(
          className,
          "flex items-center justify-center text-center"
        )}
        {...rest}
      >
        {children}
      </BaseButton>
    );
  }
);

export function getButtonClassNames(
  className?: string | undefined,
  size?: string | undefined,
  variant?: string | undefined
): string | undefined {
  return classNames(
    className,
    "inline-flex items-center border border-solid font-medium rounded shadow-sm focus:outline-none",
    size === "xs" && "px-4 py-[6px] h-[40px] text-body-sm rounded-lg",
    size === "sm" && "px-4 py-2.5 h-[40px] text-body-sm rounded-[10px]",
    (!size || size === "md") && "px-6 py-3 h-[48px] text-body-md rounded-xl",
    size === "lg" && "px-8 py-4 h-[56px] text-body-md rounded-2xl",
    (!variant || variant === "PRIMARY") &&
      `
          relative text-white dark:hover:text-white disabled:text-gray-400 dark:text-white dark:disabled:text-alpha-light-40
          bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-50 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:disabled:bg-alpha-light-5
        `,
    variant === "SECONDARY" &&
      `
          relative text-gray-900 dark:text-gray-50 disabled:text-gray-400 dark:disabled:text-alpha-light-40
          border border-gray-200 disabled:border-gray-100 dark:border-alpha-light-20 dark:disabled:border-alpha-light-5 hover:border-gray-900 dark:hover:border-gray-50 dark:disabled:border-gray-50/10
          bg-transparent
        `,
    variant === "RED" &&
      `
            relative text-white dark:hover:text-white disabled:text-gray-400 dark:text-white dark:disabled:text-alpha-light-40
            bg-red-500 hover:bg-red-600 disabled:bg-gray-50 dark:bg-red-500 dark:hover:bg-red-600 dark:disabled:bg-alpha-light-5
          `,
    variant === "GREEN" &&
      `
                relative text-white dark:hover:text-white disabled:text-gray-400 dark:text-white dark:disabled:text-alpha-light-40
                bg-green-500 hover:bg-green-600 disabled:bg-gray-50 dark:bg-green-500 dark:hover:bg-green-600 dark:disabled:bg-alpha-light-5
              `
  );
}
