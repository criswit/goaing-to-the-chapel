import React from 'react';
import { MapPin, Phone, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/HotelInfoHeader.css';

interface HotelInfo {
  name: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
}

interface HotelInfoHeaderProps {
  hotelInfo?: HotelInfo;
  className?: string;
}

const HotelInfoHeader: React.FC<HotelInfoHeaderProps> = ({
  hotelInfo = {
    name: 'Zuri White Sands, Goa Resort & Casino',
    website: 'https://thezurihotels.com/beach-resorts-in-goa',
    address: {
      street: 'Pedda Varca',
      city: 'Salcete',
      state: 'South Goa, Goa',
      postalCode: '403 721',
      country: 'INDIA',
    },
    phone: '+91 0832 272 7272',
  },
  className = '',
}) => {
  const formatAddress = (address: HotelInfo['address']): string => {
    return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
  };

  return (
    <motion.header
      className={`hotel-info-header ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      role="banner"
      aria-label="Hotel Information"
    >
      <div className="hotel-info-container">
        <div className="hotel-info-content">
          <h2 className="hotel-name">
            <a
              href={hotelInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hotel-link"
              aria-label={`Visit ${hotelInfo.name} website`}
            >
              <Globe className="icon" aria-hidden="true" />
              {hotelInfo.name}
            </a>
          </h2>

          <div className="hotel-details">
            <div className="hotel-address" aria-label="Hotel address">
              <MapPin className="icon" aria-hidden="true" />
              <address className="address-text">{formatAddress(hotelInfo.address)}</address>
            </div>

            <div className="hotel-phone" aria-label="Hotel phone number">
              <Phone className="icon" aria-hidden="true" />
              <a
                href={`tel:${hotelInfo.phone.replace(/\s/g, '')}`}
                className="phone-link"
                aria-label={`Call hotel at ${hotelInfo.phone}`}
              >
                {hotelInfo.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default HotelInfoHeader;
