'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  ClipboardCheck,
  FileText,
  MapPin,
  Scale,
  CreditCard,
  Hammer,
  Building2,
  Shield,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  detail: string;
  phase: string;
  link?: string;
}

const CHECKLIST: ChecklistItem[] = [
  // Pre-Design Phase
  { id: 'c1', text: 'Identify your property zone', detail: 'Check your parcel on the city zoning map to confirm R-1, R-2, or mixed-use designation.', phase: 'Pre-Design' },
  { id: 'c2', text: 'Review city ADU ordinance', detail: 'Read your city\'s specific ADU regulations — each city has unique setback, height, and lot coverage rules.', phase: 'Pre-Design' },
  { id: 'c3', text: 'Check for overlay districts', detail: 'Verify if your property is in a Historic District, Coastal Zone, VHFHSZ, or flood zone.', phase: 'Pre-Design' },
  { id: 'c4', text: 'Determine ADU type', detail: 'Choose between: Detached ADU, Attached ADU, Garage Conversion, or JADU (Junior ADU). Each has different rules.', phase: 'Pre-Design' },
  { id: 'c5', text: 'Verify utility capacity', detail: 'Confirm water, sewer, and electrical service can accommodate an additional dwelling unit.', phase: 'Pre-Design' },

  // Design Phase
  { id: 'c6', text: 'Hire a licensed architect/designer', detail: 'Get stamped plans from a licensed professional. Some cities offer pre-approved ADU plans.', phase: 'Design' },
  { id: 'c7', text: 'Create floor plans & elevations', detail: 'Develop complete architectural drawings showing floor plans, building elevations, and site plan.', phase: 'Design' },
  { id: 'c8', text: 'Meet objective design standards', detail: 'Ensure exterior materials, roof pitch, and fenestration comply with city design guidelines.', phase: 'Design' },
  { id: 'c9', text: 'Calculate parking requirements', detail: 'Determine if parking is required. Often waived within 0.5 miles of transit or for garage conversions.', phase: 'Design' },
  { id: 'c10', text: 'Energy compliance (Title 24)', detail: 'Meet California energy code. ADUs under 750 sq ft may qualify for simplified compliance.', phase: 'Design' },

  // Permitting Phase
  { id: 'c11', text: 'Submit ADU permit application', detail: 'File with your city planning/building department. ADUs get ministerial (by-right) approval within 60 days.', phase: 'Permitting' },
  { id: 'c12', text: 'Pay impact fees', detail: 'ADU impact fees are capped by state law. Many cities waive fees for ADUs under 750 sq ft. Check local fee schedule.', phase: 'Permitting' },
  { id: 'c13', text: 'Get plan check approval', detail: 'City reviews plans for code compliance. Ministerial review = no discretionary hearing required.', phase: 'Permitting' },
  { id: 'c14', text: 'Obtain building permit', detail: 'Receive permit to begin construction. Must be issued within 60 days for ministerial ADU applications.', phase: 'Permitting' },

  // Construction Phase
  { id: 'c15', text: 'Schedule foundation work', detail: 'Prepare site and pour foundation. Consider existing utility locations and property line setbacks.', phase: 'Construction' },
  { id: 'c16', text: 'Framing & rough-in', detail: 'Frame structure and install rough plumbing, electrical, and HVAC. Schedule inspections at each stage.', phase: 'Construction' },
  { id: 'c17', text: 'Fire & life safety compliance', detail: 'Install smoke detectors, CO alarms, fire sprinklers (if required), and ensure proper egress windows.', phase: 'Construction' },
  { id: 'c18', text: 'Final inspections', detail: 'Schedule final building, electrical, and plumbing inspections. Address any correction notices.', phase: 'Construction' },

  // Post-Construction
  { id: 'c19', text: 'Receive certificate of occupancy', detail: 'Get final sign-off from building department. Your ADU is now legally habitable.', phase: 'Post-Construction' },
  { id: 'c20', text: 'Register ADU with county assessor', detail: 'Update property records. ADUs may affect property taxes (new construction only, not conversions).', phase: 'Post-Construction' },
  { id: 'c21', text: 'Set up utility accounts', detail: 'Establish separate utility connections (water, electric, gas) for the ADU unit.', phase: 'Post-Construction' },
  { id: 'c22', text: 'Owner-occupancy compliance', detail: 'Remember: State law prohibits owner-occupancy requirements for ADUs built after Jan 1, 2020.', phase: 'Post-Construction' },
];

const PHASES = ['Pre-Design', 'Design', 'Permitting', 'Construction', 'Post-Construction'];
const PHASE_ICONS: Record<string, React.ElementType> = {
  'Pre-Design': MapPin,
  'Design': FileText,
  'Permitting': Scale,
  'Construction': Hammer,
  'Post-Construction': CheckCircle2,
};

export function PermitChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const reset = () => setChecked(new Set());

  const progress = Math.round((checked.size / CHECKLIST.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold">ADU Permit Progress</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{checked.size}/{CHECKLIST.length}</span>
            <Badge variant="outline" className="text-xs">{progress}%</Badge>
            <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs text-muted-foreground">
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
          const Icon = PHASE_ICONS[phase];
          const items = CHECKLIST.filter((c) => c.phase === phase);
          const done = items.filter((c) => checked.has(c.id)).length;

          return (
            <div key={phase}>
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{phase}</h3>
                  <p className="text-[11px] text-muted-foreground">{done}/{items.length} completed</p>
                </div>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>

              <div className="space-y-2 pl-2">
                {items.map((item) => (
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
                        <p className={`text-sm font-medium leading-snug ${checked.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                          {item.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
                      </div>
                    </label>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
