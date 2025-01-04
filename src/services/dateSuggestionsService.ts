import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'date_suggestions';

// Calculate distance between two points using the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export interface DateSuggestionFilter {
  categories?: string[];
  maxCost?: number;
  location?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
  userInterests?: string[];
}

export interface DateSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  cost: number;
  rating?: number;
  likes?: number;
  dislikes?: number;
  userRating?: 'like' | 'dislike';
  imageUrl?: string;
  distance?: number;
}

export const getSuggestions = async (filters?: DateSuggestionFilter) => {
  try {
    const suggestionsRef = collection(db, COLLECTION_NAME);
    let q = query(suggestionsRef);

    if (filters?.categories?.length) {
      q = query(q, where('category', 'in', filters.categories));
    }

    if (filters?.maxCost) {
      q = query(q, where('cost', '<=', filters.maxCost));
    }

    // Note: For location-based filtering, you'll need to implement
    // geohashing or use a service like Algolia for better performance

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as DateSuggestion[];
  } catch (error) {
    console.error('Error getting suggestions:', error);
    throw error;
  }
};

export const addSuggestion = async (suggestion: Omit<DateSuggestion, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...suggestion,
      createdAt: Timestamp.now(),
      likes: 0,
      dislikes: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding suggestion:', error);
    throw error;
  }
};

export const rateSuggestion = async (
  suggestionId: string,
  userId: string,
  rating: 'like' | 'dislike'
) => {
  try {
    const suggestionRef = doc(db, COLLECTION_NAME, suggestionId);
    const ratingField = rating === 'like' ? 'likes' : 'dislikes';
    
    await updateDoc(suggestionRef, {
      [ratingField]: increment(1),
      [`userRatings.${userId}`]: rating,
    });
  } catch (error) {
    console.error('Error rating suggestion:', error);
    throw error;
  }
};

// Categorias predefinidas
export const categories = [
  'Romântico',
  'Aventura',
  'Relaxante',
  'Cultural',
  'Gastronômico',
  'Ao ar livre',
  'Noturno',
  'Esportivo',
  'Criativo',
];

// Função para gerar sugestões personalizadas com base nos interesses
export const getPersonalizedSuggestions = async (
  userInterests: string[],
  location?: { lat: number; lng: number }
) => {
  try {
    const allSuggestions = await getSuggestions();
    
    const scoredSuggestions = allSuggestions.map(suggestion => {
      let score = 0;
      
      if (userInterests.includes(suggestion.category)) {
        score += 2;
      }
      
      if (suggestion.rating) {
        score += suggestion.rating;
      }
      
      // Add location-based scoring if location is provided
      if (location && suggestion.location) {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          suggestion.location.lat,
          suggestion.location.lng
        );
        // Give higher scores to closer locations (within 5km)
        if (distance <= 5000) score += 3;
        else if (distance <= 10000) score += 2;
        else if (distance <= 20000) score += 1;
      }
      
      const totalRatings = (suggestion.likes || 0) + (suggestion.dislikes || 0);
      if (totalRatings > 0) {
        const likeRatio = (suggestion.likes || 0) / totalRatings;
        score += likeRatio * 2;
      }
      
      return { ...suggestion, score };
    });
    
    return scoredSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting personalized suggestions:', error);
    throw error;
  }
}; 