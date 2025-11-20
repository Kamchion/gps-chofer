import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { PhoneService } from './src/services/phoneService';
import { ApiService } from './src/services/apiService';
import { LocationService } from './src/services/locationService';
import { StorageService } from './src/services/storageService';

export default function App() {
  const [status, setStatus] = useState<string>('Inicializando...');
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    initializeApp();

    // Escuchar cambios de estado de la app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // Verificar estado cuando la app vuelve al primer plano
      await checkDriverStatus();
    }
  };

  const initializeApp = async () => {
    try {
      console.log('=== Iniciando GPS Chofer ===');
      setStatus('Verificando información del dispositivo...');

      // Verificar si ya hay información guardada
      const savedDriverId = await StorageService.getDriverId();
      const savedIsActive = await StorageService.isActive();

      if (savedDriverId && savedIsActive) {
        console.log('Chofer ya registrado:', savedDriverId);
        setStatus('Chofer registrado. Iniciando rastreo...');
        
        // Iniciar rastreo directamente
        const initialized = await LocationService.initialize(savedDriverId);
        if (initialized) {
          await LocationService.startTracking();
          setIsActive(true);
          setStatus('Rastreo GPS activo');
        } else {
          setStatus('Error: No se pudieron obtener permisos de ubicación');
        }
        return;
      }

      // Si no hay información guardada, verificar con el servidor
      setStatus('Obteniendo número de teléfono...');
      const phoneNumber = await PhoneService.getPhoneNumber();

      if (!phoneNumber) {
        setStatus('Error: No se pudo detectar el número de teléfono');
        console.error('No se pudo obtener el número de teléfono');
        return;
      }

      console.log('Número detectado:', phoneNumber);
      setStatus('Verificando con el servidor...');

      // Verificar con el servidor
      const verification = await ApiService.verifyDriver(phoneNumber);

      if (!verification.success) {
        setStatus('Error: No se pudo conectar con el servidor');
        console.error('Error de verificación:', verification.message);
        return;
      }

      if (!verification.isRegistered) {
        setStatus('Este número no está registrado');
        console.log('Número no registrado en el sistema');
        return;
      }

      if (!verification.isActive) {
        setStatus('Este chofer está desactivado');
        console.log('Chofer desactivado por el administrador');
        return;
      }

      // Chofer verificado y activo
      if (verification.driverId && verification.driverName) {
        console.log('Chofer verificado:', verification.driverName);
        setStatus('Chofer verificado. Iniciando rastreo...');

        // Guardar información
        await StorageService.saveDriverInfo(
          verification.driverId,
          verification.driverName,
          phoneNumber
        );

        // Actualizar deviceId en el servidor
        const deviceInfo = await PhoneService.getDeviceInfo();
        if (deviceInfo.deviceId) {
          await ApiService.updateDeviceId(verification.driverId, deviceInfo.deviceId);
        }

        // Inicializar y comenzar rastreo
        const initialized = await LocationService.initialize(verification.driverId);
        if (initialized) {
          await LocationService.startTracking();
          setIsActive(true);
          setStatus('Rastreo GPS activo');
        } else {
          setStatus('Error: No se pudieron obtener permisos de ubicación');
        }
      }
    } catch (error) {
      console.error('Error en inicialización:', error);
      setStatus('Error: ' + (error as Error).message);
    }
  };

  const checkDriverStatus = async () => {
    try {
      const phoneNumber = await StorageService.getPhoneNumber();
      if (!phoneNumber) return;

      const verification = await ApiService.verifyDriver(phoneNumber);
      
      if (!verification.isActive && isActive) {
        // El chofer fue desactivado
        console.log('Chofer desactivado remotamente');
        await LocationService.stopTracking();
        await StorageService.setInactive();
        setIsActive(false);
        setStatus('Chofer desactivado por el administrador');
      } else if (verification.isActive && !isActive && verification.driverId) {
        // El chofer fue reactivado
        console.log('Chofer reactivado remotamente');
        const initialized = await LocationService.initialize(verification.driverId);
        if (initialized) {
          await LocationService.startTracking();
          setIsActive(true);
          setStatus('Rastreo GPS activo');
        }
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.title}>GPS Tracker</Text>
        <Text style={styles.status}>{status}</Text>
        {isActive && (
          <View style={styles.activeIndicator}>
            <View style={styles.dot} />
            <Text style={styles.activeText}>Rastreo Activo</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  status: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  activeText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
