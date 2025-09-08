import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { autoAssignLead } from '../services/assignment.js';

const prisma = new PrismaClient();
const router = Router();

// List leads (basic pagination)
router.get('/', async (req, res, next) => {
  try {
    const take = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const skip = parseInt(req.query.offset || '0', 10);
    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count(),
    ]);
    res.json({ items, total, limit: take, offset: skip });
  } catch (err) {
    next(err);
  }
});

// Get a single lead by id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { activities: true, tasks: true, assignee: true },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ lead });
  } catch (err) {
    next(err);
  }
});

// Create lead with server-side auto-assignment
router.post('/', async (req, res, next) => {
  try {
    const payload = req.body || {};
    const assigneeId = await autoAssignLead(prisma, payload);

    const lead = await prisma.lead.create({
      data: {
        full_name: payload.full_name,
        email: payload.email || null,
        phone: payload.phone || null,
        nationality: payload.nationality || null,
        residence_country: payload.residence_country || null,
        city: payload.city || null,
        gender: payload.gender || null,
        program: payload.program || null,
        degree: payload.degree || null,
        source: payload.source || null,
        stage: 'new',
        status: 'open',
        assigneeId: assigneeId || null
      }
    });

    // TODO: add activity + notification for assignment

    res.status(201).json({ lead });
  } catch (err) {
    next(err);
  }
});

// Update lead
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const payload = req.body || {};
    
    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) return res.status(404).json({ error: 'Lead not found' });

    // Only update fields that exist in the schema
    const updateData = {};
    if (payload.full_name !== undefined) updateData.full_name = payload.full_name;
    if (payload.email !== undefined) updateData.email = payload.email || null;
    if (payload.phone !== undefined) updateData.phone = payload.phone || null;
    if (payload.nationality !== undefined) updateData.nationality = payload.nationality || null;
    if (payload.residence_country !== undefined) updateData.residence_country = payload.residence_country || null;
    if (payload.city !== undefined) updateData.city = payload.city || null;
    if (payload.gender !== undefined) updateData.gender = payload.gender || null;
    if (payload.program !== undefined) updateData.program = payload.program || null;
    if (payload.degree !== undefined) updateData.degree = payload.degree || null;
    if (payload.source !== undefined) updateData.source = payload.source || null;
    if (payload.assigneeId !== undefined || payload.assignee_id !== undefined) {
      updateData.assigneeId = payload.assigneeId || payload.assignee_id || null;
    }
    if (payload.stage !== undefined) updateData.stage = payload.stage;
    if (payload.status !== undefined) updateData.status = payload.status;

    console.log('Updating lead with data:', updateData);
    
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData
    });

    console.log('Lead updated successfully:', updatedLead);
    res.json({ lead: updatedLead });
  } catch (err) {
    next(err);
  }
});

// Helper: compute next stage id
function nextStageId(current){
  const order = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted'];
  const idx = order.indexOf(current);
  if (idx < 0) return 'new';
  return order[Math.min(idx + 1, order.length - 1)];
}

// Log activity + optionally advance stage based on outcome
// Body: { method, outcome, notes, userId }
router.post('/:id/activities', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { method, outcome, notes, userId } = req.body || {};
    const fromStage = lead.stage;

    // Simple rule: advance on 'interested' or 'successful'
    const shouldAdvance = ['interested', 'successful'].includes(outcome);
    const toStage = shouldAdvance ? nextStageId(lead.stage) : lead.stage;

    const [activity, updatedLead] = await prisma.$transaction([
      prisma.leadActivity.create({
        data: {
          leadId: id,
          userId: userId || null,
          method: method || null,
          outcome: outcome || null,
          notes: notes || null,
          fromStage: fromStage,
          toStage: toStage,
        }
      }),
      prisma.lead.update({ where: { id }, data: { stage: toStage } })
    ]);

    res.status(201).json({ activity, lead: updatedLead });
  } catch (err) {
    next(err);
  }
});

// Mark lead as lost
// Body: { reason, notes, userId }
router.post('/:id/lost', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const { reason, notes, userId } = req.body || {};

    const [activity, updatedLead] = await prisma.$transaction([
      prisma.leadActivity.create({
        data: {
          leadId: id,
          userId: userId || null,
          method: null,
          outcome: 'not_interested',
          notes: notes || (reason ? `Lost: ${reason}` : 'Lost'),
          fromStage: lead.stage,
          toStage: 'lost',
        }
      }),
      prisma.lead.update({ where: { id }, data: { stage: 'lost', status: 'lost' } })
    ]);

    res.status(200).json({ lead: updatedLead, activity });
  } catch (err) {
    next(err);
  }
});

// Create a task under a lead
// Body: { title, due_at, type, assigneeId }
router.post('/:id/tasks', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const { title, due_at, dueDate, type, assigneeId, description } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });
    const task = await prisma.task.create({
      data: {
        leadId: id,
        assigneeId: assigneeId || lead.assigneeId || null,
        title,
        type: type || null,
        dueDate: dueDate ? new Date(dueDate) : (due_at ? new Date(due_at) : null)
      }
    });
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// Re-assign lead endpoint
router.post('/auto-assign', async (req, res, next) => {
  try {
    const { leadId, nationality, degree } = req.body || {};
    if (!leadId) return res.status(400).json({ error: 'leadId is required' });
    
    const assigneeId = await autoAssignLead(prisma, { nationality, degree });
    
    if (assigneeId) {
      await prisma.lead.update({
        where: { id: parseInt(leadId) },
        data: { assigneeId }
      });
    }
    
    res.json({ assigneeId });
  } catch (err) {
    next(err);
  }
});

export default router;
