import json
import os
import time
import requests
from typing import List, Dict, Optional

# Try to load dotenv for .env file support
try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    # If python-dotenv is not installed, continue without it
    DOTENV_AVAILABLE = False


def ensure_env_file(script_dir: str) -> str:
    """
    Ensure .env file exists in the script directory. Create it if it doesn't exist or is empty.
    
    Args:
        script_dir: Directory where the script is located
        
    Returns:
        Path to the .env file
    """
    env_file = os.path.join(script_dir, ".env")
    
    # Check if .env file exists and has content
    if not os.path.exists(env_file) or os.path.getsize(env_file) == 0:
        # Create .env file with template
        env_template = """# Google Maps Places API (New) Key
# Get your API key from: https://console.cloud.google.com/
# Make sure to enable the Places API (New) in your Google Cloud project
# Enable: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
PLACES_API=your-api-key-here
"""
        try:
            with open(env_file, 'w', encoding='utf-8') as f:
                f.write(env_template)
            print(f"Created .env file at: {env_file}")
            print("Please edit the .env file and add your Google Maps API key.")
        except Exception as e:
            print(f"Warning: Could not create .env file: {e}")
    
    return env_file


def load_env_file(env_file: str) -> None:
    """
    Load environment variables from .env file.
    
    Args:
        env_file: Path to the .env file
    """
    if not os.path.exists(env_file):
        return
    
    if DOTENV_AVAILABLE:
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file)
            return
        except Exception as e:
            print(f"Warning: Error loading .env with dotenv: {e}")
    
    # Fallback: manual parsing if dotenv is not available
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                # Parse KEY=VALUE format
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key:
                        os.environ[key] = value
    except Exception as e:
        print(f"Warning: Error reading .env file manually: {e}")


def test_places_api(api_key: str) -> bool:
    """
    Test if the Places API (New) key is working correctly.
    
    Args:
        api_key: Google Maps Places API (New) key to test
        
    Returns:
        True if API key works, False otherwise
    """
    if not api_key:
        print("ERROR: No API key provided")
        return False
    
    # Use Places API (New) searchText endpoint
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location"
    }
    
    payload = {
        "textQuery": "charity organization"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        data = response.json()
        
        if response.status_code == 200 and "places" in data:
            print("✓ Places API (New) is working correctly!")
            return True
        elif response.status_code == 401 or response.status_code == 403:
            error_message = data.get("error", {}).get("message", "Authentication failed")
            print("✗ REQUEST_DENIED - API request was denied")
            print(f"  Error message: {error_message}")
            print("\n  Common causes:")
            print("  1. Places API (New) not enabled in Google Cloud Console")
            print("     → Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com")
            print("     → Click 'Enable'")
            print("  2. Billing not enabled on your Google Cloud project")
            print("     → Go to: https://console.cloud.google.com/billing")
            print("     → Link a billing account to your project")
            print("  3. API key restrictions are too strict")
            print("     → Go to: https://console.cloud.google.com/apis/credentials")
            print("     → Check 'API restrictions' - ensure 'Places API (New)' is allowed")
            print("     → Check 'Application restrictions' - for testing, temporarily remove restrictions")
            print("  4. Invalid API key")
            print("     → Verify the key in your .env file matches the one in Google Cloud Console")
            return False
        elif response.status_code == 400:
            error_message = data.get("error", {}).get("message", "Invalid request")
            print(f"✗ INVALID_REQUEST: {error_message}")
            return False
        elif response.status_code == 429:
            print("✗ OVER_QUERY_LIMIT - API quota exceeded")
            print("  → Check your billing and quota limits in Google Cloud Console")
            return False
        else:
            error_message = data.get("error", {}).get("message", f"HTTP {response.status_code}")
            print(f"✗ API returned error: {error_message}")
            print(f"  Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Error testing API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                print(f"  Response: {error_data}")
            except:
                print(f"  Response text: {e.response.text}")
        return False


def get_charity_location(charity_name: str, api_key: str, debug: bool = False) -> Optional[Dict]:
    """
    Find the location of a charity using Google Maps Places API (New) searchText.
    
    Args:
        charity_name: Name of the charity to search for
        api_key: Google Maps Places API (New) key
        debug: If True, print detailed debugging information
        
    Returns:
        Dictionary with location information (lat, lng, address, place_id) or None if not found
    """
    if not api_key:
        print(f"Warning: No API key provided for {charity_name}")
        return None
    
    # Use Places API (New) searchText endpoint
    url = "https://places.googleapis.com/v1/places:searchText"
    
    # Enhance query with "charity" or "organization" for better results
    clean_name = charity_name.strip()
    if not any(keyword in clean_name.lower() for keyword in ['charity', 'foundation', 'association', 'organization', 'ngo']):
        query = f"{clean_name} charity organization"
    else:
        query = clean_name
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types"
    }
    
    payload = {
        "textQuery": query
    }
    
    if debug:
        print(f"  Debug: Query = '{query}'")
        print(f"  Debug: URL = {url}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if response.status_code == 200 and "places" in data:
            places = data.get("places", [])
            if places and len(places) > 0:
                # Get the first result
                place = places[0]
                location = place.get("location", {})
                
                if debug:
                    print(f"  Debug: Found {len(places)} results")
                
                return {
                    "latitude": location.get("latitude"),
                    "longitude": location.get("longitude"),
                    "address": place.get("formattedAddress", ""),
                    "place_id": place.get("id", ""),
                    "name": place.get("displayName", {}).get("text", charity_name) if isinstance(place.get("displayName"), dict) else place.get("displayName", charity_name),
                    "types": place.get("types", [])
                }
            else:
                if debug:
                    print(f"  Debug: No results found for query '{query}'")
                return None
        elif response.status_code == 401 or response.status_code == 403:
            error_data = data.get("error", {})
            error_message = error_data.get("message", "Request denied")
            print(f"✗ Request denied for {charity_name}")
            print(f"  Error: {error_message}")
            if not hasattr(get_charity_location, '_denied_shown'):
                print("\n  Troubleshooting REQUEST_DENIED:")
                print("  1. Enable Places API (New): https://console.cloud.google.com/apis/library/places-backend.googleapis.com")
                print("  2. Enable billing: https://console.cloud.google.com/billing")
                print("  3. Check API key restrictions: https://console.cloud.google.com/apis/credentials")
                print("     → Ensure 'Places API (New)' is in API restrictions")
                get_charity_location._denied_shown = True
            return None
        elif response.status_code == 400:
            error_data = data.get("error", {})
            error_message = error_data.get("message", "Invalid request")
            print(f"✗ Invalid request for {charity_name}")
            print(f"  Error: {error_message}")
            return None
        elif response.status_code == 429:
            print(f"⚠ API quota exceeded for {charity_name}")
            return None
        else:
            error_data = data.get("error", {})
            error_message = error_data.get("message", f"HTTP {response.status_code}")
            print(f"✗ Could not find location for {charity_name}: {error_message}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Network error for {charity_name}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                print(f"  Response: {error_data}")
            except:
                pass
        return None
    except Exception as e:
        print(f"✗ Unexpected error for {charity_name}: {e}")
        return None


def clean_json_file(json_file_path: str, api_key: Optional[str] = None, output_file: Optional[str] = None) -> List[Dict]:
    """
    Clean the JSON file by extracting charity name, money collected, goal, and location.
    
    Args:
        json_file_path: Path to the input JSON file
        api_key: Google Maps Places API key (can also be set via PLACES_API env variable or .env file)
        output_file: Optional path to save cleaned data as JSON. If None, saves as 'cleaned_data.json' in same folder.
        
    Returns:
        List of dictionaries with cleaned data
    """
    # Get API key from parameter, .env file, or environment variable
    if not api_key:
        # Try to load from .env file in the same directory as the script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        env_file = ensure_env_file(script_dir)
        load_env_file(env_file)
        
        api_key = os.getenv("PLACES_API")
    
    # Read the JSON file
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {json_file_path} not found")
        return []
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {json_file_path}: {e}")
        return []
    
    cleaned_data = []
    
    print(f"Processing {len(data)} entries...")
    
    for idx, entry in enumerate(data, 1):
        try:
            # Parse the progressText JSON string
            progress_text = entry.get("progressText", "{}")
            if isinstance(progress_text, str):
                progress_data = json.loads(progress_text)
            else:
                progress_data = progress_text
            
            # Navigate through the nested structure
            campaign_data = progress_data.get("props", {}).get("pageProps", {}).get("data", {})
            
            # Extract charity name
            charity_partners = campaign_data.get("charity_partners", [])
            charity_name = None
            if charity_partners and len(charity_partners) > 0:
                charity_name = charity_partners[0].get("charity_partner", {}).get("title", None)
            
            # Extract money collected and goal
            money_collected = campaign_data.get("raised", 0)
            goal = campaign_data.get("funding_goal", 0)
            
            # Get location using Google Maps Places API
            location_info = None
            if charity_name and api_key:
                print(f"[{idx}/{len(data)}] Finding location for: {charity_name}")
                location_info = get_charity_location(charity_name, api_key)
                # Add a small delay to respect API rate limits
                time.sleep(0.1)
            elif charity_name:
                print(f"[{idx}/{len(data)}] Skipping location lookup for {charity_name} (no API key)")
            
            # Create cleaned entry
            cleaned_entry = {
                "charity_name": charity_name,
                "money_collected": money_collected,
                "goal": goal,
                "campaign_title": campaign_data.get("title", ""),
                "url": entry.get("url", ""),
                "location": location_info
            }
            
            cleaned_data.append(cleaned_entry)
            
        except json.JSONDecodeError as e:
            print(f"Error parsing progressText for entry {idx}: {e}")
            continue
        except Exception as e:
            print(f"Error processing entry {idx}: {e}")
            continue
    
    # Save cleaned data
    if output_file is None:
        # Save in same folder as input file
        base_dir = os.path.dirname(json_file_path)
        output_file = os.path.join(base_dir, "cleaned_data.json")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
        print(f"\nCleaned data saved to: {output_file}")
    except Exception as e:
        print(f"Error saving cleaned data: {e}")
    
    # Also save as CSV for easier viewing
    try:
        import csv
        csv_file = output_file.replace('.json', '.csv')
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            if cleaned_data:
                writer = csv.DictWriter(f, fieldnames=["charity_name", "money_collected", "goal", "campaign_title", "url", 
                                                       "latitude", "longitude", "address"])
                writer.writeheader()
                for entry in cleaned_data:
                    row = {
                        "charity_name": entry.get("charity_name", ""),
                        "money_collected": entry.get("money_collected", 0),
                        "goal": entry.get("goal", 0),
                        "campaign_title": entry.get("campaign_title", ""),
                        "url": entry.get("url", ""),
                        "latitude": entry.get("location", {}).get("latitude", "") if entry.get("location") else "",
                        "longitude": entry.get("location", {}).get("longitude", "") if entry.get("location") else "",
                        "address": entry.get("location", {}).get("address", "") if entry.get("location") else ""
                    }
                    writer.writerow(row)
        print(f"CSV file saved to: {csv_file}")
    except Exception as e:
        print(f"Error saving CSV file: {e}")
    
    print(f"\nSuccessfully processed {len(cleaned_data)} entries")
    return cleaned_data


if __name__ == "__main__":
    # Example usage
    import sys
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Ensure .env file exists and load it
    env_file = ensure_env_file(script_dir)
    load_env_file(env_file)
    
    # Get API key from .env file, environment variable, or command line argument
    api_key = os.getenv("PLACES_API")
    
    # Check for test flag
    if len(sys.argv) > 1 and sys.argv[1] in ['--test', '-t', 'test']:
        # Test mode - just test the API key
        if not api_key and len(sys.argv) > 2:
            api_key = sys.argv[2]
        
        if not api_key:
            print("Error: No API key found.")
            print("Set PLACES_API in .env file or pass it as an argument:")
            print("  python data_clean.py --test YOUR_API_KEY")
            sys.exit(1)
        
        print("Testing Google Maps Places API...")
        print(f"API Key: {api_key[:10]}...{api_key[-4:] if len(api_key) > 14 else '***'}\n")
        success = test_places_api(api_key)
        sys.exit(0 if success else 1)
    
    # Normal mode - process the JSON file
    json_file = os.path.join(script_dir, "dataset_web-scraper_2025-12-06_11-39-29-684.json")
    
    # Check if file exists
    if not os.path.exists(json_file):
        print(f"Error: JSON file not found at {json_file}")
        print("Please provide the correct path to the JSON file.")
        sys.exit(1)
    
    # Get API key from command line if provided
    if len(sys.argv) > 1:
        api_key = sys.argv[1]
    
    if not api_key:
        print("Warning: No Google Maps Places API key provided.")
        print("Please set PLACES_API in the .env file, environment variable, or pass it as an argument.")
        print("Location lookup will be skipped.")
        print("\nContinuing without location data...\n")
    else:
        # Test the API key before processing
        print("Testing Places API connection...")
        if not test_places_api(api_key):
            print("\n⚠ WARNING: API key test failed. Location lookups may not work.")
            try:
                response = input("\nContinue anyway? (y/n): ").strip().lower()
                if response != 'y':
                    print("Exiting...")
                    sys.exit(1)
            except (EOFError, KeyboardInterrupt):
                print("\nExiting...")
                sys.exit(1)
        print()
    
    # Clean the data
    cleaned = clean_json_file(json_file, api_key=api_key)
    
    print(f"\nProcessing complete! Found {len(cleaned)} entries.")

