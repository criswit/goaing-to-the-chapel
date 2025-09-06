# Cultural Compass Floating TOC - Implementation Plan

## 🎯 Project Overview

The Cultural Compass is a sophisticated floating table of contents system designed to serve as "ambient wedding intelligence" for navigating the comprehensive 11-event, 2-day wedding timeline. It provides contextual navigation with cultural awareness, transforming a simple TOC into an intelligent wedding companion.

## 🧠 Core Design Philosophy

### "Ambient Wedding Intelligence"
The floating TOC should feel like having a **sophisticated wedding coordinator** who:
- **Whispers context** without interrupting the experience
- **Anticipates needs** based on scroll behavior and timeline position  
- **Provides cultural guidance** through the Indian/American/Fusion transitions
- **Adapts intelligently** to different devices and interaction patterns

### "Wedding Planner's Clipboard" Metaphor
Imagine a wedding planner's clipboard that:
- Shows where you are in the day's timeline
- Previews what's coming next
- Indicates cultural transitions
- Provides quick "jump-ahead" capability

## 🎨 Visual Design System

### Progressive Disclosure Interaction Model

```
   Dormant State          Hover State           Expanded State
   ┌─────────┐           ┌──────────────┐      ┌─────────────────────┐
   │    ●    │    →      │ ● Haldi      │  →   │ ● Guest Arrival     │
   │         │           │ ○ Cocktails  │      │ ● Haldi (current)   │
   └─────────┘           │ ○ Sangeet    │      │ ○ Room Check-in     │
                         └──────────────┘      │ ○ Cocktail Hour     │
                                               │ ○ Sangeet Night     │
                                               │ ○ Jaymaal           │
                                               │ ○ Baraat            │
                                               │ ○ Jaimala           │
                                               │ ○ Intermission      │
                                               │ ○ Mandap            │
                                               │ ○ Reception         │
                                               └─────────────────────┘
```

### Cultural Color System
- **Indian**: Saffron/Orange (#FF6B35)
- **American**: Blue (#4A90E2) 
- **Fusion**: Purple/Gradient (#8B5CF6)

### Interaction States
1. **Dormant**: Cultural color dot (12px) positioned fixed right: 24px, top: 50%
2. **Hover/Touch**: Expands to mini-timeline (200px width) with next 3 events
3. **Click/Long-press**: Full overlay (300px) with complete timeline
4. **Navigation**: Smooth scroll with cultural transition animations

## 🏗️ Technical Architecture

### Component Structure
```
src/components/CulturalCompass/
├── CulturalCompass.tsx          # Main orchestrator component
├── TimelineIndicator.tsx        # Progress visualization
├── CulturalBadge.tsx           # Morphing cultural indicators  
├── EventPreview.tsx            # Condensed event cards
├── ScrollSpy.tsx               # Intelligent scroll detection
├── CulturalCompass.css         # Component-specific styles
└── types.ts                    # TypeScript interfaces
```

### Core Interfaces
```typescript
interface CulturalEvent {
  id: string;
  title: string;
  time: string;
  culture: 'Indian' | 'American' | 'Fusion';
  duration: string;
  description: string;
  isActive?: boolean;
}

interface CompassState {
  visibility: 'dormant' | 'hover' | 'expanded' | 'navigation';
  activeEvent: string;
  culturalContext: string;
  scrollProgress: number;
}

interface ResponsiveMode {
  mode: 'desktop' | 'tablet' | 'mobile';
  position: 'sidebar' | 'floating' | 'drawer';
  gestures: boolean;
}
```

## 📱 Responsive Design Strategy

### Desktop (1024px+)
- **Layout**: Fixed sidebar compass with full timeline visibility
- **Position**: Right side, always visible when scrolling
- **Interactions**: Hover states, click navigation
- **Features**: Full timeline, cultural context preview, progress arc

### Tablet (768px-1023px)  
- **Layout**: Floating button that expands to overlay
- **Position**: Bottom-right corner with expansion upward
- **Interactions**: Touch gestures, swipe support
- **Features**: Condensed timeline, gesture navigation

### Mobile (320px-767px)
- **Layout**: Bottom-anchored indicator with swipe-up drawer
- **Position**: Bottom center with drawer expansion
- **Interactions**: Swipe gestures, haptic feedback
- **Features**: Compact timeline, touch-optimized navigation

## 🚀 Implementation Phases

### Phase 1: Core Component Architecture (4-6 hours)

#### 1.1 Main CulturalCompass Component
```typescript
// CulturalCompass.tsx
const CulturalCompass: React.FC = () => {
  const [state, setState] = useState<CompassState>({
    visibility: 'dormant',
    activeEvent: '',
    culturalContext: '',
    scrollProgress: 0
  });
  
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>();
  
  // Core logic implementation
  return (
    <div className={`cultural-compass cultural-compass--${state.visibility}`}>
      {/* Component content */}
    </div>
  );
};
```

#### 1.2 ScrollSpy Implementation
```typescript
// ScrollSpy.tsx
const useScrollSpy = (eventIds: string[]) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrollVelocity, setScrollVelocity] = useState<number>(0);
  
  useEffect(() => {
    const handleScroll = debounce(() => {
      // Scroll detection logic
      const sections = document.querySelectorAll('[data-event-id]');
      const scrollPosition = window.scrollY + 100;
      
      // Cultural context detection
      // Velocity calculation
      // Active section determination
    }, 100);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [eventIds]);
  
  return { activeSection, scrollVelocity };
};
```

#### 1.3 Cultural Badge System
```typescript
// CulturalBadge.tsx
const CulturalBadge: React.FC<{ culture: CultureType; isActive: boolean }> = ({ 
  culture, 
  isActive 
}) => {
  const colors = {
    'Indian': '#FF6B35',
    'American': '#4A90E2',
    'Fusion': '#8B5CF6'
  };
  
  return (
    <motion.div
      className="cultural-badge"
      animate={{
        backgroundColor: colors[culture],
        scale: isActive ? 1.2 : 1.0
      }}
      transition={{ duration: 0.3 }}
    >
      {culture}
    </motion.div>
  );
};
```

### Phase 2: Progressive Disclosure System (3-4 hours)

#### 2.1 State Management
- Implement visibility state transitions
- Add hover/touch detection
- Create expansion animations
- Handle click/long-press events

#### 2.2 Animation System
```typescript
const progressiveDisclosureVariants = {
  dormant: { 
    width: 12, 
    height: 12, 
    opacity: 0.7 
  },
  hover: { 
    width: 200, 
    height: 'auto', 
    opacity: 1 
  },
  expanded: { 
    width: 300, 
    height: 'auto', 
    opacity: 1 
  }
};
```

#### 2.3 Event Preview Cards
- Condensed event information
- Cultural context indicators
- Time and duration display
- Smooth scroll integration

### Phase 3: Cultural Intelligence Features (3-4 hours)

#### 3.1 Color Morphing System
```typescript
const useCulturalTransition = (currentCulture: CultureType) => {
  const [transitionState, setTransitionState] = useState({
    from: currentCulture,
    to: currentCulture,
    progress: 0
  });
  
  // HSL color interpolation logic
  // Smooth transition calculations
  // Context preview generation
  
  return transitionState;
};
```

#### 3.2 Context Awareness
- Cultural transition detection
- "What's next" preview system
- Timeline progress calculation
- Smart positioning logic

#### 3.3 Predictive Behavior
```typescript
const useAmbientVisibility = () => {
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    const handleScroll = debounce(() => {
      const scrollVelocity = getScrollVelocity();
      const isInEventsSection = isScrolledToEvents();
      const hasStoppedScrolling = scrollVelocity < 50;
      
      setShouldShow(isInEventsSection && hasStoppedScrolling);
    }, 100);
    
    return shouldShow;
  }, []);
};
```

### Phase 4: Responsive Implementation (2-3 hours)

#### 4.1 Breakpoint Detection
```typescript
const useResponsiveMode = (): ResponsiveMode => {
  const [mode, setMode] = useState<ResponsiveMode>({
    mode: 'desktop',
    position: 'sidebar',
    gestures: false
  });
  
  useEffect(() => {
    const updateMode = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setMode({ mode: 'desktop', position: 'sidebar', gestures: false });
      } else if (width >= 768) {
        setMode({ mode: 'tablet', position: 'floating', gestures: true });
      } else {
        setMode({ mode: 'mobile', position: 'drawer', gestures: true });
      }
    };
    
    window.addEventListener('resize', updateMode);
    updateMode();
    
    return () => window.removeEventListener('resize', updateMode);
  }, []);
  
  return mode;
};
```

#### 4.2 Gesture Support
- Touch event handling
- Swipe detection
- Haptic feedback (where supported)
- Gesture-based navigation

#### 4.3 Smart Positioning
- Content overlap avoidance
- Dynamic positioning based on scroll
- Z-index management
- Safe area considerations

### Phase 5: Integration & Testing (2-3 hours)

#### 5.1 Events Timeline Integration
```typescript
// Integration with existing Events.tsx
const eventsData = [
  {
    id: 'guest-arrival',
    title: 'Guest Arrival & Welcome',
    time: '3:00-3:30pm',
    culture: 'American',
    duration: '30 min',
    description: 'Initial welcome drinks and greetings...'
  },
  // ... other events
];
```

#### 5.2 Navigation Coordination
- Smooth scroll integration with Navigation.tsx
- Conflict resolution with existing nav
- Mobile menu coordination
- Focus management

#### 5.3 Performance Optimization
```typescript
// Optimized scroll handling
const debouncedScrollHandler = useMemo(
  () => debounce((event) => {
    // Scroll logic
  }, 16), // 60fps
  []
);

// Memoized cultural calculations
const culturalContext = useMemo(() => {
  return calculateCulturalContext(activeEvent, eventsData);
}, [activeEvent, eventsData]);
```

### Phase 6: Accessibility & Polish (2-3 hours)

#### 6.1 Accessibility Features
```typescript
// ARIA labels and roles
<div 
  role="navigation" 
  aria-label="Wedding events timeline navigation"
  aria-expanded={state.visibility !== 'dormant'}
>
  {/* Component content */}
</div>

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      setState(prev => ({ ...prev, visibility: 'dormant' }));
      break;
    case 'ArrowUp':
    case 'ArrowDown':
      // Navigate through events
      break;
    case 'Enter':
    case ' ':
      // Activate navigation
      break;
  }
};
```

#### 6.2 Screen Reader Support
- Cultural transition announcements
- Progress updates
- Event navigation feedback
- State change notifications

#### 6.3 Cross-browser Testing
- Chrome, Firefox, Safari, Edge compatibility
- Mobile browser testing (iOS Safari, Chrome Mobile)
- Touch gesture consistency
- Animation performance validation

## 🎪 Key Differentiators & "Wow Factor" Elements

### 1. Cultural Color Breathing
Subtle pulsing animation that matches cultural theme:
```css
.cultural-badge--indian {
  animation: culturalPulse 3s ease-in-out infinite;
  --pulse-color: #FF6B35;
}

@keyframes culturalPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(255, 107, 53, 0); }
}
```

### 2. Timeline Progress Ring
Circular progress that fills as you move through events:
```typescript
const progressPercentage = (currentEventIndex / totalEvents) * 100;
const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
```

### 3. Contextual Micro-Interactions
Hover states that preview event details:
```typescript
const eventPreview = {
  title: "Haldi Ceremony",
  nextUp: "Cocktail Hour in 1.5 hours",
  culturalNote: "Transitioning from Indian ceremony to Fusion celebration"
};
```

### 4. Smart Notifications
Gentle alerts for important cultural transitions:
```typescript
const culturalTransitions = {
  'haldi-to-cocktails': 'Transitioning from Indian ceremony to Fusion celebration',
  'sangeet-to-jaymaal': 'Moving from evening festivities to wedding day traditions'
};
```

### 5. Gesture Fluidity
Swipe gestures that feel like flipping through a wedding program:
```typescript
const swipeHandlers = useSwipeable({
  onSwipedUp: () => expandTimeline(),
  onSwipedDown: () => collapseTimeline(),
  onSwipedLeft: () => navigateToNext(),
  onSwipedRight: () => navigateToPrevious(),
  trackMouse: true
});
```

## 🔧 Integration Requirements

### Existing Components
- **Events.tsx**: Source of timeline data and structure
- **Navigation.tsx**: Coordination for smooth scroll functionality
- **App.tsx**: Global state management integration

### Dependencies to Add
```json
{
  "react-use-gesture": "^9.1.3",
  "framer-motion": "^10.16.4" // (already exists)
}
```

### CSS Integration
- Coordinate with existing CSS custom properties
- Maintain design system consistency
- Ensure no conflicts with existing animations

## 📊 Success Metrics

### Functional Requirements
- ✅ Progressive disclosure works smoothly across all states
- ✅ Cultural color transitions are smooth and contextually appropriate
- ✅ Responsive behavior adapts correctly to all device sizes
- ✅ Integration with existing components is seamless
- ✅ Performance maintains 60fps during interactions

### User Experience Requirements
- ✅ Feels helpful, not intrusive
- ✅ Provides clear cultural context and navigation utility
- ✅ Enhances the wedding timeline storytelling experience
- ✅ Works intuitively across all device types
- ✅ Creates a memorable, sophisticated interaction

### Technical Requirements
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Core Web Vitals optimization maintained
- ✅ Cross-browser compatibility verified
- ✅ Performance optimized with debounced events
- ✅ Progressive enhancement support

## 🎯 Next Steps

1. **Start with Phase 1**: Create the core component architecture
2. **Build incrementally**: Test each phase before moving to the next
3. **Gather feedback**: Test with real users during development
4. **Iterate quickly**: Refine based on user interaction patterns
5. **Polish thoroughly**: Ensure accessibility and performance standards

This Cultural Compass system will transform the wedding events section from a simple timeline into an intelligent, culturally-aware navigation experience that enhances the storytelling and practical utility of the wedding celebration timeline.

