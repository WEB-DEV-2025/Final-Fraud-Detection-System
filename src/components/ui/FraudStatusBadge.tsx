import { AlertTriangle, CheckCircle } from 'lucide-react';

interface FraudStatusBadgeProps {
  isFraud: boolean;
  probability: number;
  size?: 'sm' | 'md' | 'lg';
  withLabel?: boolean;
  className?: string;
}

function FraudStatusBadge({ 
  isFraud, 
  probability, 
  size = 'md', 
  withLabel = true,
  className = '' 
}: FraudStatusBadgeProps) {
  
  // Size configurations
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  // Status configurations
  const statusConfig = isFraud 
    ? {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: AlertTriangle,
        label: 'Fraud Detected'
      }
    : {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: CheckCircle,
        label: 'Legitimate'
      };
  
  const Icon = statusConfig.icon;
  
  return (
    <span className={`inline-flex items-center rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} ${sizeClasses[size]} ${className}`}>
      <Icon className={`${iconSizes[size]} mr-1`} />
      {withLabel && (
        <span className="font-medium">
          {statusConfig.label} ({Math.round(probability * 100)}%)
        </span>
      )}
    </span>
  );
}

export default FraudStatusBadge;