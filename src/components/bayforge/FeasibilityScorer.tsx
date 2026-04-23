'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

interface Note {
  icon: string;
  label: string;
  detail: string;
  color: string;
}

export function FeasibilityScorer() {
  const [lotW, setLotW] = useState(50);
  const [lotD, setLotD] = useState(100);
  const [zone, setZone] = useState('R-1');
  const [transit, setTransit] = useState(false);
  const [garage, setGarage] = useState(false);
  const [vhfhsz, setVhfhsz] = useState(false);
  const [coastal, setCoastal] = useState(false);
  const [historic, setHistoric] = useState(false);
  const [hoa, setHoa] = useState(false);

  const result = useMemo(() => {
    const lotSF = lotW * lotD;
    let score = 50;
    const notes: Note[] = [];
    const warnings: string[] = [];

    if (lotSF >= 8000) {
      score += 25;
      notes.push({ icon: '✓', label: 'Large lot', detail: 'Full 1,200 sq ft ADU', color: 'text-emerald-600 dark:text-emerald-400' });
    } else if (lotSF >= 5000) {
      score += 15;
      notes.push({ icon: '✓', label: 'Adequate lot', detail: 'Up to 1,000 sq ft ADU', color: 'text-emerald-600 dark:text-emerald-400' });
    } else if (lotSF >= 3000) {
      score += 5;
      notes.push({ icon: '!', label: 'Small lot', detail: '~800 sq ft minimum', color: 'text-amber-600 dark:text-amber-400' });
    } else {
      score -= 10;
      notes.push({ icon: 'x', label: 'Very small lot', detail: 'Consider JADU only', color: 'text-red-600 dark:text-red-400' });
    }

    if (transit) {
      score += 15;
      notes.push({ icon: '✓', label: 'Transit exempt', detail: 'No parking required', color: 'text-emerald-600 dark:text-emerald-400' });
    } else {
      notes.push({ icon: 'i', label: 'Parking required', detail: 'One space per ADU', color: 'text-sky-600 dark:text-sky-400' });
    }

    if (garage) {
      score += 10;
      notes.push({ icon: '✓', label: 'Garage path', detail: 'By-right, no setbacks', color: 'text-emerald-600 dark:text-emerald-400' });
    }

    if (vhfhsz) { score -= 20; warnings.push('VHFHSZ — Class A roof, sprinklers, defensible space (+$15K-$40K)'); }
    if (coastal) { score -= 25; warnings.push('Coastal Zone — CDP required, adds 3-12 months and $3K-$8K'); }
    if (historic) { score -= 10; warnings.push('Historic district — design review required'); }
    if (hoa) { score -= 5; warnings.push('HOA — cannot legally prohibit; CC&R review may apply'); }

    if (zone === 'R-2' || zone === 'R-3') {
      score += 10;
      notes.push({ icon: '✓', label: 'Multi-family', detail: 'Multiple ADUs eligible', color: 'text-emerald-600 dark:text-emerald-400' });
    }

    score = Math.max(0, Math.min(100, score));
    const maxAdu = lotSF >= 8000 ? 1200 : lotSF >= 5000 ? 1000 : 800;
    const label = score >= 70 ? 'High Feasibility' : score >= 45 ? 'Moderate — Review Required' : 'Low — Significant Barriers';
    const color = score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : score >= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
    const bgColor = score >= 70 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-red-500';
    const circumference = 2 * Math.PI * 70;
    const filled = circumference * (score / 100);

    return { score, label, color, bgColor, circumference, filled, maxAdu, lotSF, notes, warnings };
  }, [lotW, lotD, zone, transit, garage, vhfhsz, coastal, historic, hoa]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left - Input Form */}
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Lot Dimensions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lot-w" className="text-xs text-muted-foreground">Width (ft)</Label>
              <Input id="lot-w" type="number" value={lotW} onChange={(e) => setLotW(Number(e.target.value))} min={10} max={500} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="lot-d" className="text-xs text-muted-foreground">Depth (ft)</Label>
              <Input id="lot-d" type="number" value={lotD} onChange={(e) => setLotD(Number(e.target.value))} min={10} max={500} className="mt-1" />
            </div>
          </div>
          <Card className="mt-3 p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground">Calculated Area</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.lotSF.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">sq ft</span></p>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Site Conditions</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Zoning</Label>
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="R-1">R-1 Single Family</SelectItem>
                  <SelectItem value="R-2">R-2 Duplex</SelectItem>
                  <SelectItem value="R-3">R-3 Multi-Family</SelectItem>
                  <SelectItem value="MX">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {[
              { label: 'Within 0.5 mi of major transit?', checked: transit, setter: setTransit },
              { label: 'Existing detached garage?', checked: garage, setter: setGarage },
              { label: 'Very High Fire Hazard Zone (VHFHSZ)?', checked: vhfhsz, setter: setVhfhsz },
              { label: 'California Coastal Zone?', checked: coastal, setter: setCoastal },
              { label: 'Historic District?', checked: historic, setter: setHistoric },
              { label: 'HOA community?', checked: hoa, setter: setHoa },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor={item.label} className="text-sm cursor-pointer">{item.label}</Label>
                <Switch id={item.label} checked={item.checked} onCheckedChange={item.setter} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Results */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Feasibility Report
        </h3>

        {/* Score Ring */}
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <svg width="170" height="170" viewBox="0 0 170 170" className="mb-3">
              <circle cx="85" cy="85" r="70" fill="none" className="stroke-muted" strokeWidth="11" />
              <circle
                cx="85" cy="85" r="70" fill="none"
                className={result.bgColor}
                strokeWidth="11" strokeLinecap="round"
                strokeDasharray={`${result.filled} ${result.circumference}`}
                strokeDashoffset={result.circumference / 4}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              <text x="85" y="79" textAnchor="middle" className="fill-foreground" fontSize="36" fontWeight="800" fontFamily="var(--font-sans)">{result.score}</text>
              <text x="85" y="99" textAnchor="middle" className="fill-muted-foreground" fontSize="12" fontFamily="var(--font-sans)">out of 100</text>
            </svg>
            <p className={`font-bold text-lg ${result.color}`}>{result.label}</p>
          </div>
        </Card>

        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground">Estimated max ADU size</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{result.maxAdu.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">sq ft</span></p>
        </Card>

        {/* Notes */}
        {result.notes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Notes</p>
            <div className="space-y-2">
              {result.notes.map((note) => (
                <motion.div
                  key={note.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2.5 rounded-lg border bg-card p-3"
                  style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--border)' }}
                >
                  <span className={`text-sm font-bold min-w-[16px] ${note.color}`}>{note.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{note.label}</p>
                    <p className="text-xs text-muted-foreground">{note.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Barriers</p>
            <div className="space-y-2">
              {result.warnings.map((warning) => (
                <motion.div
                  key={warning}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{warning}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
