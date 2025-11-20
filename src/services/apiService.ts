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
      console.log('Verificando chofer:', phoneNumber);
      
      const response = await axios.post(
        `${API_URL}/driver.verify`,
        { phoneNumber },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.log('Respuesta del servidor:', response.data);
      
      const result = response.data?.result?.data;
      if (!result) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error verificando chofer:', error.response?.data || error.message);
      
      // Extraer mensaje de error de TRPC
      const errorMessage = error.response?.data?.error?.json?.message 
        || error.response?.data?.error?.message
        || 'Error de conexión con el servidor';
      
      return {
        success: false,
        isRegistered: false,
        isActive: false,
        message: errorMessage,
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
      console.log('Enviando ubicación:', { driverId, location });
      
      const response = await axios.post(
        `${API_URL}/driver.updateLocation`,
        {
          driverId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.log('Ubicación enviada:', response.data);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error enviando ubicación:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error?.json?.message 
        || error.response?.data?.error?.message
        || 'Error enviando ubicación al servidor';
      
      return {
        success: false,
        message: errorMessage,
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
      console.log('Actualizando deviceId:', { driverId, deviceId });
      
      await axios.post(
        `${API_URL}/driver.updateDevice`,
        { driverId, deviceId },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando deviceId:', error.response?.data || error.message);
      return { success: false };
    }
  }
}
