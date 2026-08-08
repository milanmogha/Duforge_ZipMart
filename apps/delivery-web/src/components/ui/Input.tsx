import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
}

const Input: React.FC<InputProps> = ({ prefix, className = "", ...rest }) => {
  if (prefix) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">
          {prefix}
        </span>
        <input className={`input-field pl-8 ${className}`} {...rest} />
      </div>
    );
  }
  return <input className={`input-field ${className}`} {...rest} />;
};

export default Input;
