"""
Supabase Client Initializer — LegalOS Backend
"""
import logging
from supabase import create_client, Client
from src.config import settings

logger = logging.getLogger(__name__)

# Fallback values from env if settings are empty
supabase_url = settings.supabase_url or "https://your-project.supabase.co"
supabase_key = settings.supabase_anon_key or "your-anon-key"

# If settings are empty, we will try to look for NEXT_PUBLIC prefixes or use mock/development fallbacks
if not settings.supabase_url:
    import os
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or supabase_url
if not settings.supabase_anon_key:
    import os
    supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY") or supabase_key

# Check if keys are placeholders
is_mock = "your-project" in supabase_url or "your-anon-key" in supabase_key or not supabase_url or not supabase_key

supabase_client: Client | None = None
if is_mock:
    logger.warning("⚠️ Using mock Supabase Client (env keys not set or placeholder)")
else:
    try:
        supabase_client = create_client(supabase_url, supabase_key)
        logger.info(f"Connected to Supabase at {supabase_url}")
    except Exception as e:
        logger.error(f'Database operation failed: {e}')
        logger.error(f"❌ Failed to initialize Supabase client: {e}")


def get_db():
    """Returns the supabase client instance."""
    return supabase_client
