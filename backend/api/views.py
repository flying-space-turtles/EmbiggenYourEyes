from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Message
from .serializers import MessageSerializer

import requests
import math
from django.http import JsonResponse
import google.generativeai as genai
import os

@api_view(['GET'])
def health_check(request):
    return Response({'status': 'healthy', 'message': 'API is working!'})

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

from django.http import JsonResponse
from rest_framework.decorators import api_view
import requests

@api_view(['GET'])
def geocode_search(request):
    query = request.GET.get("q")
    if not query:
        return JsonResponse({"error": "Missing query parameter 'q'."}, status=400)

    # Call Nominatim API
    url = "https://nominatim.openstreetmap.org/search"
    params = {"format": "json", "q": query, "limit": 5}  # limit to 5 results
    headers = {"User-Agent": "django-geocoder"}

    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    if not data:
        return JsonResponse({"error": "Location not found."}, status=404)

    results = []
    for item in data:
        bbox = [float(coord) for coord in item["boundingbox"]]  # [south, north, west, east]
        results.append({
            "name": item["display_name"],
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
            "boundingbox": {
                "south": bbox[0],
                "north": bbox[1],
                "west": bbox[2],
                "east": bbox[3]
            }
        })

    return JsonResponse({"results": results})

@api_view(["GET"])
def get_region(request):
    # Accept either the old single-point format or new 4-corner format
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    
    # New 4-corner format parameters
    top_left_lat = request.GET.get("top_left_lat")
    top_left_lon = request.GET.get("top_left_lon")
    top_right_lat = request.GET.get("top_right_lat")
    top_right_lon = request.GET.get("top_right_lon")
    bottom_left_lat = request.GET.get("bottom_left_lat")
    bottom_left_lon = request.GET.get("bottom_left_lon")
    bottom_right_lat = request.GET.get("bottom_right_lat")
    bottom_right_lon = request.GET.get("bottom_right_lon")

    # Check if we have the new 4-corner format
    corner_params = [top_left_lat, top_left_lon, top_right_lat, top_right_lon, 
                    bottom_left_lat, bottom_left_lon, bottom_right_lat, bottom_right_lon]
    
    if all(param is not None for param in corner_params):
        # Use 4-corner format
        try:
            # Convert to floats
            corners = {
                'top_left': {'lat': float(top_left_lat), 'lon': float(top_left_lon)},
                'top_right': {'lat': float(top_right_lat), 'lon': float(top_right_lon)},
                'bottom_left': {'lat': float(bottom_left_lat), 'lon': float(bottom_left_lon)},
                'bottom_right': {'lat': float(bottom_right_lat), 'lon': float(bottom_right_lon)}
            }
            
            # Calculate center point for primary location lookup
            center_lat = (corners['top_left']['lat'] + corners['top_right']['lat'] + 
                         corners['bottom_left']['lat'] + corners['bottom_right']['lat']) / 4
            center_lon = (corners['top_left']['lon'] + corners['top_right']['lon'] + 
                         corners['bottom_left']['lon'] + corners['bottom_right']['lon']) / 4
            
            # Calculate bounding box
            all_lats = [corners[corner]['lat'] for corner in corners]
            all_lons = [corners[corner]['lon'] for corner in corners]
            bbox = {
                'north': max(all_lats),
                'south': min(all_lats),
                'east': max(all_lons),
                'west': min(all_lons)
            }
            
            # Get region information using the center point
            r = requests.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"format": "json", "lat": center_lat, "lon": center_lon},
                headers={"User-Agent": "django-geocoder"}
            )
            r.raise_for_status()
            data = r.json()
            
            # Get the address components for a more detailed description
            address = data.get("address", {})
            display_name = data.get("display_name", f"{center_lat:.3f}, {center_lon:.3f}")
            
            # Calculate approximate area in square kilometers
            # Rough approximation using the haversine formula for small areas
            lat_diff = bbox['north'] - bbox['south']
            lon_diff = bbox['east'] - bbox['west']
            # At the equator: 1 degree ≈ 111 km
            # Adjust for latitude (longitude lines get closer at higher latitudes)
            lat_km = lat_diff * 111
            lon_km = lon_diff * 111 * abs(math.cos(math.radians(center_lat)))
            area_km2 = lat_km * lon_km
            
            # Build a comprehensive region description
            region_parts = []
            
            # Add specific location info
            if 'city' in address or 'town' in address or 'village' in address:
                locality = address.get('city') or address.get('town') or address.get('village')
                region_parts.append(locality)
            
            if 'state' in address or 'province' in address:
                state = address.get('state') or address.get('province')
                region_parts.append(state)
                
            if 'country' in address:
                region_parts.append(address['country'])
            
            region_description = ", ".join(region_parts) if region_parts else display_name
            
            # Add area information
            if area_km2 > 1:
                area_str = f" (viewing ~{area_km2:.1f} km²)"
            else:
                area_str = f" (viewing ~{area_km2*1000000:.0f} m²)"
            
            region_description += area_str
            
            return Response({
                "region": region_description,
                "center": {"lat": center_lat, "lon": center_lon},
                "bounding_box": bbox,
                "area_km2": area_km2,
                "address_components": address
            })
            
        except (ValueError, TypeError) as e:
            return Response({"error": f"Invalid coordinate values: {str(e)}"}, status=400)
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=500)
            
    elif lat is not None and lon is not None:
        # Fall back to old single-point format for backward compatibility
        try:
            r = requests.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"format": "json", "lat": lat, "lon": lon},
                headers={"User-Agent": "django-geocoder"}
            )
            r.raise_for_status()
            data = r.json()
            display_name = data.get("display_name", f"{lat}, {lon}")
            return Response({"region": display_name})
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=500)
        except ValueError:
            return Response({"error": "Invalid JSON from Nominatim", "raw": r.text}, status=500)
    else:
        return Response({
            "error": "Missing coordinates. Provide either 'lat' & 'lon' or all 8 corner coordinates (top_left_lat, top_left_lon, etc.)"
        }, status=400)

@api_view(["GET"])
def generate_historical_prompt(request):
    """
    Generate an LLM prompt for historical events and landmarks based on viewport coordinates
    """
    # Generate the prompt using our helper function
    prompt_text, location_context, error = _generate_prompt_data(request)
    
    if error:
        return Response(error, status=error.get('status', 500))
    
    if not prompt_text:
        return Response({"error": "Failed to generate prompt"}, status=500)
    
    return Response({
        "prompt": prompt_text,
        "location_context": location_context,
        "prompt_length": len(prompt_text)
    })

def _generate_prompt_data(request):
    """
    Helper function to generate prompt data from request parameters.
    Returns a tuple of (prompt_text, location_context, error_response)
    """
    # Get the same coordinate parameters as other functions
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    
    # New 4-corner format parameters
    top_left_lat = request.GET.get("top_left_lat")
    top_left_lon = request.GET.get("top_left_lon")
    top_right_lat = request.GET.get("top_right_lat")
    top_right_lon = request.GET.get("top_right_lon")
    bottom_left_lat = request.GET.get("bottom_left_lat")
    bottom_left_lon = request.GET.get("bottom_left_lon")
    bottom_right_lat = request.GET.get("bottom_right_lat")
    bottom_right_lon = request.GET.get("bottom_right_lon")

    # Check if we have the new 4-corner format
    corner_params = [top_left_lat, top_left_lon, top_right_lat, top_right_lon, 
                    bottom_left_lat, bottom_left_lon, bottom_right_lat, bottom_right_lon]
    
    if all(param is not None for param in corner_params):
        # Use 4-corner format
        try:
            # Convert to floats
            corners = {
                'top_left': {'lat': float(top_left_lat), 'lon': float(top_left_lon)},
                'top_right': {'lat': float(top_right_lat), 'lon': float(top_right_lon)},
                'bottom_left': {'lat': float(bottom_left_lat), 'lon': float(bottom_left_lon)},
                'bottom_right': {'lat': float(bottom_right_lat), 'lon': float(bottom_right_lon)}
            }
            
            # Calculate center point and bounding box
            center_lat = (corners['top_left']['lat'] + corners['top_right']['lat'] + 
                         corners['bottom_left']['lat'] + corners['bottom_right']['lat']) / 4
            center_lon = (corners['top_left']['lon'] + corners['top_right']['lon'] + 
                         corners['bottom_left']['lon'] + corners['bottom_right']['lon']) / 4
            
            all_lats = [corners[corner]['lat'] for corner in corners]
            all_lons = [corners[corner]['lon'] for corner in corners]
            bbox = {
                'north': max(all_lats),
                'south': min(all_lats),
                'east': max(all_lons),
                'west': min(all_lons)
            }
            
            # Calculate approximate area
            lat_diff = bbox['north'] - bbox['south']
            lon_diff = bbox['east'] - bbox['west']
            lat_km = lat_diff * 111
            lon_km = lon_diff * 111 * abs(math.cos(math.radians(center_lat)))
            area_km2 = lat_km * lon_km
            
            # Get location context using Nominatim
            try:
                r = requests.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={"format": "json", "lat": center_lat, "lon": center_lon},
                    headers={"User-Agent": "django-geocoder"}
                )
                r.raise_for_status()
                location_data = r.json()
                address = location_data.get("address", {})
                location_name = location_data.get("display_name", f"{center_lat:.3f}, {center_lon:.3f}")
            except:
                address = {}
                location_name = f"{center_lat:.3f}, {center_lon:.3f}"
            
            # Build comprehensive LLM prompt
            prompt = f"""You are a knowledgeable historian and geographer. I am viewing a specific region on Earth through a 3D globe interface. Please provide me with interesting historical events, landmarks, and cultural significance for this area.

**Geographic Information:**
- Location: {location_name}
- Center coordinates: {center_lat:.4f}°, {center_lon:.4f}°
- Bounding box: {bbox['north']:.4f}°N to {bbox['south']:.4f}°S, {bbox['west']:.4f}°W to {bbox['east']:.4f}°E
- Viewing area: approximately {area_km2:.1f} km²

**Context from Address:**"""

            if address.get('city') or address.get('town') or address.get('village'):
                locality = address.get('city') or address.get('town') or address.get('village')
                prompt += f"\n- City/Town: {locality}"
            
            if address.get('state') or address.get('province'):
                state = address.get('state') or address.get('province')
                prompt += f"\n- State/Province: {state}"
                
            if address.get('country'):
                prompt += f"\n- Country: {address['country']}"
                
            if address.get('county'):
                prompt += f"\n- County/Region: {address['county']}"

            prompt += f"""

**Please provide information about:**

1. **Historical Events** (3-5 most significant):
   - Major historical events that occurred in or near this area
   - Include approximate dates and brief descriptions
   - Focus on events of regional, national, or international significance

2. **Notable Landmarks & Sites** (3-5 most interesting):
   - Famous buildings, monuments, or natural features
   - Archaeological sites or UNESCO World Heritage locations
   - Culturally or historically significant places

3. **Cultural & Social Significance**:
   - Important cultural movements or figures associated with this area
   - Traditional or indigenous history if applicable
   - Economic or strategic importance throughout history

4. **Interesting Facts**:
   - Unique geographical features
   - Notable "firsts" or records associated with this location
   - Lesser-known but fascinating historical tidbits

**Instructions:**
- Be specific about locations within the viewing area when possible
- Include dates for historical events
- Keep descriptions concise but informative (2-3 sentences each)
- Prioritize accuracy and cite well-known historical facts
- If this is a rural or less historically documented area, focus on regional context and natural features
- Format your response clearly with headers and bullet points for easy reading

Thank you for helping me learn about this fascinating region of our world!"""

            location_context = {
                "center": {"lat": center_lat, "lon": center_lon},
                "bounding_box": bbox,
                "area_km2": area_km2,
                "location_name": location_name,
                "address_components": address
            }
            
            return prompt, location_context, None
            
        except (ValueError, TypeError) as e:
            return None, None, {"error": f"Invalid coordinate values: {str(e)}", "status": 400}
            
    elif lat is not None and lon is not None:
        # Fall back to single-point format
        try:
            # Get location context
            r = requests.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"format": "json", "lat": lat, "lon": lon},
                headers={"User-Agent": "django-geocoder"}
            )
            r.raise_for_status()
            location_data = r.json()
            location_name = location_data.get("display_name", f"{lat}, {lon}")
            
            # Simple prompt for single point
            prompt = f"""You are a knowledgeable historian and geographer. I am viewing a specific location on Earth at coordinates {lat}, {lon} ({location_name}).

Please provide me with:

1. **Historical Events** (3-5 most significant events in this area)
2. **Notable Landmarks & Sites** (famous places, monuments, or natural features)
3. **Cultural & Social Significance** (important cultural aspects or figures)
4. **Interesting Facts** (unique features or lesser-known historical tidbits)

Please be specific about this location and include dates where relevant. Keep descriptions concise but informative."""

            location_context = {
                "center": {"lat": float(lat), "lon": float(lon)},
                "location_name": location_name
            }
            
            return prompt, location_context, None
            
        except requests.exceptions.RequestException as e:
            return None, None, {"error": f"Failed to get location context: {str(e)}", "status": 500}
        except (ValueError, TypeError) as e:
            return None, None, {"error": f"Invalid coordinate values: {str(e)}", "status": 400}
    else:
        return None, None, {
            "error": "Missing coordinates. Provide either 'lat' & 'lon' or all 8 corner coordinates (top_left_lat, top_left_lon, etc.)",
            "status": 400
        }

@api_view(["GET"])
def ask_gemini_about_region(request):
    """
    Generate historical information using Gemini AI based on viewport coordinates
    """
    # Configure Gemini API
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return Response({
            "error": "Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
        }, status=500)
    
    # Generate the prompt using our helper function
    prompt_text, location_context, error = _generate_prompt_data(request)
    
    if error:
        return Response(error, status=error.get('status', 500))
    
    if not prompt_text:
        return Response({"error": "Failed to generate prompt"}, status=500)
    
    try:
        genai.configure(api_key=api_key)
        
        # Try multiple model names in order of preference
        model_names = [
            'gemini-2.5-flash',
            'gemini-2.5-flash-latest',
            'gemini-2.5-pro-latest', 
            'gemini-1.5-pro',
            'gemini-pro',
            'models/gemini-pro'
        ]
        
        model = None
        model_used = None
        last_error = None
        
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                # Test the model with a simple prompt to verify it works
                test_response = model.generate_content("Hello")
                if test_response and test_response.text:
                    model_used = model_name
                    break
            except Exception as e:
                last_error = str(e)
                continue
        
        if not model or not model_used:
            # Try to list available models for debugging
            try:
                available_models = []
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        available_models.append(m.name)
                
                return Response({
                    "error": f"No working Gemini model found. Last error: {last_error}",
                    "available_models": available_models[:5],  # Show first 5 models
                    "original_prompt": prompt_text,
                    "location_context": location_context
                }, status=500)
            except Exception as list_error:
                return Response({
                    "error": f"Failed to find working Gemini model. Last error: {last_error}. List error: {str(list_error)}",
                    "original_prompt": prompt_text,
                    "location_context": location_context
                }, status=500)
        
        # Generate response with the working model
        response = model.generate_content(prompt_text)
        
        return Response({
            "historical_info": response.text,
            "location_context": location_context,
            "original_prompt": prompt_text,
            "model_used": model_used
        })
        
    except Exception as e:
        return Response({
            "error": f"Failed to get response from Gemini: {str(e)}",
            "original_prompt": prompt_text,
            "location_context": location_context
        }, status=500)

@api_view(["GET"])
def list_gemini_models(request):
    """
    List available Gemini models for debugging
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return Response({
            "error": "Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
        }, status=500)
    
    try:
        genai.configure(api_key=api_key)
        
        models = []
        for m in genai.list_models():
            models.append({
                "name": m.name,
                "display_name": getattr(m, 'display_name', 'N/A'),
                "supported_methods": m.supported_generation_methods
            })
        
        return Response({
            "available_models": models,
            "total_count": len(models)
        })
        
    except Exception as e:
        return Response({
            "error": f"Failed to list Gemini models: {str(e)}"
        }, status=500)