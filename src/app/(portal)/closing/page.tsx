"use client";

import Link from "next/link";
import {
  Button,
  PageHeader,
  Panel,
  ScreenState,
  Stat,
} from "@/components/ui";
import { usePortal } from "@/lib/store";
import { formatINR } from "@/lib/rates";
import { format } from "date-fns";

export default function ClosingPage() {
  const { orders, proposals, leads, advisors, confirmInstalment } = usePortal();
  const accepted = proposals.filter((p) => p.status === "accepted");

  return (
    <div>
      <PageHeader
        eyebrow="05 · Close"
        title="Closing & Handoff"
        description="Accept a proposal on step 04, then confirm first instalment to fire the handoff."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Accepted proposals" value={accepted.length} />
        <Stat label="Orders" value={orders.length} />
        <Stat
          label="Handoffs ready"
          value={orders.filter((o) => o.handoffReady).length}
          tone="good"
        />
      </div>

      {orders.length === 0 ? (
        <ScreenState
          state="empty"
          emptyTitle="No order confirmations yet"
          emptyBody="Accept a Design Fee Proposal on step 04 to create one."
        >
          {null}
        </ScreenState>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const lead = leads.find((l) => l.id === order.leadId);
            const proposal = proposals.find((p) => p.id === order.proposalId);
            const advisor = advisors.find((a) => a.id === order.advisorId);
            const canConfirm = !order.instalmentConfirmed;
            return (
              <Panel
                key={order.id}
                className="animate-rise"
                title={`Order ${order.id}`}
                action={
                  <span className="metric border border-line px-2 py-1">
                    {order.handoffReady ? "Handoff fired" : "Awaiting instalment"}
                  </span>
                }
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="label text-fg-muted">Family</p>
                    <p className="metric mt-1">{lead?.name}</p>
                    <p className="label mt-1 text-fg-dim">
                      {lead?.projectType} · {lead?.location}
                    </p>
                  </div>
                  <div>
                    <p className="label text-fg-muted">Proposal</p>
                    <p className="metric mt-1">
                      {proposal ? formatINR(proposal.total) : "—"}
                    </p>
                    <p className="label mt-1 text-fg-dim">{order.proposalId}</p>
                  </div>
                  <div>
                    <p className="label text-fg-muted">Advisor</p>
                    <p className="metric mt-1">{advisor?.name ?? "—"}</p>
                    <p className="label mt-1 text-fg-dim">
                      {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                </div>

                {canConfirm ? (
                  <div className="mt-5">
                    <Button
                      variant="primary"
                      onClick={() => confirmInstalment(order.id)}
                    >
                      Confirm first instalment → fire handoff
                    </Button>
                    <p className="label mt-2 text-fg-dim">
                      Manual confirmation for v1 — no payment gateway.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 border border-line p-4">
                    <p className="label text-fg-muted">
                      Engagement handoff package
                    </p>
                    <pre className="label mt-3 whitespace-pre-wrap text-fg">
                      {order.handoffSummary}
                    </pre>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      {orders.length === 0 && (
        <div className="mt-4">
          <Link href="/proposals">
            <Button>Open Fee Proposal</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
