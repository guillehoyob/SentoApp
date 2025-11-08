// =====================================================
// COMPONENTE: Modal para compartir invitaciones
// =====================================================

import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert, Linking, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { generateInvite } from '../services/invites.service';

interface ShareInviteModalProps {
  groupId: string;
  groupName: string;
  visible: boolean;
  onClose: () => void;
}

export function ShareInviteModal({ groupId, groupName, visible, onClose }: ShareInviteModalProps) {
  const [loading, setLoading] = useState(true);
  const [inviteUrl, setInviteUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  // Generar invitación al abrir el modal
  useEffect(() => {
    if (visible) {
      generateInvitation();
    }
  }, [visible]);

  const generateInvitation = async () => {
    try {
      setLoading(true);
      setError('');
      
      const invite = await generateInvite({
        groupId,
        expiresIn: 604800, // 7 días
      });

      setInviteUrl(invite.url);
      setExpiresAt(new Date(invite.expires_at).toLocaleDateString('es-ES'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(inviteUrl);
    Alert.alert('¡Copiado!', 'Link de invitación copiado al portapapeles');
  };

  const handleShareWhatsApp = async () => {
    const message = `¡Te invito a unirte a mi grupo "${groupName}" en Sento! 🎉\n\nAbre este enlace: ${inviteUrl}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp no disponible', 'Instala WhatsApp para compartir por esta vía');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  const handleShareGeneric = async () => {
    try {
      await Share.share({
        message: `¡Te invito a unirte a mi grupo "${groupName}" en Sento!\n\n${inviteUrl}`,
        title: `Invitación a ${groupName}`,
      });
    } catch (error) {
      console.error('Error compartiendo:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-card rounded-t-3xl p-xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-xl">
            <Text className="font-display text-h2 text-text-primary">
              Invitar participantes
            </Text>
            <TouchableOpacity onPress={onClose} className="p-sm">
              <Text className="font-body-semibold text-xl text-neutral-500">✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-3xl items-center">
              <ActivityIndicator size="large" color="#FF5050" />
              <Text className="font-body text-base text-neutral-600 mt-md">
                Generando link de invitación...
              </Text>
            </View>
          ) : error ? (
            <View className="py-xl">
              <View className="bg-danger/10 p-lg rounded-xl mb-lg">
                <Text className="font-body text-base text-danger">{error}</Text>
              </View>
              <TouchableOpacity
                className="bg-primary rounded-xl py-lg items-center"
                onPress={generateInvitation}
              >
                <Text className="font-body-semibold text-lg text-white">
                  Reintentar
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Link generado */}
              <View className="bg-neutral-50 p-lg rounded-xl mb-lg border border-neutral-200">
                <Text className="font-body-medium text-sm text-neutral-500 mb-xs">
                  Link de invitación
                </Text>
                <Text className="font-body text-sm text-neutral-700 mb-sm" numberOfLines={2}>
                  {inviteUrl}
                </Text>
                <Text className="font-body text-xs text-neutral-400">
                  Expira: {expiresAt}
                </Text>
              </View>

              {/* Botones de compartir */}
              <View className="gap-md">
                <TouchableOpacity
                  className="bg-primary rounded-xl py-lg flex-row items-center justify-center"
                  onPress={handleCopyLink}
                  activeOpacity={0.8}
                >
                  <Text className="text-xl mr-sm">📋</Text>
                  <Text className="font-body-semibold text-lg text-white">
                    Copiar link
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-[#25D366] rounded-xl py-lg flex-row items-center justify-center"
                  onPress={handleShareWhatsApp}
                  activeOpacity={0.8}
                >
                  <Text className="text-xl mr-sm">💬</Text>
                  <Text className="font-body-semibold text-lg text-white">
                    Compartir por WhatsApp
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white border-2 border-primary rounded-xl py-lg flex-row items-center justify-center"
                  onPress={handleShareGeneric}
                  activeOpacity={0.8}
                >
                  <Text className="text-xl mr-sm">📤</Text>
                  <Text className="font-body-semibold text-lg text-primary">
                    Compartir de otra forma
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Info adicional */}
              <View className="mt-xl p-md bg-neutral-50 rounded-lg">
                <Text className="font-body text-sm text-neutral-600 text-center">
                  💡 Cualquier persona con este link podrá unirse al grupo
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

