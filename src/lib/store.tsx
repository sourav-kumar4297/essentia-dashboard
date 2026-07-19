"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ADVISORS, INITIAL_LEADS } from "./mock-data";
import type {
  CompanyProfileDoc,
  Consultation,
  DesignFeeProposal,
  DesignServiceId,
  Lead,
  OrderConfirmation,
  Qualification,
} from "./types";
import { calculateProposal } from "./rates";

/** v4 — Lead Intelligence Dashboard (aligned to live portal reference). */
const STORAGE_KEY = "essentia_portal_state_v4";

interface PortalState {
  leads: Lead[];
  consultations: Record<string, Consultation>;
  profiles: CompanyProfileDoc[];
  proposals: DesignFeeProposal[];
  orders: OrderConfirmation[];
}

interface PortalContextValue extends PortalState {
  advisors: typeof ADVISORS;
  addLead: (input: Omit<Lead, "id" | "capturedAt">) => string;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  qualifyLead: (id: string, q: Qualification) => void;
  assignLead: (id: string, advisorId: string) => void;
  logFollowUp: (id: string) => void;
  handoffToAcquisition: (id: string, advisorId: string) => void;
  saveConsultation: (c: Consultation) => void;
  saveProfile: (
    p: Omit<CompanyProfileDoc, "id" | "createdAt"> & { id?: string },
  ) => string;
  markProfileSent: (id: string) => void;
  upsertProposal: (input: {
    id?: string;
    leadId: string;
    selected: DesignServiceId[];
    sqft: number;
    renderQty: number;
    privileged: boolean;
    friendsFamily: boolean;
    advisorNotes: string;
    commissionNote: string;
    status?: DesignFeeProposal["status"];
  }) => string;
  markProposalSent: (id: string) => void;
  acceptProposal: (id: string) => string;
  confirmInstalment: (orderId: string) => void;
  resetDemo: () => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

function initialState(): PortalState {
  return {
    leads: INITIAL_LEADS,
    consultations: {},
    profiles: [],
    proposals: [],
    orders: [],
  };
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PortalState>;
        setState({ ...initialState(), ...parsed, leads: parsed.leads?.length ? parsed.leads : INITIAL_LEADS });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addLead = useCallback((input: Omit<Lead, "id" | "capturedAt">) => {
    const id = uid("lead");
    const lead: Lead = {
      ...input,
      id,
      capturedAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, leads: [lead, ...s.leads] }));
    return id;
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }, []);

  const qualifyLead = useCallback(
    (id: string, q: Qualification) => {
      updateLead(id, {
        qualification: q,
        stage: q === "Unqualified" ? "contacted" : "qualified",
        firstContactedAt: new Date().toISOString(),
        lastFollowUpAt: new Date().toISOString(),
      });
    },
    [updateLead],
  );

  const assignLead = useCallback(
    (id: string, advisorId: string) => {
      updateLead(id, { assignedAdvisorId: advisorId });
    },
    [updateLead],
  );

  const logFollowUp = useCallback(
    (id: string) => {
      updateLead(id, {
        lastFollowUpAt: new Date().toISOString(),
        firstContactedAt: new Date().toISOString(),
        stage: "contacted",
      });
    },
    [updateLead],
  );

  const handoffToAcquisition = useCallback(
    (id: string, advisorId: string) => {
      updateLead(id, {
        assignedAdvisorId: advisorId,
        stage: "handed_to_acquisition",
      });
    },
    [updateLead],
  );

  const saveConsultation = useCallback((c: Consultation) => {
    setState((s) => ({
      ...s,
      consultations: { ...s.consultations, [c.leadId]: c },
      leads: s.leads.map((l) =>
        l.id === c.leadId
          ? {
              ...l,
              stage: "consultation",
              projectType: c.projectType,
              location: c.location,
            }
          : l,
      ),
    }));
  }, []);

  const saveProfile = useCallback(
    (p: Omit<CompanyProfileDoc, "id" | "createdAt"> & { id?: string }) => {
      const id = p.id ?? uid("profile");
      setState((s) => {
        const existing = s.profiles.find((x) => x.id === id);
        const doc: CompanyProfileDoc = {
          id,
          leadId: p.leadId,
          projectType: p.projectType,
          status: p.status,
          notes: p.notes,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          sentAt: p.sentAt,
        };
        const profiles = existing
          ? s.profiles.map((x) => (x.id === id ? doc : x))
          : [doc, ...s.profiles];
        return { ...s, profiles };
      });
      return id;
    },
    [],
  );

  const markProfileSent = useCallback((id: string) => {
    setState((s) => {
      const profile = s.profiles.find((p) => p.id === id);
      return {
        ...s,
        profiles: s.profiles.map((p) =>
          p.id === id
            ? { ...p, status: "sent", sentAt: new Date().toISOString() }
            : p,
        ),
        leads: s.leads.map((l) =>
          profile && l.id === profile.leadId
            ? { ...l, stage: "profile_sent" }
            : l,
        ),
      };
    });
  }, []);

  const upsertProposal = useCallback(
    (input: {
      id?: string;
      leadId: string;
      selected: DesignServiceId[];
      sqft: number;
      renderQty: number;
      privileged: boolean;
      friendsFamily: boolean;
      advisorNotes: string;
      commissionNote: string;
      status?: DesignFeeProposal["status"];
    }) => {
      const id = input.id ?? uid("prop");
      const calc = calculateProposal(
        input.selected,
        input.sqft,
        input.renderQty,
        input.privileged,
        input.friendsFamily,
      );
      setState((s) => {
        const existing = s.proposals.find((p) => p.id === id);
        const doc: DesignFeeProposal = {
          id,
          leadId: input.leadId,
          status: input.status ?? existing?.status ?? "draft",
          lines: calc.lines,
          privilegedPricing: input.privileged,
          friendsFamily: input.friendsFamily,
          discountPercent: calc.discountPercent,
          subtotal: calc.subtotal,
          total: calc.total,
          advisorNotes: input.advisorNotes,
          commissionNote: input.commissionNote,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          sentAt: existing?.sentAt,
          acceptedAt: existing?.acceptedAt,
        };
        const proposals = existing
          ? s.proposals.map((p) => (p.id === id ? doc : p))
          : [doc, ...s.proposals];
        return {
          ...s,
          proposals,
          leads: s.leads.map((l) =>
            l.id === input.leadId &&
            l.stage !== "accepted" &&
            l.stage !== "handed_to_engagement"
              ? { ...l, stage: "proposal_draft" }
              : l,
          ),
        };
      });
      return id;
    },
    [],
  );

  const markProposalSent = useCallback((id: string) => {
    setState((s) => {
      const prop = s.proposals.find((p) => p.id === id);
      return {
        ...s,
        proposals: s.proposals.map((p) =>
          p.id === id
            ? { ...p, status: "sent", sentAt: new Date().toISOString() }
            : p,
        ),
        leads: s.leads.map((l) =>
          prop && l.id === prop.leadId ? { ...l, stage: "proposal_sent" } : l,
        ),
      };
    });
  }, []);

  const acceptProposal = useCallback((id: string) => {
    const orderId = uid("order");
    setState((s) => {
      const prop = s.proposals.find((p) => p.id === id);
      if (!prop) return s;
      const lead = s.leads.find((l) => l.id === prop.leadId);
      const order: OrderConfirmation = {
        id: orderId,
        proposalId: id,
        leadId: prop.leadId,
        advisorId: lead?.assignedAdvisorId ?? "adv-acq-1",
        instalmentConfirmed: false,
        handoffReady: false,
        handoffSummary: "",
        createdAt: new Date().toISOString(),
      };
      return {
        ...s,
        proposals: s.proposals.map((p) =>
          p.id === id
            ? { ...p, status: "accepted", acceptedAt: new Date().toISOString() }
            : p,
        ),
        leads: s.leads.map((l) =>
          l.id === prop.leadId ? { ...l, stage: "accepted" } : l,
        ),
        orders: [order, ...s.orders],
      };
    });
    return orderId;
  }, []);

  const confirmInstalment = useCallback((orderId: string) => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === orderId);
      if (!order) return s;
      const lead = s.leads.find((l) => l.id === order.leadId);
      const consultation = s.consultations[order.leadId];
      const summary = [
        `Family: ${lead?.name}`,
        `Project: ${lead?.projectType} · ${lead?.location}`,
        `Decision-maker: ${consultation?.decisionMaker ?? "—"}`,
        `Archetype: ${consultation?.archetype ?? "—"}`,
        `Notes: ${consultation?.summary ?? "—"}`,
        `Proposal: ${order.proposalId}`,
        `Ready for Customer Advisor — Engagement`,
      ].join("\n");
      return {
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                instalmentConfirmed: true,
                handoffReady: true,
                handoffSummary: summary,
                handoffAt: new Date().toISOString(),
              }
            : o,
        ),
        leads: s.leads.map((l) =>
          l.id === order.leadId
            ? { ...l, stage: "handed_to_engagement" }
            : l,
        ),
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = initialState();
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      advisors: ADVISORS,
      addLead,
      updateLead,
      qualifyLead,
      assignLead,
      logFollowUp,
      handoffToAcquisition,
      saveConsultation,
      saveProfile,
      markProfileSent,
      upsertProposal,
      markProposalSent,
      acceptProposal,
      confirmInstalment,
      resetDemo,
    }),
    [
      state,
      addLead,
      updateLead,
      qualifyLead,
      assignLead,
      logFollowUp,
      handoffToAcquisition,
      saveConsultation,
      saveProfile,
      markProfileSent,
      upsertProposal,
      markProposalSent,
      acceptProposal,
      confirmInstalment,
      resetDemo,
    ],
  );

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}
