import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Servicio para detectar el número de teléfono del dispositivo
 */
export class PhoneService {
  /**
   * Obtiene el número de teléfono del dispositivo
   * En Android, intenta obtenerlo del SIM
   * Si no está disponible, usa el deviceId como identificador
   */
  static async getPhoneNumber(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        // Intentar obtener el número del SIM
        try {
          const SimData = require('react-native-sim-data');
          const simData = await SimData.getTelephoneNumber();
          
          if (simData && simData.phoneNumber) {
            // Limpiar el número (quitar espacios, guiones, etc.)
            const cleanNumber = simData.phoneNumber.replace(/[\s\-\(\)]/g, '');
            console.log('Número de teléfono detectado:', cleanNumber);
            return cleanNumber;
          }
        } catch (simError) {
          console.log('No se pudo obtener número del SIM:', simError);
        }
        
        // Si no se puede obtener el número, usar el deviceId
        const deviceId = await Device.osBuildId;
        if (deviceId) {
          console.log('Usando deviceId como identificador:', deviceId);
          return `DEVICE_${deviceId}`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo número de teléfono:', error);
      return null;
    }
  }

  /**
   * Obtiene información del dispositivo
   */
  static async getDeviceInfo(): Promise<{
    deviceId: string | null;
    brand: string | null;
    modelName: string | null;
    osVersion: string | null;
  }> {
    return {
      deviceId: await Device.osBuildId || null,
      brand: Device.brand || null,
      modelName: Device.modelName || null,
      osVersion: Device.osVersion || null,
    };
  }
}
