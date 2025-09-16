# Google Photos API Setup Guide

This guide will help you connect your wedding website to Google Photos for dynamic photo galleries.

## Quick Setup (5 minutes)

### 1. Get Google Photos API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Wedding Website Photos")
3. Enable the "Google Photos Library API"
4. Create an API Key in "APIs & Services" → "Credentials"
5. Copy your API key

### 2. Add API Key to Your Project

Create a `.env.local` file in your frontend directory:

```bash
# .env.local
REACT_APP_GOOGLE_PHOTOS_API_KEY=your_api_key_here
```

### 3. Create a Shared Album

1. Go to [Google Photos](https://photos.google.com/)
2. Create a new album with your wedding photos
3. Click "Share" on the album
4. Copy the share link (looks like: `https://photos.app.goo.gl/ABC123`)

### 4. Use in Your Components

Replace the current photo gallery with Google Photos:

```tsx
import GooglePhotosGallery from './components/GooglePhotosGallery';

// In your component
<GooglePhotosGallery
  shareLink="https://photos.app.goo.gl/your_album_id"
  maxPhotos={20}
  showCaptions={true}
  enableLightbox={true}
/>
```

## Detailed Setup

### Step 1: Google Cloud Console Setup

1. **Create Project**
   - Visit: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Name: "Wedding Website Photos"
   - Click "Create"

2. **Enable API**
   - Go to "APIs & Services" → "Library"
   - Search "Google Photos Library API"
   - Click "Enable"

3. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the key
   - Click "Restrict Key" for security
   - Under "API restrictions", select "Google Photos Library API"

### Step 2: Environment Setup

Create `.env.local` in your frontend directory:

```bash
# Google Photos API
REACT_APP_GOOGLE_PHOTOS_API_KEY=your_api_key_here

# Optional: For production
REACT_APP_GOOGLE_PHOTOS_ALBUM_ID=your_album_id
```

### Step 3: Google Photos Album Setup

1. **Create Album**
   - Go to photos.google.com
   - Create new album: "Wedding Photos"
   - Add your photos

2. **Share Album**
   - Click "Share" on the album
   - Copy the share link
   - The link format: `https://photos.app.goo.gl/ABC123`

### Step 4: Update Your Components

#### Option A: Use Share Link (Easiest)

```tsx
import GooglePhotosGallery from './components/GooglePhotosGallery';

<GooglePhotosGallery
  shareLink="https://photos.app.goo.gl/your_album_id"
  maxPhotos={20}
  showCaptions={true}
  enableLightbox={true}
  className="wedding-gallery"
/>
```

#### Option B: Use Album ID (More Control)

```tsx
<GooglePhotosGallery
  albumId="your_album_id"
  maxPhotos={20}
  showCaptions={true}
  enableLightbox={true}
  className="wedding-gallery"
/>
```

## Features

- **Dynamic Loading**: Photos load from Google Photos in real-time
- **Automatic Thumbnails**: Optimized image sizes for fast loading
- **Lightbox Gallery**: Click photos to view full-size
- **Responsive Design**: Works on all devices
- **Error Handling**: Graceful fallback if API fails
- **Loading States**: Beautiful loading animations

## Troubleshooting

### Common Issues

1. **"API Key Invalid"**
   - Check your API key is correct
   - Ensure Google Photos Library API is enabled
   - Verify API key restrictions

2. **"Album Not Found"**
   - Check the share link is correct
   - Ensure album is shared publicly
   - Try refreshing the page

3. **"CORS Error"**
   - This is normal for development
   - Will work fine in production
   - Use a backend proxy for development if needed

### Development vs Production

- **Development**: May see CORS errors (normal)
- **Production**: Works perfectly with proper domain restrictions

## Security Best Practices

1. **Restrict API Key**
   - Limit to specific APIs
   - Add domain restrictions
   - Use environment variables

2. **Album Privacy**
   - Use shared albums (not private)
   - Consider what photos you share
   - Regular cleanup of old photos

## Cost

- **Google Photos API**: Free for reasonable usage
- **No additional costs** for typical wedding website usage
- **Rate limits**: 10,000 requests per day (more than enough)

## Need Help?

If you run into issues:

1. Check the browser console for errors
2. Verify your API key is working
3. Test with a simple album first
4. Check the Google Cloud Console for API usage

The setup should take about 5-10 minutes total!


