export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface DriverInfo {
  id: string;
  phoneNumber: string;
  name: string;
  isActive: boolean;
  deviceId?: string;
}

export interface DriverVerificationResponse {
  success: boolean;
  isRegistered: boolean;
  isActive: boolean;
  driverId?: string;
  driverName?: string;
  message?: string;
}
