# Area - Community Safety Reporting Platform 🗺️

A modern web application that enables residents to report and share suspicious, dangerous, disruptive, or criminal activities to warn others in their community.

## 🚀 Live Demo

🌐 **Website**: [https://app.thesafetymap.eu](https://app.thesafetymap.eu)

## 📋 About Area

Area is built with a Waze-inspired interface and features:

- **Interactive map** with real-time incident reports
- **Filterable list view** of recent reports
- **Location-based** reporting with GPS integration
- **Categorization system** for different types of incidents
- **Mobile-first** responsive design for on-the-go use
- **Secure image uploads** with automatic compression

## 🛠️ Technology Stack

### Frontend
- **React** with TypeScript
- **Vite** as build tool
- **Wouter** for routing
- **TanStack Query** for state management
- **Tailwind CSS** for styling
- **Radix UI & shadcn/ui** components
- **React Leaflet** for map functionality

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** database via Drizzle ORM
- **Multer** for file uploads
- **RESTful API** endpoints

## 🚦 Features

- ✅ **Incident Reporting**: Easy report creation with location and description
- ✅ **Interactive Map**: Real-time display of incidents on map
- ✅ **Categories**: Personal Harassment, Suspicious Activity, Public Space Degradation, etc.
- ✅ **Geolocation**: Automatic location detection or manual map selection
- ✅ **Image Upload**: Add photos to reports with compression
- ✅ **Filtering**: Filter reports by category and type
- ✅ **Mobile Optimized**: Fully responsive for mobile devices
- ✅ **Dark/Light Mode**: Theme support

## 🏃‍♂️ Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd area-safety-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open browser**
```
http://localhost:5000
```

### Available Scripts

```bash
# Start development server
npm run dev

# Production build
npm run build

# Push database schema
npm run db:push

# Force database schema (with data loss warning)
npm run db:push --force
```

## 📊 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # App pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── ...
├── server/                 # Backend Express server
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage interface
│   └── ...
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle database schema
└── ...
```

## 🗺️ API Endpoints

### Reports
- `GET /api/reports` - Fetch all reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Fetch specific report

### Upload
- `POST /api/upload` - Upload image

## 🎨 UI/UX Features

- **Glassmorphism Design**: Modern glass effects and blur backgrounds
- **Smooth Animations**: Hover effects and transition animations  
- **Card-based Layout**: Modern card design for report display
- **Bottom Sheet**: Mobile-friendly bottom sheet for report details
- **Interactive Controls**: Floating menus and map controls
- **Safe Area Support**: iOS safe area insets for modern phones

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL=your_postgres_connection_string
PORT=5000
```

### Database Setup
The project uses PostgreSQL with Drizzle ORM. Schema changes can be pushed with:
```bash
npm run db:push
```

## 📱 Mobile Features

- **GPS Integration**: Automatic location detection
- **Touch Optimized**: Optimized for touch interfaces  
- **Offline Support**: Basic offline functionality
- **PWA Ready**: Progressive Web App capabilities

## 🤝 Community & Support

💬 **Discord Community**: [https://discord.gg/bWzFtgQu](https://discord.gg/bWzFtgQu)

For questions, feedback, or technical support, join our Discord server. Here you can:
- Ask technical questions
- Submit feature requests
- Share bug reports
- Be part of the community
- Receive updates and announcements

## 📈 Roadmap

- [ ] **Real-time Updates**: WebSocket integration for live updates
- [ ] **Push Notifications**: Alerts for new incidents in your area
- [ ] **Advanced Filtering**: More sophisticated filter options
- [ ] **User Accounts**: User accounts and profile management
- [ ] **Analytics Dashboard**: Admin dashboard with statistics
- [ ] **Mobile App**: Native mobile application

## 🐛 Bug Reports & Feature Requests

Use our Discord server or create an issue in the repository for:
- Bug reports with detailed descriptions
- Feature requests with use case explanations
- User experience feedback

## 📄 License

This project is under a proprietary license. Contact us via Discord for more information.

---

**Built with ❤️ for safer communities**

*For the latest updates and community discussions, join our [Discord](https://discord.gg/bWzFtgQu)!*