'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import { COVERED_CITIES } from '@/store/ai-store';

const cityNames = [...new Set(COVERED_CITIES.map(c => c.name))].sort();

interface Check {
  label: string;
  passed: boolean;
  detail: string;
}

export function PrefabChecker() {
  const [width, setWidth] = useState(20);
  const [length, setLength] = useState(40);
  const [height, setHeight] = useState(16);
  const [city, setCity] = useState('San Jose');
  const [rearYard, setRearYard] = useState(30);
  const [sideClearance, setSideClearance] = useState(8);
  const [transit, setTransit] = useState(false);

  const result = useMemo(() => {
    const floorArea = width * length;
    const maxHeight = transit ? 18 : 16;

    const checks: Check[] = [
      {
        label: 'Size limit (max 1,200 sq ft)',
        passed: floorArea <= 1200,
        detail: floorArea <= 1200 ? `${floorArea} sq ft — within limit` : `${floorArea} sq ft — exceeds maximum`,
      },
      {
        label: `Height limit (max ${maxHeight} ft)`,
        passed: height <= maxHeight,
        detail: height <= maxHeight ? `${height} ft — OK` : `${height} ft — exceeds limit`,
      },
      {
        label: 'Side clearance (min 4 ft)',
        passed: sideClearance >= 4,
        detail: sideClearance >= 4 ? `${sideClearance} ft available` : `Only ${sideClearance} ft — 4 ft required`,
      },
      {
        label: 'Rear yard + 4 ft setback',
        passed: rearYard >= length + 4,
        detail: rearYard >= length + 4
          ? `${rearYard} ft available — fits ${length} ft unit`
          : `Only ${rearYard} ft — need ${length + 4} ft`,
      },
    ];

    const allOk = checks.every(c => c.passed);
    return { floorArea, checks, allOk };
  }, [width, length, height, rearYard, sideClearance, transit]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left - Input Form */}
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Prefab Dimensions
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Width (ft)</Label>
              <Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={8} max={60} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Length (ft)</Label>
              <Input type="number" value={length} onChange={(e) => setLength(Number(e.target.value))} min={10} max={80} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Height (ft)</Label>
              <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={8} max={30} className="mt-1" />
            </div>
          </div>
          <Card className="mt-3 p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground">Floor Area</p>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{result.floorArea} <span className="text-sm font-normal text-muted-foreground">sq ft</span></p>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Lot Constraints</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cityNames.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Rear yard depth (ft)</Label>
                <Input type="number" value={rearYard} onChange={(e) => setRearYard(Number(e.target.value))} min={0} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Side clearance (ft)</Label>
                <Input type="number" value={sideClearance} onChange={(e) => setSideClearance(Number(e.target.value))} min={0} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="prefab-transit" className="text-sm cursor-pointer">Within 0.5 mi transit?</Label>
              <Switch id="prefab-transit" checked={transit} onCheckedChange={setTransit} />
            </div>
          </div>
        </div>
      </div>

      {/* Right - Results */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Compatibility Report
        </h3>

        <div className="space-y-2">
          {result.checks.map((check) => (
            <motion.div
              key={check.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-2.5 rounded-lg border bg-card p-3 ${
                check.passed
                  ? 'border-l-3 border-l-emerald-500'
                  : 'border-l-3 border-l-red-500'
              }`}
              style={{ borderLeftWidth: '3px', borderLeftColor: check.passed ? '#22c55e' : '#ef4444' }}
            >
              {check.passed ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              </div>
              <Badge variant={check.passed ? 'default' : 'destructive'} className="text-[10px] shrink-0">
                {check.passed ? 'PASS' : 'FAIL'}
              </Badge>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl p-6 text-center ${
            result.allOk
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          {result.allOk ? (
            <>
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">Compatible with {city}</p>
              <p className="text-sm text-muted-foreground mt-1">All checks passed. Verify with local planning department.</p>
            </>
          ) : (
            <>
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="font-bold text-red-600 dark:text-red-400 text-lg">Issues in {city}</p>
              <p className="text-sm text-muted-foreground mt-1">Adjust dimensions to resolve failed checks.</p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
