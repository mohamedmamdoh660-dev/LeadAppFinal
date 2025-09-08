import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixUnhashedPasswords() {
  console.log('🔍 Checking for unhashed passwords...');
  
  // Get all users
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    if (!user.password.startsWith('$2')) {
      console.log(`🔧 Fixing password for user: ${user.email}`);
      
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Update the user with hashed password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log(`✅ Password fixed for: ${user.email}`);
    } else {
      console.log(`✅ Password already hashed for: ${user.email}`);
    }
  }
  
  console.log('🎉 All passwords are now properly hashed!');
  await prisma.$disconnect();
}

fixUnhashedPasswords().catch(console.error);
