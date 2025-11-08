import { TextInput, TextInputProps, View, Text } from 'react-native';
import { useState } from 'react';

interface TextInputComponentProps extends TextInputProps {
  error?: string;
  label?: string;
  className?: string;
}

export function TextInputComponent({ error, label, className = '', multiline, ...props }: TextInputComponentProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-lg">
      {label && (
        <Text className="font-body-semibold text-base text-neutral-900 mb-xs">
          {label}
        </Text>
      )}
      <TextInput
        className={`
          ${multiline ? 'h-[120px] py-md' : 'h-[56px]'}
          border-2 rounded-xl px-lg text-base font-body bg-white text-neutral-900
          ${isFocused ? 'border-primary' : error ? 'border-danger' : 'border-neutral-200'}
          ${className}
        `}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#BBAEAE"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {error && (
        <Text className="font-body-medium text-sm text-danger mt-xs">
          {error}
        </Text>
      )}
    </View>
  );
}

