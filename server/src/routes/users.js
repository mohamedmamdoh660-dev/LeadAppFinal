import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

// GET /users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      active: user.active,
      assignmentEligibility: user.assignmentEligibility ? JSON.parse(user.assignmentEligibility) : null,
      roles: user.roles.map(r => r.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Profile endpoints - MUST come before /:id route

// GET /users/me - Get current user profile
router.get('/me', async (req, res) => {
  try {
    // Get current user from localStorage (fallback to admin user)
    const currentUserData = JSON.parse(req.headers['x-current-user'] || '{"id": 3}');
    const userId = currentUserData.id || 3;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      country: user.country,
      degree: user.degree,
      locale: user.locale,
      timezone: user.timezone,
      active: user.active,
      roles: user.roles.map(r => r.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json({ user: formattedUser });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /users/:id - Get single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      active: user.active,
      assignmentEligibility: user.assignmentEligibility ? JSON.parse(user.assignmentEligibility) : null,
      roles: user.roles.map(r => r.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json({ user: formattedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users - Create new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, assignmentEligibility, roles = [] } = req.body;
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        assignmentEligibility: assignmentEligibility ? JSON.stringify(assignmentEligibility) : null
      }
    });
    
    // Assign roles if provided
    if (roles.length > 0) {
      const roleRecords = await prisma.role.findMany({
        where: { name: { in: roles } }
      });
      
      await Promise.all(
        roleRecords.map(role =>
          prisma.roleOnUser.create({
            data: {
              userId: user.id,
              roleId: role.id
            }
          })
        )
      );
    }
    
    res.status(201).json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, active, assignmentEligibility, roles, phone, country, degree, locale, timezone } = req.body;
    
    console.log('Updating user', id, 'with data:', req.body);
    
    // Prepare update data
    const updateData = {
      name,
      email,
      phone: phone || null,
      country: country || null,
      degree: degree || null,
      locale: locale || null,
      timezone: timezone || null,
      active: active !== undefined ? active : true,
      assignmentEligibility: assignmentEligibility ? JSON.stringify(assignmentEligibility) : null
    };
    
    // Hash password if provided
    if (password && password.trim() !== '') {
      console.log('Hashing password for user:', id);
      updateData.password = await bcrypt.hash(password, 10);
      console.log('Password hashed successfully');
    }
    
    // Update user basic info
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    // Update user roles if provided
    if (roles !== undefined) {
      console.log('Updating roles for user', id, ':', roles);
      
      // Delete existing role assignments
      await prisma.roleOnUser.deleteMany({
        where: { userId: parseInt(id) }
      });
      
      // Add new role assignments
      if (roles.length > 0) {
        const roleRecords = await prisma.role.findMany({
          where: { name: { in: roles } }
        });
        
        console.log('Found role records:', roleRecords);
        
        await Promise.all(
          roleRecords.map(role =>
            prisma.roleOnUser.create({
              data: {
                userId: parseInt(id),
                roleId: role.id
              }
            })
          )
        );
      }
    }
    
    // Fetch updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    // Format user data for response
    const formattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      country: updatedUser.country,
      degree: updatedUser.degree,
      locale: updatedUser.locale,
      timezone: updatedUser.timezone,
      active: updatedUser.active,
      roles: updatedUser.roles.map(ur => ur.role.name),
      assignmentEligibility: updatedUser.assignmentEligibility ? JSON.parse(updatedUser.assignmentEligibility) : null
    };
    
    console.log('Updated user:', formattedUser);
    res.json({ user: formattedUser });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user roles first
    await prisma.roleOnUser.deleteMany({
      where: { userId: parseInt(id) }
    });
    
    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// PUT /users/me - Update current user profile
router.put('/me', async (req, res) => {
  try {
    // Get the first user from database
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }
    const currentUserId = users[0].id;
    const { name, email } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: currentUserId }
        }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        name: name || undefined,
        email: email || undefined
      }
    });
    
    const formattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl
    };
    
    res.json({ user: formattedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /users/me/password - Change password
router.put('/me/password', async (req, res) => {
  try {
    const currentUserId = 1; // Hardcoded for now
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: currentUserId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await prisma.user.update({
      where: { id: currentUserId },
      data: {
        password: hashedNewPassword
      }
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// POST /users/me/avatar - Upload avatar
router.post('/me/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const currentUserId = 1; // Hardcoded for now
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Generate avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Get current user to delete old avatar if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });
    
    // Delete old avatar file if exists
    if (currentUser?.avatarUrl) {
      const oldAvatarPath = path.join(process.cwd(), currentUser.avatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Update user with new avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        avatarUrl: avatarUrl
      }
    });
    
    res.json({ 
      avatarUrl: updatedUser.avatarUrl,
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// DELETE /users/me/avatar - Remove avatar
router.delete('/me/avatar', async (req, res) => {
  try {
    const currentUserId = 1; // Hardcoded for now
    
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });
    
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete avatar file if exists
    if (currentUser.avatarUrl) {
      const avatarPath = path.join(process.cwd(), currentUser.avatarUrl);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    // Remove avatar URL from database
    await prisma.user.update({
      where: { id: currentUserId },
      data: {
        avatarUrl: null
      }
    });
    
    res.json({ message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Error removing avatar:', error);
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

export default router;
