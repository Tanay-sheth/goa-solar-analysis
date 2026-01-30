# 🌞 Digital Twin Real-Time Server Setup

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIGITAL TWIN ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   COMPUTER 1 (Server)              COMPUTER 2 (Solar Panel)    │
│   ─────────────────────            ────────────────────────    │
│                                                                 │
│   ┌─────────────────┐              ┌─────────────────────┐     │
│   │  DTaaS Server   │◄────────────►│  Panel Client       │     │
│   │  (dtaas_server  │   WebSocket  │  (solar_panel_      │     │
│   │   .py)          │   Real-time  │   client.py)        │     │
│   └────────┬────────┘   Connection └─────────────────────┘     │
│            │                              ▲                     │
│            │                              │                     │
│            ▼                              │                     │
│   ┌─────────────────┐              ┌──────┴──────────────┐     │
│   │  Dashboard      │              │  Solar Panel        │     │
│   │  (React App)    │              │  Sensors            │     │
│   │  Port: 5173     │              │  (Real or Simulated)│     │
│   └─────────────────┘              └─────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### On SERVER Computer (DTaaS):

```bash
# Navigate to project
cd /path/to/goa-solar-analysis

# Activate virtual environment
source .venv/bin/activate

# Run the server
python server/dtaas_server.py
```

Server will display:
- WebSocket: `ws://0.0.0.0:8765`
- HTTP API: `http://0.0.0.0:8080`

### On CLIENT Computer (Solar Panel):

```bash
# Copy these files to the client computer:
# - server/solar_panel_client.py
# - requirements.txt

# Install dependencies
pip install websockets pandas numpy pvlib

# Run client (replace SERVER_IP with actual IP)
python solar_panel_client.py --server 192.168.1.100 --panel-id Mess-A
```

## Finding Your Server IP

On the server computer:
```bash
# Linux/Mac
hostname -I

# Or
ip addr show | grep inet

# Windows
ipconfig
```

## Firewall Configuration

If connection fails, open ports:

```bash
# Linux (Ubuntu/Debian)
sudo ufw allow 8765/tcp  # WebSocket
sudo ufw allow 8080/tcp  # HTTP API

# Windows (PowerShell as Admin)
netsh advfirewall firewall add rule name="DTaaS WebSocket" dir=in action=allow protocol=tcp localport=8765
netsh advfirewall firewall add rule name="DTaaS HTTP" dir=in action=allow protocol=tcp localport=8080
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard HTML page |
| `/api/status` | GET | Server status & connected panels |
| `/api/data` | GET | Latest solar readings |
| `/api/data?count=50` | GET | Get last 50 readings |
| `/api/angles` | GET | Current optimal angles |
| `/api/export` | GET | Export data to CSV |

## Data Format

### Panel → Server (every 5 seconds)
```json
{
    "panel_id": "Mess-A",
    "timestamp": "2024-01-15T12:30:00",
    "power": 4523.45,
    "voltage": 380.2,
    "current": 11.9,
    "ambient_temp": 32.5,
    "panel_temp": 45.2,
    "current_tilt": 15,
    "current_azimuth": 180
}
```

### Server → Panel (recommendations)
```json
{
    "type": "recommendation",
    "optimal_angles": {
        "solar_elevation": 65.3,
        "solar_azimuth": 185.2,
        "recommended_fixed_tilt": 15,
        "recommended_tracking_tilt": 24.7,
        "optimal_azimuth": 180,
        "season": "Equinox"
    }
}
```

## Testing on Same Computer

You can test both server and client on the same computer:

**Terminal 1 (Server):**
```bash
python server/dtaas_server.py
```

**Terminal 2 (Client):**
```bash
python server/solar_panel_client.py --server localhost --panel-id Test-Panel
```

## Connecting Real Sensors

Edit `solar_panel_client.py` and implement `RealSolarPanelReader` class methods:
- `_read_power_sensor()` - Read from your power meter
- `_read_voltage_sensor()` - Read voltage
- `_read_current_sensor()` - Read current
- etc.

Common interfaces:
- **Modbus RTU/TCP** - Most industrial sensors
- **Serial (RS485)** - Older sensors
- **GPIO** - Raspberry Pi direct connection
- **HTTP API** - Smart inverters

## Production Deployment (Docker)

For DTaaS with Docker (as your prof mentioned):

```yaml
# docker-compose.yml
version: '3.8'
services:
  dtaas-server:
    build: .
    ports:
      - "8765:8765"
      - "8080:8080"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check server IP, firewall, server running |
| No data received | Check panel client is running |
| Websocket timeout | Network latency, reduce send interval |
| Permission denied | Run with sudo or check port access |
