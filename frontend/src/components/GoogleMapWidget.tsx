import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import '../styles/GoogleMapWidget.css';

interface GoogleMapWidgetProps {
  className?: string;
}

const GoogleMapWidget: React.FC<GoogleMapWidgetProps> = ({ className = '' }) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleMapLoad = () => {
    setIsLoading(false);
  };

  const handleMapError = () => {
    setMapError(true);
    setIsLoading(false);
  };

  const mapSrc =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14471.241483922857!2d73.91584928059294!3d15.230536101087699!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbfb49c84bd23e5%3A0xa6437361c8d39990!2sThe%20Zuri%20White%20Sands%2C%20Goa%20Resort%20%26%20Casino!5e0!3m2!1sen!2sus!4v1757150308856!5m2!1sen!2sus';

  const fallbackContent = (
    <div className="map-fallback">
      <MapPin size={48} />
      <h3>The Zuri White Sands, Goa Resort & Casino</h3>
      <p>Varca Beach, South Goa</p>
      <p>Pedda, Varca, Goa 403721</p>
      <a
        href="https://maps.google.com/?q=The+Zuri+White+Sands+Goa+Resort"
        target="_blank"
        rel="noopener noreferrer"
        className="map-external-link"
      >
        View on Google Maps
      </a>
    </div>
  );

  return (
    <div className={`google-map-widget ${className}`}>
      {isLoading && !mapError && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading map...</p>
        </div>
      )}

      {mapError ? (
        fallbackContent
      ) : (
        <iframe
          src={mapSrc}
          width="100%"
          height="400"
          style={{ border: 0, borderRadius: '8px' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Zuri White Sands Resort Location"
          aria-label="Google Maps showing Zuri White Sands Resort location in Varca Beach, South Goa"
          onLoad={handleMapLoad}
          onError={handleMapError}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      )}
    </div>
  );
};

export default GoogleMapWidget;
