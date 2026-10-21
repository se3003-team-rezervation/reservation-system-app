# 🍽️ DormDine – Cafeteria Reservation System

> Skip the queue. Reserve your seat. Walk in with a QR code.

DormDine is a full-stack web application that allows university dormitory students to pre-book cafeteria time slots, receive a unique QR code, and check in seamlessly. Cafeteria staff can monitor slot occupancy in real time and scan/validate QR codes at the entrance.

---

## ✨ Features

### Student Flow
- Select a meal (Breakfast / Lunch / Dinner)
- Choose an available time slot with live occupancy indicators
- Receive a unique reservation ID and scannable **QR Code**
- View and manage reservations from the "My Reservations" tab

### Staff Panel (`/staff`)
- Real-time slot occupancy dashboard with color-coded progress bars
- QR code scanning via device camera
- Manual check-in by entering reservation ID
- Reservation list with one-click check-in buttons

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| QR Generation | `qrcode.react` |
| QR Scanning | `html5-qrcode` |
| Data | In-memory mock store + `localStorage` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/se3003-team-rezervation/reservation-system-app.git
cd reservation-system-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
reservation-system-app/
├── app/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Student home (meal selection)
│   ├── reserve/page.tsx         # Time slot selection + QR confirmation
│   ├── my-reservations/page.tsx # Student reservation history
│   ├── staff/page.tsx           # Staff panel
│   └── api/
│       ├── slots/route.ts       # GET /api/slots
│       ├── reservations/route.ts         # GET + POST /api/reservations
│       └── reservations/[id]/route.ts   # GET + PATCH /api/reservations/:id
├── components/
│   ├── Navbar.tsx
│   ├── MealCard.tsx
│   ├── SlotCard.tsx
│   ├── QRDisplay.tsx
│   ├── QRScanner.tsx
│   └── SlotOccupancyBar.tsx
└── lib/
    ├── types.ts        # Shared TypeScript interfaces
    └── mockStore.ts    # In-memory data store
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/slots?meal=lunch` | List time slots, optionally filtered by meal |
| `GET` | `/api/reservations` | List all reservations |
| `POST` | `/api/reservations` | Create a new reservation |
| `GET` | `/api/reservations/:id` | Get a single reservation |
| `PATCH` | `/api/reservations/:id` | Check in a student |

---

## 👥 Team

SE3003 – Software Project Management  
Group project – Cafeteria Reservation System

---

## 📄 License

This project is developed for educational purposes as part of the SE3003 course.
