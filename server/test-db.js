import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testing database and authentication...');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    console.log('\n📊 Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Is hashed: ${user.password.startsWith('$2') ? 'Yes' : 'No'}`);
      console.log(`  Roles: ${user.roles.map(r => r.role.name).join(', ')}`);
      console.log('');
    });
    
    // Test password verification for testuser
    const testUser = users.find(u => u.email === 'testuser@test.com');
    if (testUser) {
      console.log('🔐 Testing testuser password verification:');
      const testPassword = 'testuser';
      const isValid = await bcrypt.compare(testPassword, testUser.password);
      console.log(`Password "${testPassword}" is valid: ${isValid}`);
    } else {
      console.log('❌ testuser@test.com not found in database');
    }
    
    // Test password verification for admin user
    const adminUser = users.find(u => u.email === 'admin@leadapp.com');
    if (adminUser) {
      console.log('🔐 Testing admin password verification:');
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, adminUser.password);
      console.log(`Password "${testPassword}" is valid: ${isValid}`);
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
