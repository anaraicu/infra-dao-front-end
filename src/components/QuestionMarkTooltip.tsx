import React from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";

type Info = {
  text: string;
  children: React.ReactNode;
};

export const QuestionMarkTooltip = ({ text, children }: Info) => {
  return (
    <>
      <span className="inline-flex items-center gap-1 shrink-0">
        <span>{children}</span>
        <span data-tooltip-id="questionmark" data-tooltip-content={text}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
            data-tip={text}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
        </span>
        <ReactTooltip id="questionmark">
          <strong>{text}</strong>
        </ReactTooltip>
      </span>
    </>
  );
};
