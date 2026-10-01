import { z } from 'zod';

export const deliveryDetailsSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  address: z.string().trim().min(10, 'Enter a complete delivery address').max(500, 'Address is too long'),
  latitude: z.number({ required_error: 'Current GPS location is required' }).min(-90).max(90),
  longitude: z.number({ required_error: 'Current GPS location is required' }).min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
});

export interface DeliveryCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const requestCurrentLocation = () => new Promise<DeliveryCoordinates>((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('GPS location is not supported on this device'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    }),
    (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? 'Location permission allow karein, phir dobara try karein'
        : 'Current location nahi mil saki. GPS on karke dobara try karein';
      reject(new Error(message));
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
  );
});