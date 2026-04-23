'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Check,
  X,
  Factory,
  AlertTriangle,
  ArrowUpDown,
  Info,
  Leaf,
  Star,
  Zap,
  Shield,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

type EcoRating = 'Standard' | 'Good' | 'LEED Platinum' | 'Passive' | 'Excellent';

interface PrefabCompany {
  name: string;
  price: string;
  priceSort: number;
  deliveryTime: string;
  deliverySort: number;
  bayArea: boolean;
  factoryLocation: string;
  ecoRating: EcoRating;
  smartHome: boolean;
  fireRated: boolean;
  fixedPrice: boolean;
  bestFor: string;
  website: string;
}

// ── Data ────────────────────────────────────────────────────────────────────

const PREFAB_COMPANIES: PrefabCompany[] = [
  {
    name: 'Abodu',
    price: '$250K–$450K',
    priceSort: 350,
    deliveryTime: '6–10 months',
    deliverySort: 8,
    bayArea: true,
    factoryLocation: 'Redwood City, CA',
    ecoRating: 'Good',
    smartHome: true,
    fireRated: true,
    fixedPrice: true,
    bestFor: 'Pre-permitted, fast install',
    website: 'https://abodu.com',
  },
  {
    name: 'Plant Prefab',
    price: '$220K–$500K',
    priceSort: 360,
    deliveryTime: '8–14 months',
    deliverySort: 11,
    bayArea: false,
    factoryLocation: 'Rialto, CA',
    ecoRating: 'LEED Platinum',
    smartHome: false,
    fireRated: true,
    fixedPrice: true,
    bestFor: 'Sustainable, custom design',
    website: 'https://plantprefab.com',
  },
  {
    name: 'Dvele',
    price: '$300K–$600K',
    priceSort: 450,
    deliveryTime: '8–12 months',
    deliverySort: 10,
    bayArea: false,
    factoryLocation: 'Fontana, CA',
    ecoRating: 'Passive',
    smartHome: true,
    fireRated: true,
    fixedPrice: true,
    bestFor: 'Smart homes, net-zero',
    website: 'https://dvele.com',
  },
  {
    name: 'Perpetual Homes',
    price: '$195K–$375K',
    priceSort: 285,
    deliveryTime: '4–8 months',
    deliverySort: 6,
    bayArea: true,
    factoryLocation: 'Oakland, CA',
    ecoRating: 'Good',
    smartHome: false,
    fireRated: false,
    fixedPrice: true,
    bestFor: 'Fast delivery, fixed price',
    website: 'https://perpetualhomes.com',
  },
  {
    name: 'H2 Prefab',
    price: '$200K–$400K',
    priceSort: 300,
    deliveryTime: '5–9 months',
    deliverySort: 7,
    bayArea: true,
    factoryLocation: 'San Leandro, CA',
    ecoRating: 'Excellent',
    smartHome: true,
    fireRated: true,
    fixedPrice: false,
    bestFor: 'Eco-friendly, Bay Area',
    website: 'https://h2prefab.com',
  },
  {
    name: 'Wellmade',
    price: '$210K–$400K',
    priceSort: 305,
    deliveryTime: '6–10 months',
    deliverySort: 8,
    bayArea: true,
    factoryLocation: 'Oakland, CA',
    ecoRating: 'Good',
    smartHome: false,
    fireRated: false,
    fixedPrice: true,
    bestFor: 'Modern design, panelized',
    website: 'https://wellmade.com',
  },
  {
    name: 'S2A Modular',
    price: '$180K–$380K',
    priceSort: 280,
    deliveryTime: '6–12 months',
    deliverySort: 9,
    bayArea: false,
    factoryLocation: 'Perris, CA',
    ecoRating: 'Standard',
    smartHome: false,
    fireRated: true,
    fixedPrice: false,
    bestFor: 'Budget-friendly, modular',
    website: 'https://s2amodular.com',
  },
  {
    name: 'Mighty Buildings',
    price: '$200K–$450K',
    priceSort: 325,
    deliveryTime: '4–8 months',
    deliverySort: 6,
    bayArea: true,
    factoryLocation: 'Oakland, CA',
    ecoRating: 'Excellent',
    smartHome: true,
    fireRated: true,
    fixedPrice: true,
    bestFor: '3D-printed, innovative',
    website: 'https://mightybuildings.com',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getEcoRatingStyle(rating: EcoRating): string {
  const styles: Record<EcoRating, string> = {
    'LEED Platinum': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    'Passive': 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    'Excellent': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
    'Good': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    'Standard': 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30',
  };
  return styles[rating] || '';
}

function getEcoRatingIcon(rating: EcoRating): React.ReactNode {
  if (rating === 'LEED Platinum') return <Leaf className="h-3 w-3" />;
  if (rating === 'Passive') return <Shield className="h-3 w-3" />;
  if (rating === 'Excellent' || rating === 'Good') return <Star className="h-3 w-3" />;
  return <Info className="h-3 w-3" />;
}

type SortField = 'name' | 'price' | 'deliveryTime' | 'ecoRating' | 'bayArea';

function sortCompanies(
  companies: PrefabCompany[],
  field: SortField,
  direction: 'asc' | 'desc'
): PrefabCompany[] {
  return [...companies].sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.priceSort - b.priceSort;
        break;
      case 'deliveryTime':
        comparison = a.deliverySort - b.deliverySort;
        break;
      case 'ecoRating': {
        const ratingOrder: EcoRating[] = ['Standard', 'Good', 'Excellent', 'Passive', 'LEED Platinum'];
        comparison = ratingOrder.indexOf(a.ecoRating) - ratingOrder.indexOf(b.ecoRating);
        break;
      }
      case 'bayArea':
        comparison = (a.bayArea === b.bayArea ? 0 : a.bayArea ? -1 : 1);
        break;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
}

// ── Component ───────────────────────────────────────────────────────────────

export function PrefabComparison() {
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sorted = sortCompanies(PREFAB_COMPANIES, sortField, sortDirection);

  const bayAreaCount = PREFAB_COMPANIES.filter((c) => c.bayArea).length;
  const avgPriceLow = Math.round(
    PREFAB_COMPANIES.reduce((acc, c) => acc + c.priceSort - 100, 0) / PREFAB_COMPANIES.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Factory className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Prefab ADU Comparison
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Side-by-side comparison of {PREFAB_COMPANIES.length} California prefab manufacturers
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Companies', value: PREFAB_COMPANIES.length.toString(), icon: Factory },
          { label: 'Bay Area Based', value: bayAreaCount.toString(), icon: Zap },
          { label: 'Starting From', value: `$${avgPriceLow}K`, icon: Star },
          { label: 'Fire Rated', value: PREFAB_COMPANIES.filter((c) => c.fireRated).length.toString(), icon: Shield },
        ].map((stat) => (
          <Card key={stat.label} className="p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-amber-500/10 p-1.5">
                <stat.icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead
                  className="text-xs font-semibold cursor-pointer select-none"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Company
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs font-semibold cursor-pointer select-none"
                  onClick={() => toggleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    Price
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs font-semibold cursor-pointer select-none"
                  onClick={() => toggleSort('deliveryTime')}
                >
                  <div className="flex items-center gap-1">
                    Delivery
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs font-semibold cursor-pointer select-none"
                  onClick={() => toggleSort('bayArea')}
                >
                  <div className="flex items-center gap-1">
                    Bay Area
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold hidden lg:table-cell">Factory</TableHead>
                <TableHead
                  className="text-xs font-semibold cursor-pointer select-none"
                  onClick={() => toggleSort('ecoRating')}
                >
                  <div className="flex items-center gap-1">
                    Eco
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">Smart</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">Fire</TableHead>
                <TableHead className="text-xs font-semibold hidden sm:table-cell">Fixed $</TableHead>
                <TableHead className="text-xs font-semibold">Best For</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((company, index) => (
                <motion.tr
                  key={company.name}
                  className="border-b transition-colors hover:bg-muted/50 group"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                >
                  <TableCell className="py-3">
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      {company.name}
                    </a>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {company.price}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">{company.deliveryTime}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    {company.bayArea ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{company.factoryLocation}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 ${getEcoRatingStyle(company.ecoRating)}`}
                    >
                      {getEcoRatingIcon(company.ecoRating)}
                      {company.ecoRating}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    {company.smartHome ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    {company.fireRated ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </TableCell>
                  <TableCell className="py-3 hidden sm:table-cell">
                    {company.fixedPrice ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-xs text-muted-foreground">{company.bestFor}</span>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Disclaimer:</strong> Prices are approximate 2026 estimates and may vary based on location, size, finishes, site conditions, and permit fees. Contact each manufacturer directly for accurate quotes.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              BayForge AI does not endorse, recommend, or have any financial relationship with any company listed. Always perform your own due diligence before hiring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
