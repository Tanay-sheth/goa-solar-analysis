"""
🔌 SOLAR PANEL SIMULATOR - Client
==================================

This script runs on the "solar panel" computer and:
1. Simulates solar panel sensor data (or reads from real sensors)
2. Sends data in real-time to the DTaaS server via WebSocket
3. Receives optimal angle recommendations from server

USAGE:
    python solar_panel_client.py --server SERVER_IP
    
Example:
    python solar_panel_client.py --server 192.168.1.100
    python solar_panel_client.py --server localhost  # For testing on same machine
"""

import asyncio
import websockets
import json
import argparse
import random
import math
from datetime import datetime
import pandas as pd
import numpy as np

# ============== CONFIGURATION ==============
DEFAULT_SERVER = "localhost"
WEBSOCKET_PORT = 8765
SEND_INTERVAL = 5  # Send data every 5 seconds

# ============== SIMULATED SOLAR PANEL ==============
class SolarPanelSimulator:
    """
    Simulates a solar panel's sensor readings.
    In production, replace this with actual sensor readings.
    """
    
    def __init__(self, panel_id="Mess-A", latitude=15.4909):
        self.panel_id = panel_id
        self.latitude = latitude
        self.current_tilt = 15  # Current panel tilt angle
        self.current_azimuth = 180  # Facing south
        
        # Panel specifications (typical 10kW rooftop system)
        self.max_power = 10000  # 10 kW
        self.nominal_voltage = 400  # Volts
        self.efficiency = 0.20  # 20% efficiency
        
    def get_solar_intensity(self, hour):
        """Simulate solar intensity based on time of day"""
        # Simple bell curve peaking at noon
        if 6 <= hour <= 18:
            intensity = math.sin(math.pi * (hour - 6) / 12)
            # Add some random cloud cover effect
            cloud_factor = random.uniform(0.7, 1.0)
            return intensity * cloud_factor
        return 0
    
    def generate_reading(self):
        """Generate a simulated sensor reading"""
        now = datetime.now()
        hour = now.hour + now.minute / 60
        
        # Get solar intensity
        intensity = self.get_solar_intensity(hour)
        
        # Calculate power output (affected by intensity and some noise)
        if intensity > 0:
            base_power = self.max_power * intensity * self.efficiency
            # Add temperature effect (panels less efficient when hot)
            temp_effect = random.uniform(0.85, 1.0)
            # Add random noise
            noise = random.uniform(0.95, 1.05)
            power = base_power * temp_effect * noise
        else:
            power = 0
        
        # Calculate voltage and current
        voltage = self.nominal_voltage * (0.9 + random.uniform(0, 0.2)) if power > 0 else 0
        current = power / voltage if voltage > 0 else 0
        
        # Temperature simulation (higher during day)
        ambient_temp = 25 + 10 * intensity + random.uniform(-2, 2)
        panel_temp = ambient_temp + 15 * intensity  # Panels get hot
        
        return {
            'panel_id': self.panel_id,
            'timestamp': now.isoformat(),
            'power': round(power, 2),           # Watts
            'voltage': round(voltage, 2),       # Volts  
            'current': round(current, 3),       # Amps
            'ambient_temp': round(ambient_temp, 1),
            'panel_temp': round(panel_temp, 1),
            'current_tilt': self.current_tilt,
            'current_azimuth': self.current_azimuth,
            'solar_intensity': round(intensity, 3)
        }
    
    def update_tilt(self, new_tilt):
        """Update panel tilt (simulating actuator)"""
        self.current_tilt = new_tilt
        print(f"🔧 Panel tilt updated to {new_tilt}°")


class RealSolarPanelReader:
    """
    Template for reading from REAL sensors.
    Replace the methods with actual sensor communication.
    """
    
    def __init__(self, panel_id="Real-Panel"):
        self.panel_id = panel_id
        # Initialize your sensor connections here
        # e.g., serial port, Modbus, GPIO, etc.
        
    def generate_reading(self):
        """
        Read actual sensor data.
        TODO: Implement actual sensor reading logic
        """
        # Example structure - replace with real sensor reads
        return {
            'panel_id': self.panel_id,
            'timestamp': datetime.now().isoformat(),
            'power': self._read_power_sensor(),
            'voltage': self._read_voltage_sensor(),
            'current': self._read_current_sensor(),
            'ambient_temp': self._read_ambient_temp(),
            'panel_temp': self._read_panel_temp(),
            'current_tilt': self._read_tilt_sensor(),
            'current_azimuth': self._read_azimuth_sensor()
        }
    
    def _read_power_sensor(self):
        """Replace with actual power meter reading"""
        # Example: Read from Modbus register
        # return modbus_client.read_register(POWER_REGISTER)
        raise NotImplementedError("Implement real sensor reading")
    
    def _read_voltage_sensor(self):
        raise NotImplementedError("Implement real sensor reading")
    
    def _read_current_sensor(self):
        raise NotImplementedError("Implement real sensor reading")
    
    def _read_ambient_temp(self):
        raise NotImplementedError("Implement real sensor reading")
    
    def _read_panel_temp(self):
        raise NotImplementedError("Implement real sensor reading")
    
    def _read_tilt_sensor(self):
        raise NotImplementedError("Implement real sensor reading")
    
    def _read_azimuth_sensor(self):
        raise NotImplementedError("Implement real sensor reading")


# ============== WEBSOCKET CLIENT ==============
async def connect_and_stream(server_ip, panel, send_interval=5):
    """Connect to DTaaS server and stream data"""
    uri = f"ws://{server_ip}:{WEBSOCKET_PORT}"
    
    print(f"🔌 Connecting to DTaaS server at {uri}...")
    
    while True:  # Reconnect loop
        try:
            async with websockets.connect(uri) as websocket:
                print(f"✅ Connected to server!")
                
                # Wait for initial config from server
                config = await websocket.recv()
                config_data = json.loads(config)
                print(f"📋 Received config: {config_data.get('message', 'OK')}")
                
                if 'optimal_angles' in config_data:
                    angles = config_data['optimal_angles']
                    print(f"   Recommended tilt: {angles.get('recommended_fixed_tilt')}°")
                    panel.update_tilt(angles.get('recommended_fixed_tilt', 15))
                
                # Main data streaming loop
                while True:
                    # Generate/read sensor data
                    reading = panel.generate_reading()
                    
                    # Send to server
                    await websocket.send(json.dumps(reading))
                    print(f"📤 Sent: Power={reading['power']}W, Voltage={reading['voltage']}V")
                    
                    # Wait for response
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        response_data = json.loads(response)
                        
                        if response_data.get('type') == 'recommendation':
                            angles = response_data.get('optimal_angles', {})
                            if angles.get('recommended_fixed_tilt') != panel.current_tilt:
                                # Update tilt if recommendation changed
                                panel.update_tilt(angles.get('recommended_fixed_tilt'))
                                
                    except asyncio.TimeoutError:
                        pass  # No response within timeout, continue
                    
                    # Wait before next reading
                    await asyncio.sleep(send_interval)
                    
        except websockets.exceptions.ConnectionClosed:
            print("⚠️ Connection closed, reconnecting in 5 seconds...")
            await asyncio.sleep(5)
        except ConnectionRefusedError:
            print(f"❌ Cannot connect to {uri}, retrying in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"❌ Error: {e}, retrying in 5 seconds...")
            await asyncio.sleep(5)

# ============== MAIN ==============
def main():
    parser = argparse.ArgumentParser(description='Solar Panel Client - Connect to DTaaS Server')
    parser.add_argument('--server', type=str, default=DEFAULT_SERVER,
                        help=f'Server IP address (default: {DEFAULT_SERVER})')
    parser.add_argument('--panel-id', type=str, default='Mess-A',
                        help='Solar panel identifier (default: Mess-A)')
    parser.add_argument('--interval', type=int, default=SEND_INTERVAL,
                        help=f'Data send interval in seconds (default: {SEND_INTERVAL})')
    parser.add_argument('--simulate', action='store_true', default=True,
                        help='Use simulated data (default: True)')
    
    args = parser.parse_args()
    
    send_interval = args.interval
    
    print("=" * 60)
    print("🔌 SOLAR PANEL CLIENT")
    print("=" * 60)
    print(f"📍 Panel ID: {args.panel_id}")
    print(f"🖥️  Server: {args.server}:{WEBSOCKET_PORT}")
    print(f"⏱️  Send interval: {send_interval}s")
    print(f"📊 Mode: {'Simulation' if args.simulate else 'Real Sensors'}")
    print("=" * 60)
    
    # Create panel (simulated or real)
    if args.simulate:
        panel = SolarPanelSimulator(panel_id=args.panel_id)
    else:
        # TODO: Replace with RealSolarPanelReader when sensors are connected
        panel = SolarPanelSimulator(panel_id=args.panel_id)
        print("⚠️ Real sensor mode not implemented, using simulation")
    
    # Run the client
    try:
        asyncio.run(connect_and_stream(args.server, panel, send_interval))
    except KeyboardInterrupt:
        print("\n👋 Client stopped")

if __name__ == "__main__":
    main()
