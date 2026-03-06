/**
 * ===========================================
 * Card Component
 * ===========================================
 * 
 * Reusable card component for displaying content.
 */

import { clsx } from 'clsx';

function Card({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) {
  return (
    <div
      className={clsx(
        hover ? 'card-hover cursor-pointer' : 'card',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('mb-4 pb-4 border-b border-dark-800', className)}>
      {children}
    </div>
  );
};

// Card Title
Card.Title = function CardTitle({ children, className = '' }) {
  return (
    <h3 className={clsx('text-xl font-semibold', className)}>
      {children}
    </h3>
  );
};

// Card Body
Card.Body = function CardBody({ children, className = '' }) {
  return (
    <div className={clsx('', className)}>
      {children}
    </div>
  );
};

// Card Footer
Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-dark-800', className)}>
      {children}
    </div>
  );
};

export default Card;
