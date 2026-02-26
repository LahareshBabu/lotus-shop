import pandas as pd
from supabase import create_client, Client
import os

# Initialize Supabase connection
SUPABASE_URL = "https://fwyliqsazdyprlkemavu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def migrate_data():
    print("Starting the data migration process...")
    
    file_path = "interactions.csv"
    if not os.path.exists(file_path):
        print("Error: CSV file not found.")
        return

    # Read the historical data
    df = pd.read_csv(file_path)
    total_rows = len(df)
    print(f"Found {total_rows} rows in the local CSV file.")

    # Convert the dataframe to a list of dictionaries for Supabase
    records = df.to_dict(orient='records')

    # Send the data in batches of 500 to avoid timeouts
    batch_size = 500
    
    for i in range(0, total_rows, batch_size):
        batch = records[i:i+batch_size]
        try:
            supabase.table('interactions').insert(batch).execute()
            print(f"Successfully migrated rows {i} to {i + len(batch)}.")
        except Exception as e:
            print(f"Error encountered on batch {i}: {e}")
            break
            
    print("Migration complete. All historical data is now in Supabase.")

if __name__ == "__main__":
    migrate_data()