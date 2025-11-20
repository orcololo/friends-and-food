import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export default function FormLabel({
  htmlFor,
  children,
  required = false,
  icon: Icon,
  className = '',
}: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-2 ${className}`}
    >
      <span className="flex items-center">
        {Icon && <Icon className="w-4 h-4 mr-1.5 text-gray-500" />}
        {children}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </span>
    </label>
  );
}
