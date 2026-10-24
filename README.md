# Global Lead CRM - Frontend 🚀

Production-grade, modern React + Vite + Tailwind CSS frontend for **Global Lead CRM**.

## 🌟 Features
- **Lead Finder (Phase 2):** GeoGrid polygon-based search, multi-provider failover monitoring, live key exhaustion status banner, automated checkpoint pause/resume.
- **Lead Management (Phase 3):** Searchable table, status pipeline transitions, 1-click `tel:` direct dialing, 1-click `wa.me` WhatsApp links with pre-formatted pitch, Excel (`.xlsx`) export.
- **Lead Detail & Activity:** Timeline feed, rich notes with `@mentions`, call logging with outcomes and duration tracker.
- **Real-Time Collaboration:** Socket.IO team chat (`/chat`), live presence indicators, channel routing.
- **Admin Console (Phase 1):**
  - **Integrations:** API Key management with AES-256-GCM encryption status and real-time connectivity testing.
  - **Runtime Config:** Dynamic environment variable importer and classifier.
  - **Live Server Logs:** Real-time stream from server via Socket.IO `/logs`.
  - **Audit Logs:** Tamper-evident admin action auditing.
  - **User & Access Management:** RBAC (`SUPER_ADMIN`, `ADMIN`, `OPERATOR`, `AGENT`).

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup (Optional)
If backend is running on a different domain or server:
```bash
cp .env.example .env
```
Set `VITE_API_URL` to your backend URL (e.g. `http://<aws-ip>:4000` or `https://api.yourdomain.com`).
If deployed behind Nginx reverse-proxy on AWS, leave `VITE_API_URL` empty.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 4. Build for Production
```bash
npm run build
```
The compiled static assets will be output in the `dist/` directory.

---

## ☁️ Deploying to AWS Lightsail (Ubuntu + Nginx)

1. Build production files:
   ```bash
   npm run build
   ```
2. Copy `dist/` folder to `/var/www/global-crm/dist` on your Ubuntu server.
3. Configure Nginx (`/etc/nginx/sites-available/global-crm`):
   ```nginx
   server {
       listen 80;
       server_name your-domain-or-ip;

       # Frontend static files
       location / {
           root /var/www/global-crm/dist;
           index index.html index.htm;
           try_files $uri $uri/ /index.html;
       }

       # Backend API proxy
       location /api/ {
           proxy_pass http://127.0.0.1:4000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Socket.IO WebSocket proxy
       location /socket.io/ {
           proxy_pass http://127.0.0.1:4000/socket.io/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```
4. Test and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
