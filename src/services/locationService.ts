export interface Location {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  location: Location;
  address: string;
  category: string;
  rating?: number;
  distance: number; // em metros
  openNow?: boolean;
}

// Função para obter a localização atual do usuário
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada pelo seu navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
};

// Função para buscar lugares próximos usando a API do Google Places
export const getNearbyPlaces = async (
  location: Location,
  category: string,
  radius: number = 100000 // 100km por padrão
): Promise<NearbyPlace[]> => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Chave da API do Google Maps não encontrada');
    }

    const googlePlacesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${category}&key=${apiKey}`;
    const corsProxyUrl = `https://cors-anywhere.herokuapp.com/${googlePlacesUrl}`;

    const response = await fetch(corsProxyUrl, {
      headers: {
        'Origin': window.location.origin,
      },
    });

    const data = await response.json();

    if (!data.results) {
      return [];
    }

    return data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      address: place.vicinity,
      category: place.types[0],
      rating: place.rating,
      distance: calculateDistance(
        location.lat,
        location.lng,
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      openNow: place.opening_hours?.open_now,
    }));
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return [];
  }
};

// Função para calcular a distância entre dois pontos usando a fórmula de Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // em metros
}

// Mapeamento de categorias para tipos do Google Places
export const categoryToPlaceType: Record<string, string> = {
  'Romântico': 'restaurant',
  'Aventura': 'park',
  'Relaxante': 'spa',
  'Cultural': 'museum',
  'Gastronômico': 'restaurant',
  'Ao ar livre': 'park',
  'Noturno': 'night_club',
  'Esportivo': 'gym',
  'Criativo': 'art_gallery',
}; 