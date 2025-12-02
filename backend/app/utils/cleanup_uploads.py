from supabase import create_client
import os

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

# Delete uploaded CSV batches, keep only generated demo data
result = supabase.table('work_orders').delete().neq('uploaded_csv_batch', None).eq('demo_mode', True).execute()
print(f"Deleted {len(result.data)} uploaded records")
