import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key is not configured' }, { status: 500 });
  }

  try {
    // 1. Text Search to find the place and its photo reference
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ error: 'No places found' }, { status: 404 });
    }

    const place = searchData.results[0];
    
    if (!place.photos || place.photos.length === 0) {
      return NextResponse.json({ error: 'No photos found for this place' }, { status: 404 });
    }

    // Return up to 10 photo URLs
    const photoUrls = place.photos.slice(0, 10).map((photo: any) => 
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`
    );

    return NextResponse.json({ photoUrls });
  } catch (error) {
    console.error('Places API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
