'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Search, ExternalLink, AlertTriangle } from 'lucide-react';
import { ADU_COMPANIES, ALL_COMPANY_TAGS } from '@/store/ai-store';

export function AduCompanies() {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All Regions');

  const filtered = useMemo(() => {
    return ADU_COMPANIES.filter((c) => {
      const matchesSearch = search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.specialty.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchesTag = tagFilter === 'All' || c.tags.includes(tagFilter);
      const matchesRegion = regionFilter === 'All Regions' || c.region === regionFilter;
      return matchesSearch && matchesTag && matchesRegion;
    });
  }, [search, tagFilter, regionFilter]);

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Disclaimer:</strong> This directory is for informational purposes only. BayForge AI does not endorse, recommend, or have any financial relationship with any company listed. Always perform your own due diligence, check licenses at{' '}
            <strong className="text-amber-600 dark:text-amber-400">CSLB.ca.gov</strong>, and obtain multiple bids before hiring.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Specialties</SelectItem>
            {ALL_COMPANY_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Regions">All Regions</SelectItem>
            <SelectItem value="Bay Area">Bay Area</SelectItem>
            <SelectItem value="SoCal">SoCal</SelectItem>
            <SelectItem value="Statewide">Statewide</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} companies found</p>

      {/* Company Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((company) => (
            <motion.div
              key={company.name}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 h-full hover:shadow-lg transition-shadow duration-300 group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-1.5">
                      {company.name}
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-muted-foreground">{company.specialty}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{company.founded}</Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{company.description}</p>

                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-medium text-amber-600 dark:text-amber-400">{company.priceRange}</span>
                  <Badge variant="secondary" className="text-[10px]">{company.region}</Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {company.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>

                <a
                  href={`https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                >
                  {company.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>No companies found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
