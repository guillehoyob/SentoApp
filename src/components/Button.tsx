import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export function Button({ title, onPress, loading = false, disabled = false, variant = 'primary', className = '' }: ButtonProps) {
  const isDisabled = loading || disabled;

  const baseClasses = 'h-[56px] rounded-xl justify-center items-center mb-md';
  
  const variantClasses = {
    primary: 'bg-primary shadow-lg',
    secondary: 'bg-white border-2 border-primary shadow-md',
    danger: 'bg-danger shadow-lg',
  };

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-primary',
    danger: 'text-white',
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#FF5050' : '#fff'} />
      ) : (
        <Text className={`font-body-semibold text-lg ${textVariantClasses[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

