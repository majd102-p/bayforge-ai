'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COVERED_CITIES } from '@/store/ai-store';
import {
  MapPin,
  FileText,
  Scale,
  CreditCard,
  Hammer,
  Building2,
  ClipboardCheck,
  RotateCcw,
  Search,
  ExternalLink,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  text: string;
  detail: string;
  phase: number;
  legalRef?: string;
  dynamicText?: (city: string, aduType: string) => string;
}

interface PhaseInfo {
  number: number;
  title: string;
  icon: React.ElementType;
  description: string;
}

type AduType = 'Detached ADU' | 'Attached ADU' | 'Garage Conversion' | 'JADU';

// ── Constants ───────────────────────────────────────────────────────────────

const ADU_TYPES: AduType[] = [
  'Detached ADU',
  'Attached ADU',
  'Garage Conversion',
  'JADU',
];

const PHASES: PhaseInfo[] = [
  {
    number: 1,
    title: 'Pre-Application Research',
    icon: Search,
    description: 'Research zoning, verify eligibility, and gather property information',
  },
  {
    number: 2,
    title: 'Design & Plan Preparation',
    icon: FileText,
    description: 'Hire professionals, create plans, and ensure code compliance',
  },
  {
    number: 3,
    title: 'Permit Application Submittal',
    icon: Scale,
    description: 'Prepare and submit your permit application to the city',
  },
  {
    number: 4,
    title: 'Construction & Inspections',
    icon: Hammer,
    description: 'Manage construction, schedule inspections, and address corrections',
  },
  {
    number: 5,
    title: 'Post-Construction & Occupancy',
    icon: Building2,
    description: 'Finalize permits, register the unit, and prepare for occupancy',
  },
];

// ── Checklist Data ──────────────────────────────────────────────────────────

function buildChecklist(city: string, aduType: AduType): ChecklistItem[] {
  return [
    // ── Phase 1: Pre-Application Research (8 items) ──
    {
      id: '1-1',
      phase: 1,
      text: `Verify property zoning for ${city}`,
      detail: `Check ${city}'s zoning map to confirm your property is in a residential zone (R-1, R-2, R-3, etc.) that allows ADU development by right.`,
      legalRef: 'Gov Code §65852.2',
    },
    {
      id: '1-2',
      phase: 1,
      text: `Review ${city} ADU ordinance`,
      detail: `Read ${city}'s specific ADU regulations including setback requirements, height limits, lot coverage, and any local amendments beyond state standards.`,
      legalRef: 'Gov Code §65852.2',
    },
    {
      id: '1-3',
      phase: 1,
      text: 'Check for overlay districts and special zones',
      detail: `Verify if your property falls within a Historic District, Coastal Zone, Very High Fire Hazard Severity Zone (VHFHSZ), flood zone, or airport influence area.`,
      legalRef: 'Gov Code §65852.2(b)(3)',
    },
    {
      id: '1-4',
      phase: 1,
      text: `Confirm ADU type eligibility in ${city}`,
      detail: `Verify that your selected ${aduType} type is permitted on your lot. Check minimum lot size requirements and any local restrictions specific to ${aduType}.`,
    },
    {
      id: '1-5',
      phase: 1,
      text: 'Verify utility capacity and connections',
      detail: `Contact local water, sewer, and electric providers to confirm existing service can accommodate an additional dwelling unit. Request a utility capacity letter.`,
    },
    {
      id: '1-6',
      phase: 1,
      text: 'Obtain property survey and site measurements',
      detail: `Get an updated survey showing property lines, setbacks, existing structures, easements, and utilities. Essential for accurate plan preparation.`,
    },
    {
      id: '1-7',
      phase: 1,
      text: 'Research available pre-approved ADU plans',
      detail: `Check if ${city} or the state offers pre-approved ADU plan sets that can streamline the permitting process and reduce design costs.`,
      legalRef: 'SB 897 (2023)',
    },
    {
      id: '1-8',
      phase: 1,
      text: 'Calculate preliminary project budget',
      detail: `Estimate total costs including design fees, permit fees (capped by state law), impact fees, construction, utility connections, and landscaping.`,
      legalRef: 'Gov Code §66007.4',
    },

    // ── Phase 2: Design & Plan Preparation (8 items) ──
    {
      id: '2-1',
      phase: 2,
      text: 'Hire a licensed architect or designer',
      detail: `Engage a California-licensed architect or designer experienced in ${aduType} projects. Verify their license at CSLB.ca.gov or CAB. Some ${city} jurisdictions accept design-only plans.`,
      legalRef: 'BPC §5500.1',
    },
    {
      id: '2-2',
      phase: 2,
      text: 'Prepare complete architectural drawings',
      detail: `Develop floor plans, building elevations, site plan, structural calculations, and all required sheets per ${city}'s submittal requirements. Include Title 24 energy compliance documentation.`,
      legalRef: 'Title 24, Part 6',
    },
    {
      id: '2-3',
      phase: 2,
      text: 'Ensure compliance with objective design standards',
      detail: `Review and comply with ${city}'s objective design standards for exterior materials, roof pitch, fenestration, and architectural character. Standards must be objective and measurable.`,
      legalRef: 'Gov Code §65852.2(a)(4)',
    },
    {
      id: '2-4',
      phase: 2,
      text: 'Address parking requirements',
      detail: `Determine parking requirements. State law waives parking for ADUs within ½ mile of transit, in historic districts, or for garage conversions. Check ${city}'s specific parking rules.`,
      legalRef: 'Gov Code §65852.2(d)',
    },
    {
      id: '2-5',
      phase: 2,
      text: 'Complete energy compliance documentation (Title 24)',
      detail: `${aduType}s under 750 sq ft may qualify for simplified compliance. Complete Title 24 energy calculations or prescriptive compliance packages.`,
      legalRef: 'Title 24, Part 6',
    },
    {
      id: '2-6',
      phase: 2,
      text: 'Prepare fire and life safety plans',
      detail: `Design smoke detector placement, CO alarms, fire sprinkler systems (if required), fire-rated separations, and egress windows per California Building Code.`,
      legalRef: 'CBC Chapter 7, 9',
    },
    {
      id: '2-7',
      phase: 2,
      text: 'Coordinate with structural engineer',
      detail: `Obtain structural calculations and stamped drawings from a licensed civil/structural engineer, especially for ${aduType === 'Detached ADU' ? 'detached new construction' : 'structural modifications to existing building'}.`,
    },
    {
      id: '2-8',
      phase: 2,
      text: 'Finalize plans and obtain professional stamps',
      detail: `Ensure all plans are stamped and signed by licensed professionals (architect, structural engineer, energy consultant) as required by ${city} and the state of California.`,

    },

    // ── Phase 3: Permit Application Submittal (8 items) ──
    {
      id: '3-1',
      phase: 3,
      text: `Schedule a pre-application meeting with ${city}`,
      detail: `Book a pre-application conference with ${city}'s planning department to review your proposal, identify potential issues early, and confirm required application materials.`,
    },
    {
      id: '3-2',
      phase: 3,
      text: 'Complete the ADU permit application form',
      detail: `Fill out all required application forms including the ADU-specific addendum, owner verification, and contractor information if applicable.`,
    },
    {
      id: '3-3',
      phase: 3,
      text: 'Submit complete application package',
      detail: `Submit all plans, forms, fees, and supporting documents to ${city}'s planning/building department. Ensure the application qualifies for ministerial (by-right) processing.`,
      legalRef: 'Gov Code §65852.2(e)',
    },
    {
      id: '3-4',
      phase: 3,
      text: 'Pay required permit and impact fees',
      detail: `Pay plan check fees, building permit fees, and impact fees. ADU impact fees are capped by state law (≤ $15,342 for units > 750 sq ft, waived for ≤ 750 sq ft in many cases).`,
      legalRef: 'Gov Code §66007.4',
    },
    {
      id: '3-5',
      phase: 3,
      text: 'Receive plan check corrections (if any)',
      detail: `Respond to any plan check correction notices within the required timeframe. Common corrections include energy compliance, structural details, and accessibility requirements.`,
    },
    {
      id: '3-6',
      phase: 3,
      text: 'Obtain building permit',
      detail: `Receive the building permit within 60 calendar days for ministerial ADU applications. The city cannot require discretionary review for qualifying ADUs.`,
      legalRef: 'Gov Code §65905, SB 897 (2023)',
    },
    {
      id: '3-7',
      phase: 3,
      text: 'Post permit and schedule pre-construction inspection',
      detail: `Post the building permit at the job site. Schedule a pre-construction/footing inspection before beginning any work.`,
    },
    {
      id: '3-8',
      phase: 3,
      text: 'Notify neighbors (if required)',
      detail: `Check if ${city} requires neighbor notification for ADU construction. Most ADUs approved ministerially do not require public hearings or neighbor notification.`,

    },

    // ── Phase 4: Construction & Inspections (13 items) ──
    {
      id: '4-1',
      phase: 4,
      text: 'Mobilize construction and install temporary facilities',
      detail: `Set up job site fencing, temporary toilet, construction debris management, and material staging area per ${city} requirements.`,
    },
    {
      id: '4-2',
      phase: 4,
      text: 'Complete excavation and foundation work',
      detail: `Excavate for foundation, install footings, and pour foundation. Schedule foundation/footing inspection before proceeding. Verify setbacks from property lines.`,
    },
    {
      id: '4-3',
      phase: 4,
      text: 'Rough framing inspection',
      detail: `Complete structural framing including walls, floors, and roof. Schedule rough framing inspection. Verify hurricane ties, hold-downs, and shear wall nailing.`,
    },
    {
      id: '4-4',
      phase: 4,
      text: 'Rough plumbing inspection',
      detail: `Install all water supply, drain, waste, and vent piping. Pressure test supply lines. Schedule rough plumbing inspection before enclosing walls.`,
    },
    {
      id: '4-5',
      phase: 4,
      text: 'Rough electrical inspection',
      detail: `Install wiring, panels, circuits, and boxes per NEC code. Schedule rough electrical inspection. Ensure proper grounding and GFCI protection.`,
    },
    {
      id: '4-6',
      phase: 4,
      text: 'Rough HVAC/ductwork inspection',
      detail: `Install HVAC system, ductwork, and ventilation. Schedule rough HVAC inspection. Verify Title 24 compliance for insulation and duct sealing.`,
    },
    {
      id: '4-7',
      phase: 4,
      text: 'Install insulation (insulation inspection)',
      detail: `Install wall, ceiling, and floor insulation per Title 24 energy requirements. Schedule insulation inspection before covering with drywall.`,
      legalRef: 'Title 24, Part 6',
    },
    {
      id: '4-8',
      phase: 4,
      text: 'Install drywall and interior finishes',
      detail: `Hang drywall, tape, texture, and paint. Install interior doors, trim, and baseboards. Maintain fire-rated assemblies as designed.`,
    },
    {
      id: '4-9',
      phase: 4,
      text: 'Install fire and life safety systems',
      detail: `Install smoke detectors (interconnected), CO alarms, fire extinguishers, and fire sprinklers if required. Verify egress windows meet minimum size requirements.`,
      legalRef: 'CBC Section 310, 726',
    },
    {
      id: '4-10',
      phase: 4,
      text: 'Final electrical inspection',
      detail: `Complete all electrical outlets, switches, fixtures, panels, and equipment. Schedule final electrical inspection after all devices are installed.`,
    },
    {
      id: '4-11',
      phase: 4,
      text: 'Final plumbing inspection',
      detail: `Install all plumbing fixtures (sinks, toilets, showers, water heater). Schedule final plumbing inspection to verify proper operation and code compliance.`,
    },
    {
      id: '4-12',
      phase: 4,
      text: 'Address any correction notices',
      detail: `Resolve all inspection correction notices from ${city}'s building department. Re-inspect as needed. Common corrections include missing fire caulk, smoke detector placement, and egress issues.`,
    },
    {
      id: '4-13',
      phase: 4,
      text: 'Final building inspection',
      detail: `Schedule comprehensive final building inspection covering all trades. This is the last major inspection before receiving your Certificate of Occupancy.`,
    },

    // ── Phase 5: Post-Construction & Occupancy (9 items) ──
    {
      id: '5-1',
      phase: 5,
      text: 'Receive Certificate of Occupancy (C of O)',
      detail: `Obtain the Certificate of Occupancy from ${city}'s building department. Your ${aduType} is now legally habitable. Display the C of O prominently.`,
      legalRef: 'CBC §111',
    },
    {
      id: '5-2',
      phase: 5,
      text: 'Register the ADU with the county assessor',
      detail: `File a change of ownership or new construction form with the county assessor. ${aduType === 'Garage Conversion' ? 'Conversions may trigger reassessment at a lower rate.' : 'New construction will trigger reassessment of the ADU value only.'}`,
      legalRef: 'Rev & Tax Code §62',
    },
    {
      id: '5-3',
      phase: 5,
      text: 'Set up separate utility accounts',
      detail: `Establish separate or sub-metered utility connections (water, electric, gas) for the ${aduType}. Contact PG&E, local water, and waste management providers.`,
    },
    {
      id: '5-4',
      phase: 5,
      text: 'Update property insurance',
      detail: `Notify your homeowner\'s insurance carrier about the new ${aduType}. Ensure adequate dwelling coverage and liability protection for the additional unit.`,
    },
    {
      id: '5-5',
      phase: 5,
      text: 'Register as a rental property (if applicable)',
      detail: `If renting out the ${aduType}, register with ${city}'s rental registry program if one exists. Comply with local rent control and just-cause eviction ordinances.`,
      legalRef: 'AB 1482 (2019)',
    },
    {
      id: '5-6',
      phase: 5,
      text: 'Verify owner-occupancy compliance',
      detail: `State law prohibits owner-occupancy requirements for ADUs permitted after Jan 1, 2020. ${aduType === 'JADU' ? 'Note: JADUs still require owner-occupancy — you must live in either the primary residence or the JADU.' : 'You are not required to live on the property.'}`,
      legalRef: 'Gov Code §65852.2(e)(2)',
    },
    {
      id: '5-7',
      phase: 5,
      text: 'Complete final landscaping and site cleanup',
      detail: `Finish exterior landscaping, install any required drainage, complete site cleanup, and ensure all temporary construction fencing and materials are removed.`,
    },
    {
      id: '5-8',
      phase: 5,
      text: 'Document and organize all project records',
      detail: `Compile and organize all permits, plans, inspection records, warranties, and contractor documentation in a secure location for future reference.`,
    },
    {
      id: '5-9',
      phase: 5,
      text: 'Schedule annual maintenance',
      detail: `Set up a maintenance schedule for the ${aduType} including HVAC service, water heater inspection, gutter cleaning, and fire safety system checks.`,
    },
  ];
}

// ── Component ───────────────────────────────────────────────────────────────

export function CitySpecificChecklist() {
  const [selectedCity, setSelectedCity] = useState<string>(COVERED_CITIES[0].name);
  const [aduType, setAduType] = useState<AduType>('Detached ADU');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const items = useMemo(
    () => buildChecklist(selectedCity, aduType),
    [selectedCity, aduType]
  );

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const reset = () => setChecked(new Set());

  const progress = items.length > 0 ? Math.round((checked.size / items.length) * 100) : 0;
  const totalItems = items.length;
  const totalPhases = PHASES.length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Select value={selectedCity} onValueChange={(v) => { setSelectedCity(v); setChecked(new Set()); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {COVERED_CITIES.map((city) => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name} ({city.county})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select value={aduType} onValueChange={(v: AduType) => { setAduType(v); setChecked(new Set()); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="ADU type" />
            </SelectTrigger>
            <SelectContent>
              {ADU_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-sm">Permit Progress</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {checked.size}/{totalItems}
            </span>
            <Badge variant="outline" className="text-xs font-medium">
              {progress}%
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
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </Card>

      {/* Phase Groups */}
      <div className="space-y-8">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          const phaseItems = items.filter((item) => item.phase === phase.number);
          const phaseChecked = phaseItems.filter((item) => checked.has(item.id)).length;
          const phaseProgress =
            phaseItems.length > 0 ? Math.round((phaseChecked / phaseItems.length) * 100) : 0;

          return (
            <div key={phase.number}>
              {/* Phase Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-amber-500/10 p-2 shrink-0">
                  <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Phase {phase.number}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{phase.title}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {phase.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {phaseChecked}/{phaseItems.length}
                  </span>
                  {phaseProgress === 100 && phaseChecked > 0 ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    >
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      {phaseProgress}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Phase Items */}
              <div className="space-y-2 pl-2">
                {phaseItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                        checked.has(item.id)
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={checked.has(item.id)}
                        onCheckedChange={() => toggle(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium leading-snug ${
                              checked.has(item.id)
                                ? 'line-through text-muted-foreground'
                                : ''
                            }`}
                          >
                            {item.text}
                          </p>
                          {item.legalRef && (
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0 text-blue-600 dark:text-blue-400 border-blue-500/30 whitespace-nowrap"
                            >
                              <BookOpen className="h-2.5 w-2.5 mr-0.5" />
                              {item.legalRef}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    </label>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-4 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">{selectedCity}</span>
            <span>·</span>
            <span className="font-medium">{aduType}</span>
            <span>·</span>
            <span>
              {totalItems} items across {totalPhases} phases
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{progress}% complete</span>
            {progress === 100 && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-[10px]">
                All Done! 🎉
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Legal References */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h4 className="font-semibold text-sm">Legal References</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { code: 'Gov Code §65852.2', title: 'State ADU Standards', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2' },
            { code: 'Gov Code §65852.1', title: 'JADU Standards', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.1' },
            { code: 'SB 897 (2023)', title: 'ADU Streamlining', url: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240SB897' },
            { code: 'AB 2221 (2023)', title: 'Expanded ADU Rights', url: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB2221' },
            { code: 'AB 1482 (2019)', title: 'Tenant Protection Act', url: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=201920200AB1482' },
            { code: 'Title 24, Part 6', title: 'Energy Efficiency Standards', url: 'https://www.energy.ca.gov/title-24' },
          ].map((ref) => (
            <a
              key={ref.code}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors p-1.5 rounded hover:bg-muted/50"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="font-medium">{ref.code}</span>
              <span>— {ref.title}</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
