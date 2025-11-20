import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar, AppState, AppStateStatus } from 'react-native';
import { PhoneService } from './src/services/phoneService';
import { ApiService } from './src/services/apiService';
import { LocationService } from './src/services/locationService';
import { StorageService } from './src/services/storageService';

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Actualizar hora cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Actualizar fecha cada minuto
    const dateTimer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    // Inicializar servicios en segundo plano (sin mostrar nada al usuario)
    initializeBackgroundServices();

    // Escuchar cambios de estado de la app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(timer);
      clearInterval(dateTimer);
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      await checkDriverStatus();
    }
  };

  const initializeBackgroundServices = async () => {
    try {
      // Verificar si ya hay información guardada
      const savedDriverId = await StorageService.getDriverId();
      const savedIsActive = await StorageService.isActive();

      if (savedDriverId && savedIsActive) {
        // Iniciar rastreo directamente
        const initialized = await LocationService.initialize(savedDriverId);
        if (initialized) {
          await LocationService.startTracking();
        }
        return;
      }

      // Si no hay información guardada, verificar con el servidor
      const phoneNumber = await PhoneService.getPhoneNumber();
      if (!phoneNumber) return;

      // Verificar con el servidor
      const verification = await ApiService.verifyDriver(phoneNumber);

      if (verification.success && verification.isRegistered && verification.isActive && verification.driverId) {
        // Guardar información
        await StorageService.saveDriverInfo(
          verification.driverId,
          verification.driverName || '',
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
        }
      }
    } catch (error) {
      // Silencioso - no mostrar errores al usuario
      console.error('Error en inicialización:', error);
    }
  };

  const checkDriverStatus = async () => {
    try {
      const phoneNumber = await StorageService.getPhoneNumber();
      if (!phoneNumber) return;

      const verification = await ApiService.verifyDriver(phoneNumber);
      const savedIsActive = await StorageService.isActive();
      
      if (!verification.isActive && savedIsActive) {
        // El chofer fue desactivado
        await LocationService.stopTracking();
        await StorageService.setInactive();
      } else if (verification.isActive && !savedIsActive && verification.driverId) {
        // El chofer fue reactivado
        const initialized = await LocationService.initialize(verification.driverId);
        if (initialized) {
          await LocationService.startTracking();
        }
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} de ${month} de ${year}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.clockContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockContainer: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 72,
    fontWeight: '200',
    color: '#ffffff',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '300',
    color: '#999999',
    marginTop: 16,
    letterSpacing: 1,
  },
});
