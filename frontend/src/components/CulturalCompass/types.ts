export type CultureType = 'Indian' | 'American' | 'Fusion';

export interface CulturalEvent {
  id: string;
  title: string;
  time: string;
  culture: CultureType;
  duration: string;
  description: string;
  isActive?: boolean;
  date?: string;
  location?: string;
}

export type CompassVisibility = 'dormant' | 'hover' | 'expanded' | 'navigation';

export interface CompassState {
  visibility: CompassVisibility;
  activeEvent: string;
  culturalContext: CultureType;
  scrollProgress: number;
}

export type ResponsiveMode = 'desktop' | 'tablet' | 'mobile';

export interface ResponsiveConfig {
  mode: ResponsiveMode;
  position: 'sidebar' | 'floating' | 'drawer';
  gestures: boolean;
}

export interface CulturalColors {
  Indian: string;
  American: string;
  Fusion: string;
}

export const CULTURAL_COLORS: CulturalColors = {
  Indian: '#DC143C',
  American: '#B22222',
  Fusion: '#CD5C5C',
};
