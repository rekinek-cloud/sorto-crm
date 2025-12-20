# 🌐 CRM-GTD Network Access Guide

## Quick Access URLs

### From This Computer (localhost):
- **Frontend App**: http://localhost:9025
- **Backend API**: http://localhost:9028

### From Other Devices in Network:
- **Frontend App**: http://192.168.1.17:9025
- **Backend API**: http://192.168.1.17:9028

## Login Credentials
- **Email**: demo@example.com
- **Password**: demo123

## How to Access from Mobile/Tablet

1. **Connect to Same Network**
   - Ensure your device is on the same Wi-Fi/LAN network
   - The computer running the app must be on and connected

2. **Open Browser**
   - Use any modern browser (Chrome, Safari, Firefox)
   - Navigate to: http://192.168.1.17:9025

3. **Login**
   - Use the demo credentials above
   - The app is fully responsive for mobile devices

## Troubleshooting

### Cannot Connect?
1. **Check if services are running**:
   ```bash
   netstat -tuln | grep -E "(9025|9028)"
   ```

2. **Verify your IP address**:
   ```bash
   ip addr | grep "192.168"
   ```

3. **Restart services**:
   ```bash
   cd /home/wasz67/projects/crm-gtd-smart
   npm run dev
   ```

### Firewall Issues
If using a firewall, allow ports 9025 and 9028:
```bash
sudo ufw allow 9025
sudo ufw allow 9028
```

## Alternative Access Methods

### Using ngrok (Public Internet Access)
```bash
# Install ngrok
npm install -g ngrok

# Expose frontend
ngrok http 9025
```

### Using local network hostname
Try accessing via: http://YOUR_COMPUTER_NAME:9025

## Security Note
⚠️ The app is currently in development mode. For production:
- Use HTTPS certificates
- Implement proper authentication
- Configure firewall rules
- Use environment-specific configurations