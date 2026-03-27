import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Firebase Admin Config
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const adminApp = admin.apps[0]!;

// Use the named database if provided, otherwise default
// CRITICAL: Ensure we use the correct database ID from the config
const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)');

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      // Server-side admin doesn't have a 'currentUser' in the same way as client SDK
      // but we can log that it's a server-side operation
      type: 'server-admin',
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video');
    return {
      folder: 'photography-portfolio',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo ? ['mp4', 'mov'] : ['jpg', 'png', 'webp'],
    };
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // MongoDB Connection removed
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

  // Middleware: Auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    // Special case for Google Auth session initiated on client
    if (token === 'google-auth-session') {
      req.user = { username: 'Admin (Google)' };
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Error handling middleware
  const errorHandler = (err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err);
    let errorResponse;
    try {
      errorResponse = JSON.parse(err.message);
    } catch (e) {
      errorResponse = { error: err.message || 'Internal Server Error' };
    }
    res.status(500).json(errorResponse);
  };

  // Admin Login
  app.post('/api/admin/login', async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

      if (username === adminUser && password === adminPass) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { username } });
      }

      res.status(401).json({ message: 'Invalid credentials' });
    } catch (err) {
      next(err);
    }
  });

  // Get Media
  app.get('/api/media', async (req, res, next) => {
    const path = 'media';
    try {
      const { type, category } = req.query;
      let query: any = db.collection(path);
      
      if (type) query = query.where('type', '==', type);
      if (category && category !== 'All') query = query.where('category', '==', category);

      const snapshot = await query.get();
      const media = snapshot.docs.map((doc: any) => ({ _id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid composite index requirement
      media.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(media);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (firestoreErr) {
        next(firestoreErr);
      }
    }
  });

  // Upload Media
  app.post('/api/upload', authenticateToken, upload.single('file'), async (req: any, res, next) => {
    try {
      const { title, description, category, type } = req.body;
      const file = req.file;

      if (!file) return res.status(400).json({ message: 'No file uploaded' });

      const newMedia = {
        title,
        description,
        url: file.path,
        publicId: file.filename,
        type: type || (file.mimetype.startsWith('video') ? 'video' : 'image'),
        category: category || 'General',
        createdAt: new Date().toISOString(),
      };

      try {
        const result = await db.collection('media').add(newMedia);
        res.status(201).json({ ...newMedia, _id: result.id });
      } catch (firestoreErr) {
        console.error('Firestore write failed during upload, returning media data for client-side fallback:', firestoreErr);
        // Return the media data so the client can try to save it to Firestore itself
        res.status(201).json({ ...newMedia, _id: null, firestoreError: true });
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'media');
      } catch (firestoreErr) {
        next(firestoreErr);
      }
    }
  });

  // Delete Media
  app.delete('/api/media/:id', authenticateToken, async (req, res, next) => {
    const path = 'media';
    try {
      const id = req.params.id;
      const mediaDoc = await db.collection(path).doc(id).get();
      
      if (!mediaDoc.exists) return res.status(404).json({ message: 'Media not found' });
      const media = mediaDoc.data();

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(media.publicId, { resource_type: media.type });

      // Delete from Firestore
      await db.collection(path).doc(id).delete();

      res.json({ message: 'Media deleted successfully' });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (firestoreErr) {
        next(firestoreErr);
      }
    }
  });

  // Get Messages
  app.get('/api/messages', authenticateToken, async (req, res, next) => {
    const path = 'messages';
    try {
      const snapshot = await db.collection(path).orderBy('createdAt', 'desc').get();
      const messages = snapshot.docs.map((doc: any) => ({ _id: doc.id, ...doc.data() }));
      res.json(messages);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (firestoreErr) {
        next(firestoreErr);
      }
    }
  });

  // Delete Message
  app.delete('/api/messages/:id', authenticateToken, async (req, res, next) => {
    const path = 'messages';
    try {
      const id = req.params.id;
      await db.collection(path).doc(id).delete();
      res.json({ message: 'Message deleted successfully' });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (firestoreErr) {
        next(firestoreErr);
      }
    }
  });

  // Contact Form
  app.post('/api/contact', async (req, res, next) => {
    const path = 'messages';
    try {
      const { name, email, mobile, message } = req.body;
      const newMessage = {
        name,
        email,
        mobile: mobile || '',
        message,
        createdAt: new Date().toISOString(),
      };
      await db.collection(path).add(newMessage);
      res.json({ message: 'Message sent successfully' });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (firestoreErr) {
        next(firestoreErr);
      }
    }
  });

  // Get Profile
  app.get('/api/profile', async (req, res, next) => {
    const path = 'profile';
    try {
      const snapshot = await db.collection(path).limit(1).get();
      const profile = snapshot.docs.map((doc: any) => ({ _id: doc.id, ...doc.data() }));
      res.json(profile);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (firestoreErr) {
        next(firestoreErr);
      }
    }
  });

  // Update Profile
  app.post('/api/profile', authenticateToken, async (req, res, next) => {
    const path = 'profile';
    try {
      const { _id, ...profileData } = req.body;
      const snapshot = await db.collection(path).limit(1).get();
      
      const updateData = {
        ...profileData,
        updatedAt: new Date().toISOString(),
      };

      if (snapshot.empty) {
        const result = await db.collection(path).add(updateData);
        res.json({ ...updateData, _id: result.id });
      } else {
        const docId = snapshot.docs[0].id;
        await db.collection(path).doc(docId).set(updateData, { merge: true });
        res.json({ ...updateData, _id: docId });
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (firestoreErr) {
        next(firestoreErr);
      }
    }
  });

  // Upload Logo
  app.post('/api/upload-logo', authenticateToken, upload.single('file'), async (req: any, res, next) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: 'No file uploaded' });

      res.json({ url: file.path });
    } catch (err) {
      next(err);
    }
  });

  // Upload Profile Pic
  app.post('/api/upload-profile-pic', authenticateToken, upload.single('file'), async (req: any, res, next) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: 'No file uploaded' });

      res.json({ url: file.path });
    } catch (err) {
      next(err);
    }
  });

  // Apply error handler
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
