'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Scale,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Info,
  Clock,
  ShieldCheck,
  Car,
  DollarSign,
  AlertTriangle,
  BookOpen,
  Gavel,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface LegalProvision {
  text: string;
}

interface LegalEntry {
  id: string;
  code: string;
  title: string;
  description: string;
  provisions: LegalProvision[];
  effectiveDate: string;
  url: string;
  badge: string;
  badgeColor: string;
}

interface KeyFact {
  icon: React.ElementType;
  title: string;
  description: string;
}

// ── Data ────────────────────────────────────────────────────────────────────

const LEGAL_ENTRIES: LegalEntry[] = [
  {
    id: 'gov-65852-2',
    code: 'Gov Code §65852.2',
    title: 'State ADU Standards',
    description:
      'The primary state law establishing ADU development standards that all California cities and counties must comply with. Sets baseline rules for lot size, setbacks, height, and density.',
    provisions: [
      { text: 'Lots ≥ 5,000 sq ft may have at least one ADU and one JADU regardless of zoning' },
      { text: 'Detached ADUs up to 800 sq ft are ministerially approved (no discretionary review)' },
      { text: 'Attached ADUs up to 50% of primary dwelling or 1,200 sq ft, whichever is less' },
      { text: 'Setbacks: 4 ft side/rear (may be zero if building/fire code allows)' },
      { text: 'Height: 16 ft for detached (may be 18 ft with certain conditions)' },
      { text: 'One parking space required unless within ½ mile of transit, or other waivers apply' },
      { text: 'Owner-occupancy requirements prohibited for ADU permits issued after Jan 1, 2020' },
      { text: 'Cities must act on ministerial ADU applications within 60 days' },
    ],
    effectiveDate: 'January 1, 2020 (amended 2021, 2023)',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2',
    badge: 'Primary Law',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  },
  {
    id: 'ab-2221',
    code: 'AB 2221 (2023)',
    title: 'Expanded ADU Rights',
    description:
      'Assembly Bill 2221 further expanded ADU rights by increasing size limits, streamlining the approval process, and clarifying provisions for garage conversions and multi-family ADUs.',
    provisions: [
      { text: 'Increased maximum ADU size from 1,000 sq ft to 1,200 sq ft for attached ADUs' },
      { text: 'Clarified that garage conversions may not require replacement parking in most cases' },
      { text: 'Streamlined permitting for ADUs under 800 sq ft — fully ministerial, no CEQA review' },
      { text: 'Extended fire safety requirements for ADUs in Very High Fire Hazard Severity Zones' },
      { text: 'Required cities to post ADU ordinances and standard plans on their websites' },
      { text: 'Authorized ADUs on multi-family lots: up to 25% of existing units or 2 ADUs (whichever is greater)' },
    ],
    effectiveDate: 'January 1, 2024',
    url: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB2221',
    badge: 'Assembly Bill',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'sb-897',
    code: 'SB 897 (2023)',
    title: 'ADU Streamlining',
    description:
      'Senate Bill 897 focused on removing barriers and reducing processing times for ADU applications. Requires jurisdictions to adopt streamlined ADU ordinances.',
    provisions: [
      { text: 'Required all jurisdictions to adopt an ADU ordinance by March 1, 2024' },
      { text: 'Set a 60-day hard deadline for ministerial ADU permit decisions' },
      { text: 'Prohibited cities from requiring more than the minimum state standards' },
      { text: 'Clarified that ADU applications cannot be conditioned on discretionary review' },
      { text: 'Required HCD to maintain a complaint process for non-compliant jurisdictions' },
      { text: 'Enabled HCD to withhold housing funds from cities that fail to comply' },
    ],
    effectiveDate: 'January 1, 2024',
    url: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240SB897',
    badge: 'Senate Bill',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    id: 'gov-65852-1',
    code: 'Gov Code §65852.1',
    title: 'JADU Standards',
    description:
      'Junior Accessory Dwelling Unit (JADU) standards — smaller living units created within the walls of an existing or proposed single-family home, such as converted bedrooms or attached garages.',
    provisions: [
      { text: 'Maximum size: 500 sq ft' },
      { text: 'Must be contained within the existing footprint of a single-family dwelling' },
      { text: 'May include separate kitchen and bathroom facilities' },
      { text: 'Owner-occupancy required (owner must live in either primary residence or JADU)' },
      { text: 'No additional parking required' },
      { text: 'Cannot be sold separately from the primary residence' },
      { text: 'Impact fees waived for JADUs ≤ 750 sq ft (state law)' },
    ],
    effectiveDate: 'January 1, 2017 (amended 2020, 2022)',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.1',
    badge: 'Primary Law',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  },
  {
    id: 'hcd-handbook',
    code: 'HCD ADU Handbook',
    title: 'ADU Technical Guide',
    description:
      'The HCD ADU Handbook is the most comprehensive technical resource for ADU development in California. It provides guidance on design, permitting, and compliance with state ADU standards.',
    provisions: [
      { text: 'Detailed sizing and setback requirements with diagrams' },
      { text: 'Fire safety requirements for all ADU types and locations' },
      { text: 'Energy compliance guidance (Title 24) with prescriptive and performance approaches' },
      { text: 'Accessibility requirements for ADUs' },
      { text: 'Utility connection and metering requirements' },
      { text: 'Step-by-step permitting process overview' },
      { text: 'Sample ordinance language for jurisdictions' },
    ],
    effectiveDate: 'Updated 2024',
    url: 'https://www.hcd.ca.gov/policy-research/planning/adu/',
    badge: 'Technical Guide',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
];

const KEY_FACTS: KeyFact[] = [
  {
    icon: Clock,
    title: '60-Day Ministerial Approval',
    description:
      'ADU permits reviewed through the streamlined ministerial process must be approved or denied within 60 calendar days. No discretionary hearings allowed.',
  },
  {
    icon: ShieldCheck,
    title: 'No Owner-Occupancy After 2020',
    description:
      'State law prohibits owner-occupancy requirements for ADU permits issued after January 1, 2020. You can build an ADU without living on the property. JADUs still require owner occupancy.',
  },
  {
    icon: Car,
    title: 'Parking Waivers Near Transit',
    description:
      'ADU parking requirements are waived if the property is within ½ mile of a major transit stop, or if the ADU is part of a garage conversion. Many cities waive parking entirely.',
  },
  {
    icon: DollarSign,
    title: 'Impact Fee Limits',
    description:
      'State law caps ADU impact fees. JADUs and ADUs ≤ 750 sq ft cannot be charged impact fees greater than what a primary residence would pay. Many cities waive fees entirely for smaller ADUs.',
  },
];

// ── Component ───────────────────────────────────────────────────────────────

export function LegalFramework() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          California ADU Legal Framework
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Key statutes, bills, and regulations governing ADU development in California
        </p>
      </div>

      {/* Key ADU Facts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {KEY_FACTS.map((fact, index) => (
          <motion.div
            key={fact.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Card className="p-4 h-full border-amber-500/10 bg-amber-500/[0.02]">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 shrink-0 mt-0.5">
                  <fact.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    {fact.title}
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {fact.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Legal Entries Accordion */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-sm">Statutes & Regulations</h3>
            <Badge variant="secondary" className="text-[10px]">
              {LEGAL_ENTRIES.length} entries
            </Badge>
          </div>
        </div>

        <Accordion type="multiple" className="px-4">
          {LEGAL_ENTRIES.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: index * 0.05 }}
            >
              <AccordionItem value={entry.id} className="border-b-0 border-t first:border-t-0">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left flex-1 pr-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-sm block truncate">
                          {entry.code}
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {entry.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${entry.badgeColor}`}
                      >
                        {entry.badge}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="hidden sm:inline">{entry.effectiveDate}</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pb-4">
                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {entry.description}
                    </p>

                    {/* Key Provisions */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Key Provisions
                      </h4>
                      <ul className="space-y-2">
                        {entry.provisions.map((provision, pIdx) => (
                          <li
                            key={pIdx}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="leading-relaxed">{provision.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Effective: {entry.effectiveDate}</span>
                      </div>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        View Full Text
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </Card>

      {/* Legal Disclaimer */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Legal Disclaimer:</strong> This summary is provided for informational purposes only and does not constitute legal advice. ADU laws are subject to change. Consult with a qualified land use attorney or your local planning department for the most current and applicable regulations. Always verify requirements with your specific jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
