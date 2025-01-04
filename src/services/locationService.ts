/// <reference types="@types/google.maps" />
import { categoryToPlaceType } from '../utils/categoryMapping';
import axios from 'axios';

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
  description?: string;
  types?: string[];
  priceLevel?: number;
  photoUrl?: string;
  website?: string;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

// Localização padrão para São Paulo
const DEFAULT_LOCATION: Location = {
  lat: -23.5505,
  lng: -46.6333,
  city: 'São Paulo',
  state: 'SP'
};

// Cache da última localização conhecida
let lastKnownLocation: Location | null = null;

export const getCurrentLocation = async (): Promise<Location> => {
  // Se já temos uma localização em cache, use-a primeiro
  if (lastKnownLocation) {
    return lastKnownLocation;
  }

  return new Promise((resolve) => {
    // Timeout para fallback
    const timeoutId = setTimeout(() => {
      console.warn('Timeout ao obter localização, usando localização padrão');
      resolve(DEFAULT_LOCATION);
    }, 10000); // 10 segundos de timeout

    // Tenta obter a localização atual
    if (!navigator.geolocation) {
      console.warn('Geolocalização não suportada, usando localização padrão');
      clearTimeout(timeoutId);
      resolve(DEFAULT_LOCATION);
      return;
    }

    const options = {
      enableHighAccuracy: false, // false para resposta mais rápida
      timeout: 8000, // 8 segundos
      maximumAge: 300000 // Aceita cache de até 5 minutos
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          clearTimeout(timeoutId);
          
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: undefined,
            state: undefined
          };

          // Tenta obter cidade e estado usando Nominatim
          try {
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
              params: {
                format: 'json',
                lat: location.lat,
                lon: location.lng,
                'accept-language': 'pt-BR'
              },
              headers: {
                'User-Agent': 'WellnessMonitor/1.0'
              }
            });

            if (response.data && response.data.address) {
              location.city = response.data.address.city || 
                            response.data.address.town || 
                            response.data.address.village || 
                            response.data.address.municipality;
              location.state = response.data.address.state;
            }
          } catch (error) {
            console.warn('Erro ao obter detalhes da localização:', error);
          }

          // Salva no cache
          lastKnownLocation = location;
          resolve(location);
        } catch (error) {
          console.error('Erro ao processar localização:', error);
          clearTimeout(timeoutId);
          resolve(DEFAULT_LOCATION);
        }
      },
      (error) => {
        console.warn('Erro de geolocalização:', error.message);
        clearTimeout(timeoutId);
        
        // Se temos uma localização em cache, use-a como fallback
        if (lastKnownLocation) {
          console.log('Usando última localização conhecida');
          resolve(lastKnownLocation);
          return;
        }

        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.warn('Permissão de localização negada, usando localização padrão');
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('Posição indisponível, usando localização padrão');
            break;
          case error.TIMEOUT:
            console.warn('Tempo esgotado, usando localização padrão');
            break;
          default:
            console.warn('Erro desconhecido, usando localização padrão');
        }
        resolve(DEFAULT_LOCATION);
      },
      options
    );
  });
};

let isGoogleMapsInitialized = false;

export const initializeGoogleMaps = async (): Promise<void> => {
  if (isGoogleMapsInitialized) return;

  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Chave da API do Google Maps não encontrada');
    }

    await new Promise<void>((resolve, reject) => {
      if (window.google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps não foi carregado corretamente'));
        }
      };
      script.onerror = () => reject(new Error('Erro ao carregar a API do Google Maps'));
      document.head.appendChild(script);
    });

    isGoogleMapsInitialized = true;
  } catch (error) {
    console.error('Error initializing Google Maps:', error);
    throw error;
  }
};

// Função para buscar lugares próximos usando a API do Google Places
export const getNearbyPlaces = async (
  location: Location,
  category: string,
  radius: number = 10000 // 10km por padrão
): Promise<NearbyPlace[]> => {
  try {
    await initializeGoogleMaps();

    return new Promise((resolve, reject) => {
      try {
        console.log('getNearbyPlaces - location:', location);
        console.log('getNearbyPlaces - category:', category);
        console.log('getNearbyPlaces - radius:', radius);

        if (!window.google || !window.google.maps || !window.google.maps.geometry) {
          reject(new Error('Google Maps não está carregado corretamente. Por favor, recarregue a página.'));
          return;
        }

        performPlacesSearch(location, category, radius, resolve, reject);
      } catch (error) {
        console.error('Error in getNearbyPlaces:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error initializing Google Maps:', error);
    throw error;
  }
};

let mapDiv: HTMLDivElement | null = null;
let map: google.maps.Map | null = null;
let placesService: google.maps.places.PlacesService | null = null;

export const getMapInstance = (): google.maps.Map | null => map;

function getMapElement(): HTMLDivElement {
  if (!mapDiv) {
    mapDiv = document.createElement('div');
    mapDiv.style.width = '100px';
    mapDiv.style.height = '100px';
    mapDiv.style.position = 'absolute';
    mapDiv.style.left = '-9999px';
    document.body.appendChild(mapDiv);
  }
  return mapDiv;
}

export function initializePlacesService(location: Location): google.maps.places.PlacesService {
  if (!placesService) {
    const mapElement = getMapElement();
    if (!map) {
      map = new google.maps.Map(mapElement, {
        center: location,
        zoom: 15,
      });
    } else {
      map.setCenter(location);
    }
    placesService = new google.maps.places.PlacesService(map);
  }
  return placesService;
}

export function cleanupMapInstance() {
  if (mapDiv && mapDiv.parentNode) {
    mapDiv.parentNode.removeChild(mapDiv);
  }
  map = null;
  placesService = null;
  mapDiv = null;
}

function performPlacesSearch(
  location: Location,
  category: string,
  radius: number,
  resolve: (places: NearbyPlace[]) => void,
  reject: (error: Error) => void
) {
  try {
    console.log('performPlacesSearch - starting search');
    
    const placeType = categoryToPlaceType[category];
    if (!placeType) {
      console.error('performPlacesSearch - category not mapped:', category);
      resolve([]); // Retorna array vazio em vez de rejeitar
      return;
    }

    const service = initializePlacesService(location);
    
    // Configuração da busca baseada no raio
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(location.lat, location.lng),
      type: placeType
    };

    // Se o raio for menor que 50km, usamos radius
    // Se for maior, usamos rankBy DISTANCE para pegar os mais próximos
    if (radius <= 50000) {
      request.radius = radius;
    } else {
      request.rankBy = google.maps.places.RankBy.DISTANCE;
    }

    service.nearbySearch(
      request,
      (
        results: google.maps.places.PlaceResult[] | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          try {
            // Processa os resultados e busca detalhes adicionais
            const processedPlaces = results.map(async (place) => {
              // Calcula a distância
              const placeLocation = new google.maps.LatLng(
                place.geometry?.location?.lat() || 0,
                place.geometry?.location?.lng() || 0
              );
              const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(location.lat, location.lng),
                placeLocation
              );

              // Se a distância for maior que o raio desejado, ignora o lugar
              if (distance > radius) {
                return null;
              }

              // Busca detalhes adicionais do lugar
              const details = await new Promise<google.maps.places.PlaceResult>((resolveDetails) => {
                service.getDetails(
                  {
                    placeId: place.place_id!,
                    fields: ['website', 'opening_hours', 'price_level']
                  },
                  (detailsResult) => {
                    resolveDetails(detailsResult || place);
                  }
                );
              });

              // Gera uma descrição com base nos tipos
              const types = place.types || [];
              const typeDescriptions = types
                .filter(type => !['point_of_interest', 'establishment'].includes(type))
                .map(type => {
                  switch(type) {
                    case 'restaurant': return 'Restaurante';
                    case 'cafe': return 'Café';
                    case 'bar': return 'Bar';
                    case 'movie_theater': return 'Cinema';
                    case 'museum': return 'Museu';
                    case 'park': return 'Parque';
                    case 'art_gallery': return 'Galeria de Arte';
                    case 'shopping_mall': return 'Shopping';
                    case 'gym': return 'Academia';
                    case 'spa': return 'Spa';
                    case 'night_club': return 'Casa Noturna';
                    case 'bakery': return 'Padaria';
                    case 'book_store': return 'Livraria';
                    case 'bowling_alley': return 'Boliche';
                    case 'casino': return 'Cassino';
                    case 'department_store': return 'Loja de Departamento';
                    case 'clothing_store': return 'Loja de Roupas';
                    case 'stadium': return 'Estádio';
                    case 'beach': return 'Praia';
                    case 'natural_feature': return 'Atração Natural';
                    default: return null;
                  }
                })
                .filter(Boolean);

              let description = typeDescriptions.length > 0 
                ? `${typeDescriptions.join(', ')}. `
                : '';

              if (place.rating) {
                description += `Avaliação: ${place.rating.toFixed(1)} ⭐`;
              }

              return {
                id: place.place_id || '',
                name: place.name || '',
                location: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0,
                },
                address: place.vicinity || '',
                category,
                rating: place.rating,
                distance,
                openNow: details.opening_hours?.isOpen?.() || false,
                description: description.trim(),
                types: place.types,
                priceLevel: details.price_level,
                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
                website: details.website
              } as NearbyPlace;
            });

            // Aguarda todos os detalhes serem processados
            Promise.all(processedPlaces)
              .then(places => {
                const validPlaces = places
                  .filter((place): place is NearbyPlace => place !== null)
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, 20);

                console.log('performPlacesSearch - mapped places:', validPlaces);
                resolve(validPlaces);
              })
              .catch(error => {
                console.error('Error processing place details:', error);
                reject(error);
              });
          } catch (error) {
            console.error('Error processing places:', error);
            reject(error as Error);
          }
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.log('performPlacesSearch - no results found');
          resolve([]); // Retorna array vazio para nenhum resultado
        } else {
          console.error('performPlacesSearch - error status:', status);
          reject(new Error(`Erro ao buscar lugares: ${status}`));
        }
      }
    );
  } catch (error) {
    console.error('performPlacesSearch - error:', error);
    reject(error as Error);
  }
} 