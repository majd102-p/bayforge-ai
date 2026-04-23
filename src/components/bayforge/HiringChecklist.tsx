'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface HiringItem {
  id: string;
  text: string;
  detail: string;
  isCritical: boolean;
  legalRef?: string;
  link?: {
    label: string;
    url: string;
  };
}

// ── Data ────────────────────────────────────────────────────────────────────

const HIRING_ITEMS: HiringItem[] = [
  {
    id: 'h1',
    text: 'Verify contractor license at CSLB.ca.gov',
    detail:
      'Look up the contractor\'s license number on the California State Licensing Board website. Confirm the license is active, in good standing, and has no pending disciplinary actions. Check for any license restrictions.',
    isCritical: true,
    legalRef: 'BPC §7026',
    link: {
      label: 'CSLB License Lookup',
      url: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/LicenseDetail.aspx',
    },
  },
  {
    id: 'h2',
    text: 'Check for A or B General Contractor license',
    detail:
      'For ADU construction, the contractor must hold a Class A (General Engineering) or Class B (General Building) license. Specialty C-licenses (e.g., C-13 Electrical, C-36 Plumbing) alone are NOT sufficient to build an ADU.',
    isCritical: true,
    legalRef: 'BPC §7057',
  },
  {
    id: 'h3',
    text: 'Confirm they will pull permits in YOUR name',
    detail:
      'The building permit should be in your name as the property owner, not the contractor\'s name. This ensures you maintain control of the project and can communicate directly with the building department. Never let a contractor pull permits in their name for your property.',
    isCritical: true,
  },
  {
    id: 'h4',
    text: 'Get minimum 3 independent bids',
    detail:
      'Obtain at least 3 written bids from licensed contractors. Compare not just price, but scope of work, materials, timeline, and warranties. Be wary of bids that are significantly lower than others — it often indicates the contractor is cutting corners or will add costs later.',
    isCritical: false,
  },
  {
    id: 'h5',
    text: 'Never pay more than 10% down (CA law)',
    detail:
      'California law restricts down payments to no more than 10% of the total contract price or $1,000, whichever is less. For projects over $500, a written contract is legally required. This protects you from contractors who take deposits and disappear.',
    isCritical: true,
    legalRef: 'BPC §7159',
  },
  {
    id: 'h6',
    text: 'Require written contract with milestone payments',
    detail:
      'Get a detailed written contract specifying scope of work, materials, timeline, total cost, and payment schedule. Payments should be tied to specific milestones (foundation, framing, rough-in, final). Include a retention clause (hold back 10% until final completion).',
    isCritical: true,
    legalRef: 'BPC §7159',
  },
  {
    id: 'h7',
    text: 'Ask for proof of general liability and workers comp insurance',
    detail:
      'Request a current Certificate of Insurance (COI) showing at least $1M in general liability coverage and active workers\' compensation insurance. Verify the insurance is current by calling the insurance broker directly. Uninsured workers injured on your property could sue you.',
    isCritical: true,
    legalRef: 'Lab Code §3700',
  },
  {
    id: 'h8',
    text: 'Check references from at least 3 past clients',
    detail:
      'Ask for and contact at least 3 references from past ADU projects. Ask about: quality of work, communication, timeliness, whether they stayed on budget, and if they would hire the contractor again. Visit completed projects in person if possible.',
    isCritical: false,
  },
];

// ── Component ───────────────────────────────────────────────────────────────

export function HiringChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const reset = () => setChecked(new Set());

  const totalItems = HIRING_ITEMS.length;
  const checkedCount = checked.size;
  const progress = Math.round((checkedCount / totalItems) * 100);
  const allCriticalChecked = HIRING_ITEMS.filter((i) => i.isCritical).every((i) => checked.has(i.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Before You Hire
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Essential checklist before signing a contract with any ADU contractor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {checkedCount}/{totalItems} verified
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-7 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-amber-600 dark:text-amber-400">
              Protect yourself:
            </strong>{' '}
            California law gives you specific rights when hiring a contractor. Never skip
            these steps. Victims of contractor fraud can file complaints with CSLB at{' '}
            <a
              href="https://www.cslb.ca.gov/Consumers/FileAComplaint.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
            >
              CSLB.ca.gov
              <ExternalLink className="h-2.5 w-2.5 inline ml-0.5" />
            </a>
            .
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-sm">Verification Progress</h3>
          </div>
          <span className="text-sm text-muted-foreground font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {allCriticalChecked && checkedCount === totalItems && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              All items verified — you&apos;re ready to hire with confidence!
            </span>
          </motion.div>
        )}
      </Card>

      {/* Checklist Items */}
      <div className="space-y-3">
        {HIRING_ITEMS.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
          >
            <Card
              className={`p-5 transition-all duration-200 ${
                checked.has(item.id)
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'hover:border-amber-500/20'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkmark Circle */}
                <button
                  onClick={() => toggle(item.id)}
                  className="mt-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-full"
                  aria-label={`Toggle ${item.text}`}
                >
                  {checked.has(item.id) ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-amber-500/50 transition-colors">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`font-semibold text-sm leading-snug transition-colors ${
                          checked.has(item.id)
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        {item.text}
                      </h4>
                      {item.isCritical && !checked.has(item.id) && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                        >
                          Required
                        </Badge>
                      )}
                      {item.legalRef && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30"
                        >
                          {item.legalRef}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {item.detail}
                  </p>

                  {/* Link */}
                  {item.link && (
                    <a
                      href={item.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {item.link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Remember:</strong> Always verify
            licenses, get everything in writing, and never pay large upfront
            deposits. If something feels wrong, it probably is. Report contractor
            fraud to{' '}
            <a
              href="https://www.cslb.ca.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
            >
              CSLB.ca.gov
              <ExternalLink className="h-3 w-3 inline ml-0.5" />
            </a>
            .
          </p>
        </div>
      </Card>
    </div>
  );
}
