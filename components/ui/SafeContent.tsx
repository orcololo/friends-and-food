'use client';

import React from 'react';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface SafeContentProps {
  content: string;
  className?: string;
  maxLength?: number;
  as?: 'p' | 'div' | 'span';
}

/**
 * SafeContent component for rendering user-generated content
 * Automatically sanitizes HTML to prevent XSS attacks
 */
export default function SafeContent({
  content,
  className = '',
  maxLength,
  as: Component = 'p',
}: SafeContentProps) {
  if (!content) {
    return null;
  }

  // Truncate if maxLength is specified
  let displayContent = content;
  if (maxLength && content.length > maxLength) {
    displayContent = content.substring(0, maxLength) + '...';
  }

  // Sanitize the content to prevent XSS
  const sanitized = sanitizeHtml(displayContent);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
