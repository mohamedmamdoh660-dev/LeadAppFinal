import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

function toApiRole(role, userCount = 0) {
  return {
    id: role.id, // use actual database ID
    name: role.name.charAt(0).toUpperCase() + role.name.slice(1),
    description: role.description || '',
    active: role.active ?? true,
    can_receive_assignments: role.canReceiveAssignments ?? false,
    permissions: safeParse(role.permissions) || {},
    userCount
  };
}

function safeParse(value){
  if (!value) return null;
  try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return null; }
}

// GET /roles - list roles
router.get('/', async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    const counts = await prisma.roleOnUser.groupBy({
      by: ['roleId'],
      _count: { roleId: true }
    });
    const countMap = new Map(counts.map(c => [c.roleId, c._count.roleId]));
    const items = roles.map(r => toApiRole(r, countMap.get(r.id) || 0));
    res.json({ items });
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /roles/:id - get role by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) return res.status(400).json({ error: 'Invalid role ID' });
    
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    const userCount = await prisma.roleOnUser.count({
      where: { roleId }
    });
    res.json({ role: toApiRole(role, userCount) });
  } catch (err) {
    console.error('Error fetching role:', err);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// POST /roles - create role
router.post('/', async (req, res) => {
  try {
    const { name, description = '', active = true, can_receive_assignments = false, permissions = {} } = req.body;
    if (!name || !/^[a-z0-9-]+$/.test(name)) {
      return res.status(400).json({ error: 'Invalid role name' });
    }
    const created = await prisma.role.create({
      data: {
        name,
        description,
        active,
        canReceiveAssignments: !!can_receive_assignments,
        permissions: permissions ? JSON.stringify(permissions) : null
      }
    });
    res.status(201).json({ role: toApiRole(created, 0) });
  } catch (err) {
    console.error('Error creating role:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /roles/:id - update role
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) return res.status(400).json({ error: 'Invalid role ID' });
    
    const { name, description, active, can_receive_assignments, permissions } = req.body;
    console.log('Updating role', roleId, 'with data:', { name, description, active, can_receive_assignments, permissions });
    
    // Validate name if provided
    if (name !== undefined && (!name || !/^[a-z0-9-]+$/.test(name))) {
      return res.status(400).json({ error: 'Invalid role name' });
    }
    
    const updated = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(can_receive_assignments !== undefined ? { canReceiveAssignments: !!can_receive_assignments } : {}),
        ...(permissions !== undefined ? { permissions: permissions ? JSON.stringify(permissions) : null } : {})
      }
    });
    const userCount = await prisma.roleOnUser.count({ where: { roleId } });
    res.json({ role: toApiRole(updated, userCount) });
  } catch (err) {
    console.error('Error updating role:', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Role not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Role name already exists' });
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /roles/:id - delete role
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) return res.status(400).json({ error: 'Invalid role ID' });

    // do not allow delete if any users have this role
    const usersWithRole = await prisma.roleOnUser.count({ where: { roleId } });
    if (usersWithRole > 0) {
      return res.status(400).json({ error: `Cannot delete role: ${usersWithRole} user(s) have this role` });
    }

    await prisma.role.delete({ where: { id: roleId } });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting role:', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Role not found' });
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

export default router;
