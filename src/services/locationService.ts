import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { ApiService } from './apiService';
import { LocationData } from '../types';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
const LOCATION_UPDATE_DISTANCE = 100; // 100 metros

/**
 * Servicio para rastreo GPS en segundo plano
 */
export class LocationService {
  private static driverId: string | null = null;
  private static isTracking: boolean = false;

  /**
   * Inicializa el servicio de ubicación
   */
  static async initialize(driverId: string): Promise<boolean> {
    try {
      this.driverId = driverId;

      // Solicitar permisos de ubicación
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Permiso de ubicación en primer plano denegado');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.error('Permiso de ubicación en segundo plano denegado');
        return false;
      }

      console.log('Permisos de ubicación otorgados');
      return true;
    } catch (error) {
      console.error('Error inicializando servicio de ubicación:', error);
      return false;
    }
  }

  /**
   * Inicia el rastreo GPS en segundo plano
   */
  static async startTracking(): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.log('El rastreo ya está activo');
        return true;
      }

      if (!this.driverId) {
        console.error('No se ha establecido el driverId');
        return false;
      }

      // Definir la tarea de ubicación en segundo plano
      TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
        if (error) {
          console.error('Error en tarea de ubicación:', error);
          return;
        }

        if (data) {
          const { locations } = data as any;
          if (locations && locations.length > 0) {
            const location = locations[0];
            await this.handleLocationUpdate(location);
          }
        }
      });

      // Iniciar el rastreo en segundo plano
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_UPDATE_INTERVAL,
        distanceInterval: LOCATION_UPDATE_DISTANCE,
        foregroundService: {
          notificationTitle: 'Rastreo GPS Activo',
          notificationBody: 'Tu ubicación está siendo rastreada para entregas',
          notificationColor: '#FF0000',
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });

      this.isTracking = true;
      console.log('Rastreo GPS iniciado correctamente');
      return true;
    } catch (error) {
      console.error('Error iniciando rastreo GPS:', error);
      return false;
    }
  }

  /**
   * Detiene el rastreo GPS
   */
  static async stopTracking(): Promise<void> {
    try {
      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (isTaskDefined) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      this.isTracking = false;
      console.log('Rastreo GPS detenido');
    } catch (error) {
      console.error('Error deteniendo rastreo GPS:', error);
    }
  }

  /**
   * Maneja la actualización de ubicación
   */
  private static async handleLocationUpdate(location: any): Promise<void> {
    try {
      if (!this.driverId) {
        console.error('No hay driverId disponible');
        return;
      }

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      console.log('Nueva ubicación:', locationData);

      // Enviar ubicación al servidor
      const result = await ApiService.sendLocation(this.driverId, locationData);
      if (result.success) {
        console.log('Ubicación enviada correctamente');
      } else {
        console.error('Error enviando ubicación:', result.message);
      }
    } catch (error) {
      console.error('Error manejando actualización de ubicación:', error);
    }
  }

  /**
   * Obtiene la ubicación actual (una sola vez)
   */
  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error obteniendo ubicación actual:', error);
      return null;
    }
  }

  /**
   * Verifica si el rastreo está activo
   */
  static isTrackingActive(): boolean {
    return this.isTracking;
  }
}
