#!/bin/bash
# Netlify build: create config.js from env vars
echo "const SUPABASE_ANON_KEY = '$VITE_SUPABASE_ANON_KEY';" > config.js
echo "const SUPABASE_SERVICE_KEY = '$VITE_SUPABASE_SERVICE_KEY';" >> config.js
echo "const DEEPSEEK_API_KEY = '$VITE_DEEPSEEK_API_KEY';" >> config.js
echo "Config generated"
