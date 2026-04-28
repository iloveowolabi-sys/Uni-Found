import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center px-6 py-2.5 border text-sm font-semibold rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform active:scale-[0.98]";
  
  const variants = {
    primary: "border-transparent text-white bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 focus:ring-blue-500",
    secondary: "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 focus:ring-blue-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 hover:-translate-y-0.5 focus:ring-red-500",
    ghost: "border-transparent text-blue-600 bg-transparent hover:bg-blue-50 focus:ring-blue-500 shadow-none hover:shadow-none hover:-translate-y-0.5"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
};

export default Button;