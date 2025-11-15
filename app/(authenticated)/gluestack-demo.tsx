import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function GluestackDemoScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedTab, setSelectedTab] = useState('home');

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-primary-500 pt-14 pb-6 px-6 shadow-lg">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-body-semibold">Gluestack UI Demo</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text className="text-primary-100 text-sm font-body mt-1">
          NativeWind v4 + Tailwind CSS v3.4
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          
          {/* Card 1: Buttons */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-md border border-neutral-200">
            <Text className="text-h3 font-body-semibold text-text-primary mb-4">
              🎨 Buttons
            </Text>
            
            <View className="space-y-3">
              <TouchableOpacity 
                className="bg-primary-500 py-4 rounded-xl active:bg-primary-600"
              >
                <Text className="text-white text-center font-body-semibold text-lg">
                  Primary Button
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-secondary-500 py-4 rounded-xl active:bg-secondary-600"
              >
                <Text className="text-white text-center font-body-semibold text-lg">
                  Secondary Button
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="border-2 border-primary-500 py-4 rounded-xl active:bg-primary-50"
              >
                <Text className="text-primary-500 text-center font-body-semibold text-lg">
                  Outline Button
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-neutral-200 py-4 rounded-xl active:bg-neutral-300"
              >
                <Text className="text-neutral-700 text-center font-body-semibold text-lg">
                  Ghost Button
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2: Input */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-md border border-neutral-200">
            <Text className="text-h3 font-body-semibold text-text-primary mb-4">
              ✍️ Input Fields
            </Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-body-medium text-text-secondary mb-2">
                  Email
                </Text>
                <TextInput
                  className="border border-neutral-300 rounded-xl px-4 py-3 font-body text-base"
                  placeholder="tu@email.com"
                  placeholderTextColor="#998989"
                  value={text}
                  onChangeText={setText}
                />
              </View>
              
              <View>
                <Text className="text-sm font-body-medium text-text-secondary mb-2">
                  Password
                </Text>
                <TextInput
                  className="border border-neutral-300 rounded-xl px-4 py-3 font-body text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#998989"
                  secureTextEntry
                />
              </View>
              
              <View>
                <Text className="text-sm font-body-medium text-text-secondary mb-2">
                  Disabled
                </Text>
                <TextInput
                  className="border border-neutral-200 bg-neutral-100 rounded-xl px-4 py-3 font-body text-base text-neutral-500"
                  placeholder="Disabled input"
                  placeholderTextColor="#998989"
                  editable={false}
                />
              </View>
            </View>
          </View>

          {/* Card 3: Switch & Toggle */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-md border border-neutral-200">
            <Text className="text-h3 font-body-semibold text-text-primary mb-4">
              🔄 Switches
            </Text>
            
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-body-semibold text-base text-text-primary">
                    Enable Notifications
                  </Text>
                  <Text className="font-body text-sm text-text-secondary mt-1">
                    Receive push notifications
                  </Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={setIsEnabled}
                  trackColor={{ false: '#E5E5E5', true: '#FF5050' }}
                  thumbColor={isEnabled ? '#FFFFFF' : '#F4F4F4'}
                />
              </View>
              
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-body-semibold text-base text-text-primary">
                    Dark Mode
                  </Text>
                  <Text className="font-body text-sm text-text-secondary mt-1">
                    Use dark theme
                  </Text>
                </View>
                <Switch
                  value={false}
                  trackColor={{ false: '#E5E5E5', true: '#FF5050' }}
                  thumbColor="#F4F4F4"
                />
              </View>
            </View>
          </View>

          {/* Card 4: Badges & Pills */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-md border border-neutral-200">
            <Text className="text-h3 font-body-semibold text-text-primary mb-4">
              🏷️ Badges & Pills
            </Text>
            
            <View className="flex-row flex-wrap gap-2">
              <View className="bg-primary-100 px-3 py-1.5 rounded-full">
                <Text className="text-primary-700 font-body-semibold text-sm">Primary</Text>
              </View>
              
              <View className="bg-green-100 px-3 py-1.5 rounded-full">
                <Text className="text-green-700 font-body-semibold text-sm">Success</Text>
              </View>
              
              <View className="bg-yellow-100 px-3 py-1.5 rounded-full">
                <Text className="text-yellow-700 font-body-semibold text-sm">Warning</Text>
              </View>
              
              <View className="bg-red-100 px-3 py-1.5 rounded-full">
                <Text className="text-red-700 font-body-semibold text-sm">Danger</Text>
              </View>
              
              <View className="bg-blue-100 px-3 py-1.5 rounded-full">
                <Text className="text-blue-700 font-body-semibold text-sm">Info</Text>
              </View>
              
              <View className="bg-neutral-200 px-3 py-1.5 rounded-full">
                <Text className="text-neutral-700 font-body-semibold text-sm">Neutral</Text>
              </View>
            </View>
          </View>

          {/* Card 5: Tabs */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-md border border-neutral-200">
            <Text className="text-h3 font-body-semibold text-text-primary mb-4">
              📑 Tabs
            </Text>
            
            <View className="flex-row bg-neutral-100 rounded-xl p-1">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg ${selectedTab === 'home' ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setSelectedTab('home')}
              >
                <Text className={`text-center font-body-semibold ${selectedTab === 'home' ? 'text-primary-500' : 'text-neutral-600'}`}>
                  Home
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg ${selectedTab === 'profile' ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setSelectedTab('profile')}
              >
                <Text className={`text-center font-body-semibold ${selectedTab === 'profile' ? 'text-primary-500' : 'text-neutral-600'}`}>
                  Profile
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg ${selectedTab === 'settings' ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setSelectedTab('settings')}
              >
                <Text className={`text-center font-body-semibold ${selectedTab === 'settings' ? 'text-primary-500' : 'text-neutral-600'}`}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
            
            <View className="mt-4 p-4 bg-neutral-50 rounded-xl">
              <Text className="font-body text-neutral-600">
                Selected tab: <Text className="font-body-semibold text-primary-500">{selectedTab}</Text>
              </Text>
            </View>
          </View>

          {/* Card 6: Alerts */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-md border border-neutral-200">
            <Text className="text-h3 font-body-semibold text-text-primary mb-4">
              ⚠️ Alerts
            </Text>
            
            <View className="space-y-3">
              <View className="bg-green-50 border border-green-200 rounded-xl p-4">
                <Text className="font-body-semibold text-green-800 mb-1">Success</Text>
                <Text className="font-body text-sm text-green-700">
                  Your changes have been saved successfully!
                </Text>
              </View>
              
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <Text className="font-body-semibold text-yellow-800 mb-1">Warning</Text>
                <Text className="font-body text-sm text-yellow-700">
                  Please review your information before continuing.
                </Text>
              </View>
              
              <View className="bg-red-50 border border-red-200 rounded-xl p-4">
                <Text className="font-body-semibold text-red-800 mb-1">Error</Text>
                <Text className="font-body text-sm text-red-700">
                  Something went wrong. Please try again.
                </Text>
              </View>
            </View>
          </View>

          {/* Final Info Card */}
          <View className="bg-primary-50 border border-primary-200 rounded-2xl p-6">
            <Text className="text-center font-body-semibold text-primary-700 text-lg mb-2">
              ✅ Todo funciona con NativeWind v4
            </Text>
            <Text className="text-center font-body text-primary-600">
              Estás usando Tailwind CSS con sintaxis de clases{'\n'}
              Compatible con Gluestack UI v2
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}



