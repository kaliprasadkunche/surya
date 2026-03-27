# Lumina Photography Portfolio

An ultra-premium, cinematic photography portfolio with a secure admin dashboard.

## Features

- **Cinematic Hero**: Fullscreen slideshow with smooth transitions and floating previews.
- **Masonry Gallery**: Artistic layout for photos with category filtering.
- **Video Gallery**: Immersive video thumbnails with a built-in player.
- **Admin Dashboard**: Secure panel to upload/delete media directly to Cloudinary.
- **Dark Luxury Theme**: Minimalist design with glassmorphism and emerald accents.
- **Full-Stack**: Express.js backend with MongoDB and JWT authentication.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, JWT, Bcrypt.
- **Database**: MongoDB Atlas.
- **Storage**: Cloudinary.

## Setup Instructions

### 1. Prerequisites
- Node.js installed.
- MongoDB Atlas account and a cluster URI.
- Cloudinary account for media storage.

### 2. Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):

```env
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_random_secret_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### 3. Installation
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

## Deployment Guide

### Backend (Render/Railway)
1. Push your code to GitHub.
2. Create a new Web Service on Render.
3. Set the build command to `npm install`.
4. Set the start command to `npm run dev` (or `node server.ts` if you compile it).
5. Add all environment variables in the Render dashboard.

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel.
2. Vercel will automatically detect the Vite project.
3. Set the environment variables if needed (though the backend handles most).
4. Deploy!

## API Endpoints

- `POST /api/admin/login`: Authenticate admin.
- `GET /api/media`: Fetch all media (supports `type` and `category` filters).
- `POST /api/upload`: Upload new media (Admin only).
- `DELETE /api/media/:id`: Delete media (Admin only).
- `POST /api/contact`: Submit contact form.
