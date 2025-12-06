import csv
import os


def extract_urls_from_csv(csv_file_path: str, output_file: str = None) -> None:
    """
    Extract the 'url' column from a CSV file and write filtered URLs to a text file.
    Only URLs containing 'projects', 'missions', or 'campaigns' are kept.
    
    Args:
        csv_file_path: Path to the input CSV file
        output_file: Optional path to the output text file. If None, saves as 'urls.txt' in same folder.
    """
    if not os.path.exists(csv_file_path):
        print(f"Error: CSV file not found at {csv_file_path}")
        return
    
    # Set default output file if not provided
    if output_file is None:
        base_dir = os.path.dirname(csv_file_path)
        output_file = os.path.join(base_dir, "urls.txt")
    
    urls = []
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            # Check if 'url' column exists
            if 'url' not in reader.fieldnames:
                print(f"Error: 'url' column not found in CSV file.")
                print(f"Available columns: {', '.join(reader.fieldnames)}")
                return
            
            # Extract URLs that contain 'projects', 'missions', or 'campaigns'
            keywords = ['projects', 'missions', 'campaigns']
            for row in reader:
                url = row.get('url', '').strip()
                if url:  # Only process non-empty URLs
                    # Check if URL contains any of the keywords (case-insensitive)
                    url_lower = url.lower()
                    if any(keyword in url_lower for keyword in keywords):
                        urls.append(url)
        
        # Write URLs to text file
        with open(output_file, 'w', encoding='utf-8') as f:
            for url in urls:
                f.write(url + '\n')
        
        print(f"Successfully extracted {len(urls)} URLs to: {output_file}")
        
    except Exception as e:
        print(f"Error processing CSV file: {e}")


if __name__ == "__main__":
    # Get the CSV file path (default to the file in the same folder)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(script_dir, "dataset_web-scraper_2025-12-06_11-50-07-252.csv")
    
    # Extract URLs
    extract_urls_from_csv(csv_file)

