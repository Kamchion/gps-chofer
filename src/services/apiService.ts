import axios from 'axios';
import { DriverVerificationResponse, LocationData } from '../types';

const API_URL = 'https://manus-store-production.up.railway.app/api/trpc';

/**
 * Servicio para comunicación con el backend
 */
export class ApiService {
  /**
   * Verifica si un número de teléfono está registrado y activo
   */
  static async verifyDriver(phoneNumber: string): Promise<DriverVerificationResponse> {
    try {
      const response = await axios.post(`${API_URL}/driver.verify`, {
        phoneNumber,
      });
      
      const result = response.data?.result?.data;
      if (!result) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      return result;
    } catch (error) {
      console.error('Error verificando chofer:', error);
      return {
        success: false,
        isRegistered: false,
        isActive: false,
        message: 'Error de conexión con el servidor',
      };
    }
  }

  /**
   * Envía la ubicación del chofer al servidor
   */
  static async sendLocation(
    driverId: string,
    location: LocationData
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axios.post(`${API_URL}/driver.updateLocation`, {
        driverId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error enviando ubicación:', error);
      return {
        success: false,
        message: 'Error enviando ubicación al servidor',
      };
    }
  }

  /**
   * Actualiza el deviceId del chofer
   */
  static async updateDeviceId(
    driverId: string,
    deviceId: string
  ): Promise<{ success: boolean }> {
    try {
      await axios.post(`${API_URL}/driver.updateDevice`, {
        driverId,
        deviceId,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error actualizando deviceId:', error);
      return { success: false };
    }
  }
}
