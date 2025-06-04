import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  hover = true,
  glass = false,
  gradient = false,
  onClick,
  className = '',
  ...props 
}) => {
  const cardClasses = [
    'card',
    hover && 'card-hover',
    glass && 'card-glass',
    gradient && 'card-gradient',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      className={cardClasses}
      onClick={onClick}
      whileHover={hover ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </motion.div>
  );
};

export default Card;