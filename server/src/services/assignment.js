// Server-side auto-assignment logic using Prisma
// Mirrors the logic from front/data/mock.js but works against the DB

export async function autoAssignLead(prisma, leadData) {
  // Fetch active users + roles
  const users = await prisma.user.findMany({
    where: { active: true },
    include: { roles: { include: { role: true } } }
  });

  // First try: strict matching with country/degree filters
  let eligible = users.filter((u) => {
    const canReceive = (u.roles || []).some((ur) => ur.role?.canReceiveAssignments);
    if (!canReceive) return false;

    // Parse assignmentEligibility if it's a string
    let elig = u.assignmentEligibility || {};
    if (typeof elig === 'string') {
      try {
        elig = JSON.parse(elig);
      } catch (e) {
        elig = {};
      }
    }
    
    if (leadData?.nationality && Array.isArray(elig.countries)) {
      if (!elig.countries.includes(leadData.nationality)) return false;
    }
    if (leadData?.degree && Array.isArray(elig.degree_levels)) {
      if (!elig.degree_levels.includes(leadData.degree)) return false;
    }
    return true;
  });

  // Fallback: if no strict match, assign to any user with canReceiveAssignments
  if (eligible.length === 0) {
    eligible = users.filter((u) => {
      return (u.roles || []).some((ur) => ur.role?.canReceiveAssignments);
    });
  }

  if (eligible.length === 0) return null;

  const openStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const workloads = await Promise.all(
    eligible.map(async (user) => {
      const currentLeads = await prisma.lead.count({
        where: { assigneeId: user.id, stage: { in: openStages } }
      });
      const todayLeads = await prisma.lead.count({
        where: { assigneeId: user.id, createdAt: { gte: startOfToday } }
      });
      let elig = user.assignmentEligibility || {};
      if (typeof elig === 'string') {
        try {
          elig = JSON.parse(elig);
        } catch (e) {
          elig = {};
        }
      }
      return {
        user,
        currentLeads,
        todayLeads,
        maxOpenLeads: elig.max_open_leads ?? 999,
        maxPerDay: elig.max_per_day ?? 999,
        priority: elig.priority ?? 999
      };
    })
  );

  const available = workloads.filter(
    (w) => w.currentLeads < w.maxOpenLeads && w.todayLeads < w.maxPerDay
  );
  if (available.length === 0) return null;

  available.sort((a, b) =>
    a.priority !== b.priority ? a.priority - b.priority : a.currentLeads - b.currentLeads
  );

  return available[0].user.id;
}
