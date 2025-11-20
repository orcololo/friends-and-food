import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      <Link href="/dashboard" className="group">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center text-gray-500 hover:text-orange-600 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="sr-only">Home</span>
        </motion.div>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4 text-gray-400" />

            {item.href && !isLast ? (
              <Link href={item.href}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="text-gray-600 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  {item.label}
                </motion.span>
              </Link>
            ) : (
              <span
                className={`${
                  isLast
                    ? 'text-gray-800 font-medium'
                    : 'text-gray-600'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
