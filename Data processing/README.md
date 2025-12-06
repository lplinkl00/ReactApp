# Data Cleaning Script

This script cleans JSON data from web scraping, extracts charity information, and geocodes charity locations using Google Maps Places API (New).

## Setup

1. **Install required packages:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up your Google Maps Places API (New) key:**
   - Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the **Places API (New)** in your Google Cloud project:
     - Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
     - Click "Enable"
   - Ensure billing is enabled on your project
   - Open the `.env` file in this directory
   - Replace `your-api-key-here` with your actual API key:
     ```
     PLACES_API=your-actual-api-key-here
     ```

3. **Test your API key:**
   ```bash
   python data_clean.py --test
   ```

## Usage

Run the script:
```bash
python data_clean.py
```

The script will:
1. Read the JSON file (`dataset_web-scraper_2025-12-06_11-39-29-684.json`)
2. Extract charity names, money collected, and goals
3. Look up locations for each charity using Google Maps Places API
4. Save cleaned data as:
   - `cleaned_data.json` (full data with location info)
   - `cleaned_data.csv` (spreadsheet-friendly format)

## Output

The cleaned data includes:
- `charity_name`: Name of the charity organization
- `money_collected`: Amount raised (in the original currency)
- `goal`: Fundraising goal (in the original currency)
- `campaign_title`: Title of the campaign
- `url`: Campaign URL
- `location`: Location information (latitude, longitude, address, place_id)

## Notes

- If the `.env` file doesn't exist, it will be created automatically with a template
- If no API key is provided, the script will still run but skip location lookups
- The script includes rate limiting to respect API limits
- This script uses **Places API (New)** which requires:
  - Places API (New) to be enabled (not the legacy Places API)
  - Billing account linked to your Google Cloud project
  - API key with proper restrictions configured

