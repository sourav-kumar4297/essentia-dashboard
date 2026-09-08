import { prisma } from "@/lib/db";

/** Notify an executive when a lead is assigned to them. */
export async function notifyLeadAssigned(opts: {
  assigneeId: string;
  assigneeName: string;
  leadId: string;
  leadName: string;
  assignerName: string;
}) {
  const title = "New lead assigned";
  const body = `${opts.assignerName} assigned "${opts.leadName}" to ${opts.assigneeName}.`;
  return prisma.notification.create({
    data: {
      userId: opts.assigneeId,
      type: "LEAD_ASSIGNED",
      title,
      body,
      leadId: opts.leadId,
    },
  });
}
