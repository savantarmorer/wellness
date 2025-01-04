import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, useTheme, alpha } from '@mui/material';
import { Location } from '../services/locationService';
import { DateSuggestion } from '../services/dateSuggestionsService';

interface MapProps {
  userLocation: Location;
  suggestions: DateSuggestion[];
  onMarkerClick?: (suggestion: DateSuggestion) => void;
}

interface MarkerWithInfo extends google.maps.Marker {
  infoWindow?: google.maps.InfoWindow;
}

export const Map: React.FC<MapProps> = ({ userLocation, suggestions, onMarkerClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MarkerWithInfo[]>([]);
  const [activeMarker, setActiveMarker] = useState<MarkerWithInfo | null>(null);
  const theme = useTheme();

  // Inicializa o mapa quando o componente é montado
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !userLocation || !window.google?.maps) return;

      try {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: userLocation.lat, lng: userLocation.lng },
          zoom: 13,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: theme.palette.mode === 'dark' ? '#242f3e' : '#f5f5f5' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: theme.palette.mode === 'dark' ? '#242f3e' : '#f5f5f5' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: theme.palette.mode === 'dark' ? '#746855' : '#616161' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: theme.palette.mode === 'dark' ? '#17263c' : '#c9c9c9' }]
            }
          ],
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: true,
          zoomControl: true,
          gestureHandling: 'greedy'
        });

        // Adiciona marcador da localização do usuário
        new google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: mapInstance,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: theme.palette.primary.main,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
          },
          title: 'Sua localização',
          zIndex: 1000
        });

        // Adiciona controles de zoom personalizados
        const zoomInButton = document.createElement('button');
        zoomInButton.innerHTML = '+';
        zoomInButton.className = 'custom-map-control';
        zoomInButton.style.cssText = `
          background: ${theme.palette.background.paper};
          border: none;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          color: ${theme.palette.text.primary};
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
          padding: 8px 12px;
          transition: background-color 0.2s;
        `;
        zoomInButton.addEventListener('click', () => {
          mapInstance.setZoom((mapInstance.getZoom() || 13) + 1);
        });

        const zoomOutButton = document.createElement('button');
        zoomOutButton.innerHTML = '-';
        zoomOutButton.className = 'custom-map-control';
        zoomOutButton.style.cssText = zoomInButton.style.cssText;
        zoomOutButton.addEventListener('click', () => {
          mapInstance.setZoom((mapInstance.getZoom() || 13) - 1);
        });

        mapInstance.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(zoomInButton);
        mapInstance.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(zoomOutButton);

        // Adiciona listener para fechar infoWindow ao clicar no mapa
        mapInstance.addListener('click', () => {
          if (activeMarker?.infoWindow) {
            activeMarker.infoWindow.close();
            setActiveMarker(null);
          }
        });

        setMap(mapInstance);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [userLocation, theme.palette.mode, theme.palette.primary.main, theme.palette.background.paper, theme.palette.text.primary]);

  // Atualiza os marcadores quando as sugestões mudam
  useEffect(() => {
    if (!map || !suggestions) return;

    // Remove marcadores antigos
    markers.forEach(marker => marker.setMap(null));

    // Adiciona novos marcadores
    const newMarkers = suggestions.map(suggestion => {
      if (!suggestion.location) return null;

      const marker = new google.maps.Marker({
        position: { 
          lat: suggestion.location.lat, 
          lng: suggestion.location.lng 
        },
        map,
        title: suggestion.title,
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: theme.palette.secondary.main,
          fillOpacity: 0.9,
          strokeColor: 'white',
          strokeWeight: 2,
        }
      }) as MarkerWithInfo;

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="
            padding: 16px;
            max-width: 300px;
            background: ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'};
            color: ${theme.palette.mode === 'dark' ? '#ffffff' : '#000000'};
            border-radius: 8px;
            font-family: 'Roboto', sans-serif;
          ">
            <h3 style="
              margin: 0 0 12px 0;
              font-size: 18px;
              font-weight: 500;
              color: ${theme.palette.mode === 'dark' ? '#ffffff' : '#000000'};
            ">${suggestion.title}</h3>

            ${suggestion.description ? `
              <p style="
                margin: 0 0 12px 0;
                font-size: 14px;
                line-height: 1.5;
                color: ${theme.palette.mode === 'dark' ? '#cccccc' : '#666666'};
              ">${suggestion.description}</p>
            ` : ''}

            <p style="
              margin: 0 0 8px 0;
              font-size: 14px;
              color: ${theme.palette.mode === 'dark' ? '#cccccc' : '#666666'};
            ">${suggestion.location?.address}</p>

            ${suggestion.rating ? `
              <p style="
                margin: 8px 0;
                font-size: 14px;
                color: ${theme.palette.mode === 'dark' ? '#cccccc' : '#666666'};
              ">⭐ ${suggestion.rating.toFixed(1)}</p>
            ` : ''}

            ${suggestion.distance ? `
              <p style="
                margin: 8px 0;
                font-size: 14px;
                color: ${theme.palette.mode === 'dark' ? '#cccccc' : '#666666'};
              ">📍 ${(suggestion.distance / 1000).toFixed(1)}km de distância</p>
            ` : ''}

            ${suggestion.imageUrl ? `
              <div style="
                margin: 16px -16px;
                overflow: hidden;
              ">
                <img 
                  src="${suggestion.imageUrl}" 
                  alt="${suggestion.title}" 
                  style="
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                  "
                >
              </div>
            ` : ''}

            <button 
              onclick="window.handleMarkerClick('${suggestion.id}')"
              style="
                display: block;
                width: 100%;
                background: ${theme.palette.primary.main};
                color: ${theme.palette.primary.contrastText};
                border: none;
                border-radius: 8px;
                padding: 12px 16px;
                margin-top: 16px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              "
              onmouseover="this.style.backgroundColor='${theme.palette.primary.dark}'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
              onmouseout="this.style.backgroundColor='${theme.palette.primary.main}'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
            >
              Ver Detalhes
            </button>
          </div>
        `,
        maxWidth: 300,
        disableAutoPan: false
      });

      // Personaliza o estilo da janela de informação
      const infoWindowStyles = document.createElement('style');
      infoWindowStyles.textContent = `
        .gm-style-iw {
          padding: 0 !important;
          background: ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'} !important;
        }
        .gm-style-iw-d {
          overflow: auto !important;
          max-height: 400px !important;
        }
        .gm-style-iw-t::after {
          background: ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'} !important;
        }
        .gm-style-iw button[title="Close"] {
          top: 0 !important;
          right: 0 !important;
          margin: 4px !important;
          color: ${theme.palette.mode === 'dark' ? '#ffffff' : '#000000'} !important;
          background: transparent !important;
        }
        .gm-style-iw button[title="Close"] img {
          display: none !important;
        }
        .gm-style-iw button[title="Close"]::after {
          content: '×';
          font-size: 24px;
          font-weight: 300;
        }
        .gm-style-iw-tc {
          display: none !important;
        }
      `;
      document.head.appendChild(infoWindowStyles);

      // Adiciona função global para lidar com o clique no botão
      (window as any).handleMarkerClick = (id: string) => {
        const suggestion = suggestions.find(s => s.id === id);
        if (suggestion && onMarkerClick) {
          // Fecha a janela de informação ao abrir o modal
          if (activeMarker?.infoWindow) {
            activeMarker.infoWindow.close();
            setActiveMarker(null);
          }
          onMarkerClick(suggestion);
        }
      };

      marker.addListener('click', () => {
        // Fecha a janela de informação ativa anterior
        if (activeMarker?.infoWindow) {
          activeMarker.infoWindow.close();
        }

        // Anima o marcador ao clicar
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 750);
        
        infoWindow.open(map, marker);
        setActiveMarker(marker);
      });

      // Armazena a referência da janela de informação no marcador
      marker.infoWindow = infoWindow;

      return marker;
    }).filter((marker): marker is MarkerWithInfo => marker !== null);

    setMarkers(newMarkers);

    // Ajusta o zoom para mostrar todos os marcadores
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()!));
      map.fitBounds(bounds);

      // Limita o zoom máximo
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 16) map.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, suggestions, onMarkerClick, userLocation, theme.palette.secondary.main]);

  return (
    <Paper
      elevation={3}
      sx={{
        height: '400px',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
    >
      <Box
        ref={mapRef}
        sx={{
          height: '100%',
          width: '100%',
        }}
      />
    </Paper>
  );
}; 