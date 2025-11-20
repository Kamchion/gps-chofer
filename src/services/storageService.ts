import AsyncStorage from '@react-native-async-storage/async-storage';

const DRIVER_ID_KEY = '@gps_chofer_driver_id';
const DRIVER_NAME_KEY = '@gps_chofer_driver_name';
const PHONE_NUMBER_KEY = '@gps_chofer_phone_number';
const IS_ACTIVE_KEY = '@gps_chofer_is_active';

/**
 * Servicio para almacenamiento local de datos
 */
export class StorageService {
  /**
   * Guarda la información del chofer
   */
  static async saveDriverInfo(
    driverId: string,
    driverName: string,
    phoneNumber: string
  ): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [DRIVER_ID_KEY, driverId],
        [DRIVER_NAME_KEY, driverName],
        [PHONE_NUMBER_KEY, phoneNumber],
        [IS_ACTIVE_KEY, 'true'],
      ]);
      console.log('Información del chofer guardada');
    } catch (error) {
      console.error('Error guardando información del chofer:', error);
    }
  }

  /**
   * Obtiene el ID del chofer
   */
  static async getDriverId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(DRIVER_ID_KEY);
    } catch (error) {
      console.error('Error obteniendo driver ID:', error);
      return null;
    }
  }

  /**
   * Obtiene el nombre del chofer
   */
  static async getDriverName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(DRIVER_NAME_KEY);
    } catch (error) {
      console.error('Error obteniendo driver name:', error);
      return null;
    }
  }

  /**
   * Obtiene el número de teléfono
   */
  static async getPhoneNumber(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PHONE_NUMBER_KEY);
    } catch (error) {
      console.error('Error obteniendo phone number:', error);
      return null;
    }
  }

  /**
   * Verifica si el chofer está activo
   */
  static async isActive(): Promise<boolean> {
    try {
      const isActive = await AsyncStorage.getItem(IS_ACTIVE_KEY);
      return isActive === 'true';
    } catch (error) {
      console.error('Error verificando estado activo:', error);
      return false;
    }
  }

  /**
   * Marca el chofer como inactivo
   */
  static async setInactive(): Promise<void> {
    try {
      await AsyncStorage.setItem(IS_ACTIVE_KEY, 'false');
      console.log('Chofer marcado como inactivo');
    } catch (error) {
      console.error('Error marcando como inactivo:', error);
    }
  }

  /**
   * Limpia toda la información almacenada
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        DRIVER_ID_KEY,
        DRIVER_NAME_KEY,
        PHONE_NUMBER_KEY,
        IS_ACTIVE_KEY,
      ]);
      console.log('Información del chofer eliminada');
    } catch (error) {
      console.error('Error limpiando información:', error);
    }
  }
}
