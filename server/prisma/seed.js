import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Password hashed successfully');

    // Create roles
    console.log('Creating admin role...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        canReceiveAssignments: true,
        description: 'Administrator role with full access',
        permissions: JSON.stringify(['all'])
      }
    });
    console.log(`Admin role created with ID: ${adminRole.id}`);

    console.log('Creating sales role...');
    const salesRole = await prisma.role.upsert({
      where: { name: 'sales' },
      update: {},
      create: {
        name: 'sales',
        canReceiveAssignments: true,
        description: 'Sales representative role',
        permissions: JSON.stringify(['leads', 'tasks'])
      }
    });
    console.log(`Sales role created with ID: ${salesRole.id}`);

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@leadapp.com' },
      update: {
        password: hashedPassword,
        name: 'Admin User',
        phone: '+1234567890',
        country: 'USA',
        active: true
      },
      create: {
        name: 'Admin User',
        email: 'admin@leadapp.com',
        password: hashedPassword,
        phone: '+1234567890',
        country: 'USA',
        active: true
      }
    });
    console.log(`Admin user created with ID: ${adminUser.id}`);

    // Assign admin role to admin user
    console.log('Assigning admin role to user...');
    const roleAssignment = await prisma.roleOnUser.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
    console.log(`Role assignment created: User ${adminUser.id} -> Role ${adminRole.id}`);

    console.log('Database seeded successfully');
    console.log(`Admin user created with ID: ${adminUser.id}`);
    
    // Verify the data
    const userWithRoles = await prisma.user.findUnique({
      where: { email: 'admin@leadapp.com' },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    console.log('User verification:', JSON.stringify(userWithRoles, null, 2));
    
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
