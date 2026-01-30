"""
🖥️ DTaaS SERVER - Digital Twin as a Service
============================================

This server runs on the main computer and:
1. Receives real-time data from the solar panel simulator
2. Stores incoming data
3. Provides API for visualization dashboard
4. Calculates optimal angles and sends recommendations back

USAGE:
    python dtaas_server.py

The server will listen on:
    - WebSocket: ws://0.0.0.0:8765 (for real-time solar panel data)
    - HTTP API:  http://0.0.0.0:8080 (for dashboard/visualization)
"""

import asyncio
import json
import websockets
import pandas as pd
import numpy as np
from datetime import datetime
from aiohttp import web
import os
from collections import deque
from pvlib import solarposition

# ============== CONFIGURATION ==============
WEBSOCKET_PORT = 8765  # For real-time data from solar panel
HTTP_PORT = 8080       # For dashboard API

# Goa Location
LATITUDE = 15.4909
LONGITUDE = 73.8278
TIMEZONE = 'Asia/Kolkata'

# Data storage (in-memory for demo, use database for production)
received_data = deque(maxlen=10000)  # Keep last 10000 readings
connected_panels = set()  # Track connected solar panels

# ============== SOLAR ANGLE CALCULATOR ==============
def calculate_optimal_angle(timestamp=None):
    """Calculate optimal tilt angle for current time"""
    if timestamp is None:
        timestamp = pd.Timestamp.now(tz=TIMEZONE)
    else:
        timestamp = pd.Timestamp(timestamp, tz=TIMEZONE)
    
    # Get solar position
    solar_pos = solarposition.get_solarposition(
        time=pd.DatetimeIndex([timestamp]),
        latitude=LATITUDE,
        longitude=LONGITUDE
    )
    
    elevation = solar_pos['elevation'].values[0]
    azimuth = solar_pos['azimuth'].values[0]
    
    # Calculate optimal tilt based on month
    month = timestamp.month
    if month in [11, 12, 1, 2]:
        fixed_tilt = 30
        season = 'Winter'
    elif month in [5, 6, 7, 8]:
        fixed_tilt = 0
        season = 'Summer'
    else:
        fixed_tilt = 15
        season = 'Equinox'
    
    # Tracking tilt (to directly face sun)
    tracking_tilt = max(0, 90 - elevation) if elevation > 0 else None
    
    return {
        'timestamp': timestamp.isoformat(),
        'solar_elevation': float(round(elevation, 2)),
        'solar_azimuth': float(round(azimuth, 2)),
        'recommended_fixed_tilt': int(fixed_tilt),
        'recommended_tracking_tilt': float(round(tracking_tilt, 2)) if tracking_tilt else None,
        'optimal_azimuth': 180,  # South-facing for Northern Hemisphere
        'season': season,
        'is_daylight': bool(elevation > 0)
    }

# ============== WEBSOCKET HANDLER ==============
async def handle_solar_panel(websocket, path=None):
    """Handle incoming WebSocket connections from solar panels"""
    panel_id = f"Panel-{id(websocket)}"
    connected_panels.add(panel_id)
    print(f"🔌 {panel_id} connected from {websocket.remote_address}")
    
    try:
        # Send initial configuration to panel
        config = {
            'type': 'config',
            'panel_id': panel_id,
            'optimal_angles': calculate_optimal_angle(),
            'message': 'Connected to DTaaS Server'
        }
        await websocket.send(json.dumps(config))
        
        async for message in websocket:
            try:
                data = json.loads(message)
                data['received_at'] = datetime.now().isoformat()
                data['panel_id'] = panel_id
                
                # Store received data
                received_data.append(data)
                
                # Log received data
                print(f"📊 Data from {panel_id}: Power={data.get('power', 'N/A')}W, "
                      f"Voltage={data.get('voltage', 'N/A')}V, "
                      f"Current={data.get('current', 'N/A')}A")
                
                # Calculate and send back optimal angles
                response = {
                    'type': 'recommendation',
                    'optimal_angles': calculate_optimal_angle(),
                    'data_received': True
                }
                await websocket.send(json.dumps(response))
                
            except json.JSONDecodeError:
                print(f"⚠️ Invalid JSON from {panel_id}: {message}")
                
    except websockets.exceptions.ConnectionClosed:
        print(f"🔌 {panel_id} disconnected")
    finally:
        connected_panels.discard(panel_id)

# ============== HTTP API HANDLERS ==============
async def get_latest_data(request):
    """API: Get latest solar panel readings"""
    count = int(request.query.get('count', 100))
    data = list(received_data)[-count:]
    return web.json_response({
        'count': len(data),
        'data': data
    })

async def get_status(request):
    """API: Get server status"""
    return web.json_response({
        'status': 'online',
        'connected_panels': len(connected_panels),
        'panel_ids': list(connected_panels),
        'total_readings': len(received_data),
        'optimal_angles': calculate_optimal_angle()
    })

async def get_optimal_angles(request):
    """API: Get current optimal angles"""
    timestamp = request.query.get('timestamp', None)
    angles = calculate_optimal_angle(timestamp)
    return web.json_response(angles)

async def export_data(request):
    """API: Export data as CSV"""
    if not received_data:
        return web.json_response({'error': 'No data available'}, status=404)
    
    df = pd.DataFrame(list(received_data))
    csv_path = f"solar_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    df.to_csv(csv_path, index=False)
    
    return web.json_response({
        'message': 'Data exported',
        'file': csv_path,
        'records': len(df)
    })

async def index(request):
    """API: Home page with info"""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>DTaaS - Digital Twin Server</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: #eee; }
            .card { background: #16213e; padding: 20px; border-radius: 10px; margin: 10px 0; }
            h1 { color: #e94560; }
            .status { color: #4ecca3; font-weight: bold; }
            code { background: #0f3460; padding: 2px 8px; border-radius: 4px; }
            a { color: #4ecca3; }
        </style>
    </head>
    <body>
        <h1>🌞 DTaaS - Digital Twin as a Service</h1>
        
        <div class="card">
            <h2>Server Status: <span class="status">ONLINE</span></h2>
            <p>WebSocket: <code>ws://YOUR_IP:8765</code></p>
            <p>HTTP API: <code>http://YOUR_IP:8080</code></p>
        </div>
        
        <div class="card">
            <h2>API Endpoints</h2>
            <ul>
                <li><a href="/api/status">/api/status</a> - Server status & connected panels</li>
                <li><a href="/api/data">/api/data</a> - Latest solar readings</li>
                <li><a href="/api/angles">/api/angles</a> - Current optimal angles</li>
                <li><a href="/api/export">/api/export</a> - Export data to CSV</li>
            </ul>
        </div>
        
        <div class="card">
            <h2>Location</h2>
            <p>📍 Goa, India (15.4909°N, 73.8278°E)</p>
        </div>
    </body>
    </html>
    """
    return web.Response(text=html, content_type='text/html')

# ============== SERVER STARTUP ==============
async def start_http_server():
    """Start HTTP API server"""
    app = web.Application()
    app.router.add_get('/', index)
    app.router.add_get('/api/status', get_status)
    app.router.add_get('/api/data', get_latest_data)
    app.router.add_get('/api/angles', get_optimal_angles)
    app.router.add_get('/api/export', export_data)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', HTTP_PORT)
    await site.start()
    print(f"🌐 HTTP API running on http://0.0.0.0:{HTTP_PORT}")

async def start_websocket_server():
    """Start WebSocket server for real-time data"""
    server = await websockets.serve(handle_solar_panel, '0.0.0.0', WEBSOCKET_PORT)
    print(f"📡 WebSocket server running on ws://0.0.0.0:{WEBSOCKET_PORT}")
    return server

async def main():
    """Main entry point"""
    print("=" * 60)
    print("🖥️  DTaaS SERVER - Digital Twin as a Service")
    print("=" * 60)
    print(f"📍 Location: Goa, India ({LATITUDE}°N, {LONGITUDE}°E)")
    print("=" * 60)
    
    # Start both servers
    await start_http_server()
    ws_server = await start_websocket_server()
    
    print("\n✅ Server is ready!")
    print(f"   - Connect solar panels to: ws://YOUR_SERVER_IP:{WEBSOCKET_PORT}")
    print(f"   - View dashboard at: http://YOUR_SERVER_IP:{HTTP_PORT}")
    print("\nPress Ctrl+C to stop the server\n")
    
    # Keep running
    await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
