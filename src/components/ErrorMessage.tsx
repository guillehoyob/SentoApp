import { View, Text } from 'react-native';

interface ErrorMessageProps {
  message: string;
  visible?: boolean;
}

export function ErrorMessage({ message, visible = true }: ErrorMessageProps) {
  if (!visible || !message) return null;

  return (
    <View className="bg-danger/10 border-l-4 border-danger p-sm rounded mb-md">
      <Text className="font-body text-base text-danger">
        {message}
      </Text>
    </View>
  );
}

