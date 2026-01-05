import os
from pyngrok import ngrok, conf

# Optional: set your authtoken via env var NGROK_AUTHTOKEN for stable sessions
authtoken = os.environ.get("NGROK_AUTHTOKEN")
if authtoken:
    conf.get_default().auth_token = authtoken

# Open HTTP tunnel to local Flask server on port 5000
try:
    tunnel = ngrok.connect(5000, "http")
    print("Public URL:", tunnel.public_url)
    print("Send this link to anyone to access your app.")
    # Keep the tunnel alive until CTRL+C
    ngrok.blocking()
except Exception as e:
    print("Failed to start tunnel:", e)
