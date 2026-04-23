'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Landmark,
  Factory,
  Calculator,
  Palette,
  HardHat,
  LayoutGrid,
  ExternalLink,
  BookOpen,
  Search,
  Shield,
  Leaf,
  Building2,
  FileText,
  Hammer,
  Home,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface ResourceItem {
  title: string;
  description: string;
  url: string;
  badge: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  tags?: string[];
  priceRange?: string;
  region?: string;
}

interface ResourceSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  items: ResourceItem[];
}

// ── Data ────────────────────────────────────────────────────────────────────

const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    id: 'official',
    title: 'Official State Resources',
    icon: Landmark,
    description: 'Government and regulatory resources for California ADU development',
    items: [
      {
        title: 'HCD ADU Handbook 2026',
        description: 'The definitive technical guide published by the California Department of Housing and Community Development covering all ADU regulations, sizing standards, and best practices.',
        url: 'https://www.hcd.ca.gov/policy-research/planning/adu/',
        badge: 'Critical',
        badgeVariant: 'destructive',
      },
      {
        title: 'HCD ADU Policy Page',
        description: 'Official HCD policy page with the latest ADU regulations, legislative updates, and compliance guidance for all California jurisdictions.',
        url: 'https://www.hcd.ca.gov/policy-research/planning/adu/',
        badge: 'Official',
        badgeVariant: 'default',
      },
      {
        title: 'HCD Additional Resources',
        description: 'Supplementary resources from HCD including fact sheets, FAQ documents, webinars, and technical assistance contacts for ADU applicants.',
        url: 'https://www.hcd.ca.gov/policy-research/planning/adu/',
        badge: 'Official',
        badgeVariant: 'default',
      },
      {
        title: 'Casita Coalition Guidebooks',
        description: 'Comprehensive ADU guidebooks and educational materials from the Casita Coalition, a non-profit advocating for backyard housing solutions across California.',
        url: 'https://www.casitacoalition.org',
        badge: 'Non-Profit',
        badgeVariant: 'secondary',
      },
      {
        title: 'California Building Code Title 24',
        description: 'Full text of the California Building Standards Code including energy efficiency requirements, fire safety standards, and accessibility provisions for ADUs.',
        url: 'https://www.energy.ca.gov/title-24',
        badge: 'Official',
        badgeVariant: 'default',
      },
      {
        title: 'CAL FIRE FHSZ Viewer',
        description: 'California Department of Forestry and Fire Protection Very High Fire Hazard Severity Zone map viewer. Essential for properties in wildfire-prone areas.',
        url: 'https://osfm.fire.ca.gov',
        badge: 'Critical',
        badgeVariant: 'destructive',
      },
      {
        title: 'CSLB License Lookup',
        description: 'Contractors State License Board official license verification tool. Always verify your contractor\'s license status, classification, and disciplinary history.',
        url: 'https://www.cslb.ca.gov',
        badge: 'Critical',
        badgeVariant: 'destructive',
      },
    ],
  },
  {
    id: 'prefab',
    title: 'Top Prefab Manufacturers',
    icon: Factory,
    description: 'California ADU prefab companies with factory-built solutions',
    items: [
      {
        title: 'Abodu',
        description: 'Award-winning all-in-one prefab ADU service. Handles permits, construction, and installation. Pre-permitted designs approved in 40+ CA cities.',
        url: 'https://abodu.com',
        badge: 'Prefab',
        badgeVariant: 'secondary',
        priceRange: '$250K–$450K',
        region: 'Bay Area',
        tags: ['Pre-permitted', 'Turnkey', 'All-Inclusive'],
      },
      {
        title: 'Dvele',
        description: 'High-performance prefab homes with integrated smart home systems, energy monitoring, and passive-house standards. LEED-inspired construction.',
        url: 'https://dvele.com',
        badge: 'Prefab',
        badgeVariant: 'secondary',
        priceRange: '$300K–$600K',
        region: 'SoCal',
        tags: ['Smart Home', 'LEED', 'Net-Zero'],
      },
      {
        title: 'H2 Prefab',
        description: 'Sustainable prefab ADU builder focusing on eco-friendly materials and energy-efficient designs. Strong presence in the Bay Area market.',
        url: 'https://h2prefab.com',
        badge: 'Prefab',
        badgeVariant: 'secondary',
        priceRange: '$200K–$400K',
        region: 'Bay Area',
        tags: ['Eco-Friendly', 'Modern Design'],
      },
      {
        title: 'S2A Modular',
        description: 'Full-service modular construction company with factory-built ADU solutions. Specializes in multi-family and accessory dwelling unit developments.',
        url: 'https://s2amodular.com',
        badge: 'Prefab',
        badgeVariant: 'secondary',
        priceRange: '$180K–$380K',
        region: 'Statewide',
        tags: ['Modular', 'Multi-Family'],
      },
      {
        title: 'Plant Prefab',
        description: 'Precision-built prefab homes using sustainable materials. Offers a range of ADU models from studio to 2-bedroom configurations.',
        url: 'https://plantprefab.com',
        badge: 'Prefab',
        badgeVariant: 'secondary',
        priceRange: '$220K–$500K',
        region: 'SoCal',
        tags: ['Sustainable', 'Custom Design'],
      },
      {
        title: 'Perpetual Homes',
        description: 'Prefab ADU company with a focus on fast delivery times and fixed pricing. Offers a variety of floor plans and customization options.',
        url: 'https://perpetualhomes.com',
        badge: 'Prefab',
        badgeVariant: 'secondary',
        priceRange: '$195K–$375K',
        region: 'Bay Area',
        tags: ['Fixed Price', 'Fast Delivery'],
      },
      {
        title: 'Wellmade',
        description: 'Modern prefab ADU manufacturer with Scandinavian-inspired designs. Panelized construction enables shorter on-site build timelines.',
        url: 'https://wellmade.com',
        badge: 'Prefab',
        badgeVariant: 'secondary',
        priceRange: '$210K–$400K',
        region: 'Bay Area',
        tags: ['Modern Design', 'Panelized'],
      },
      {
        title: 'Mighty Buildings',
        description: 'Pioneer in 3D-printed construction using proprietary composite material. CAL FIRE approved. Significant cost and time savings over traditional builds.',
        url: 'https://mightybuildings.com',
        badge: 'Prefab',
        badgeVariant: 'secondary',
        priceRange: '$200K–$450K',
        region: 'Bay Area',
        tags: ['3D Printed', 'Innovative', 'CAL FIRE'],
      },
    ],
  },
  {
    id: 'calculators',
    title: 'Cost Calculators',
    icon: Calculator,
    description: 'Free online tools to estimate your ADU project costs',
    items: [
      {
        title: 'CA-ADU.com Calculator',
        description: 'Comprehensive ADU cost calculator with city-specific pricing data for California. Includes permit fees, construction costs, and financing estimates.',
        url: 'https://ca-adu.com/calculator',
        badge: 'Calculator',
        badgeVariant: 'outline',
        tags: ['Free', 'City-Specific'],
      },
      {
        title: 'ADU Accelerator',
        description: 'AI-powered ADU feasibility and cost estimation tool. Analyzes your property address and provides a detailed project cost breakdown.',
        url: 'https://aduaccelerator.com',
        badge: 'Calculator',
        badgeVariant: 'outline',
        tags: ['AI-Powered', 'Feasibility'],
      },
      {
        title: 'ADUscale',
        description: 'ROI-focused ADU calculator that helps estimate rental income potential, project costs, and payback period for your ADU investment.',
        url: 'https://aduscale.com',
        badge: 'Calculator',
        badgeVariant: 'outline',
        tags: ['ROI', 'Rental Income'],
      },
      {
        title: 'Abodu Instant Estimator',
        description: 'Quick pricing tool from Abodu that provides instant cost estimates for their prefab ADU models based on your location and preferences.',
        url: 'https://abodu.com/pricing',
        badge: 'Calculator',
        badgeVariant: 'outline',
        tags: ['Instant', 'Prefab'],
      },
    ],
  },
  {
    id: 'design',
    title: 'Design & Visualization Tools',
    icon: Palette,
    description: 'Plan, visualize, and customize your ADU design',
    items: [
      {
        title: 'Abodu Configurator',
        description: 'Interactive 3D configurator tool to customize Abodu ADU models. Select finishes, layouts, and options with real-time price updates.',
        url: 'https://abodu.com/configurator',
        badge: 'Tool',
        badgeVariant: 'outline',
        tags: ['3D', 'Interactive'],
      },
      {
        title: 'Perpetual Homes Plans',
        description: 'Browse pre-designed ADU floor plans from Perpetual Homes. Download plan sets and customize layouts to match your property requirements.',
        url: 'https://perpetualhomes.com/plans',
        badge: 'Tool',
        badgeVariant: 'outline',
        tags: ['Floor Plans', 'Free Downloads'],
      },
      {
        title: 'IMKAT 3D',
        description: 'Professional 3D visualization and rendering service for ADU projects. Helps homeowners and architects visualize the final build before construction.',
        url: 'https://imkat3d.com',
        badge: 'Tool',
        badgeVariant: 'outline',
        tags: ['3D Rendering', 'Professional'],
      },
      {
        title: 'Wellmade Gallery',
        description: 'Photo gallery and design inspiration from completed Wellmade ADU projects. Browse real installations to envision your own ADU build.',
        url: 'https://wellmade.com/gallery',
        badge: 'Tool',
        badgeVariant: 'outline',
        tags: ['Gallery', 'Inspiration'],
      },
    ],
  },
  {
    id: 'builders',
    title: 'Bay Area Local Builders',
    icon: HardHat,
    description: 'ADU design-build contractors serving the Bay Area',
    items: [
      {
        title: 'Acton ADU',
        description: 'One of the earliest Bay Area ADU specialists with deep expertise in Santa Clara County and San Jose. Consulting and full build services.',
        url: 'https://actonadu.com',
        badge: 'Builder',
        badgeVariant: 'secondary',
        region: 'South Bay',
        tags: ['Veteran', 'Consulting'],
      },
      {
        title: 'Otto ADU',
        description: 'Boutique contractor with strong expertise in hillside construction, VHFHSZ zones, and complex permitting throughout the Bay Area.',
        url: 'https://ottoaduconstruction.com',
        badge: 'Builder',
        badgeVariant: 'secondary',
        region: 'Bay Area Wide',
        tags: ['Hillside', 'VHFHSZ'],
      },
      {
        title: 'SF Planning ADU Resources',
        description: 'San Francisco Planning Department\'s official ADU resources page. Includes pre-approved plans, application guides, and fee schedules.',
        url: 'https://sfplanning.org/adu',
        badge: 'Official',
        badgeVariant: 'default',
        region: 'San Francisco',
        tags: ['Government', 'Pre-Approved'],
      },
      {
        title: 'Santa Clara County ADU Center',
        description: 'Santa Clara County\'s centralized ADU resource hub with permitting information, standard plan sets, and development impact fee details.',
        url: 'https://sccgov.org/adu',
        badge: 'Official',
        badgeVariant: 'default',
        region: 'South Bay',
        tags: ['Government', 'South Bay'],
      },
      {
        title: 'H2 Prefab',
        description: 'Sustainable prefab builder with a strong Bay Area presence. Offers factory-built ADU solutions with shorter construction timelines.',
        url: 'https://h2prefab.com',
        badge: 'Builder',
        badgeVariant: 'secondary',
        region: 'Bay Area',
        tags: ['Prefab', 'Eco-Friendly'],
      },
      {
        title: 'ADU Geek',
        description: 'ADU consulting and project management service. Helps homeowners navigate the entire ADU process from feasibility to final inspection.',
        url: 'https://adgeek.com',
        badge: 'Builder',
        badgeVariant: 'secondary',
        region: 'East Bay',
        tags: ['Consulting', 'Project Mgmt'],
      },
      {
        title: 'Alameda County ADU Info',
        description: 'Alameda County Planning Department ADU information page with guidelines, fee schedules, and application requirements for unincorporated areas.',
        url: 'https://acgov.org/adu',
        badge: 'Official',
        badgeVariant: 'default',
        region: 'East Bay',
        tags: ['Government', 'East Bay'],
      },
      {
        title: 'Marin County ADU Program',
        description: 'Marin County\'s ADU development program including pre-approved plan sets, density bonus information, and streamlined permitting.',
        url: 'https://marincounty.org/adu',
        badge: 'Official',
        badgeVariant: 'default',
        region: 'North Bay',
        tags: ['Government', 'North Bay'],
      },
    ],
  },
  {
    id: 'floorplans',
    title: 'Free Pre-Approved Floor Plans',
    icon: LayoutGrid,
    description: 'Download free pre-approved ADU plan sets ready for permit submission',
    items: [
      {
        title: 'Santa Cruz County Plans',
        description: 'Free pre-approved ADU floor plans from Santa Cruz County. Multiple layouts available for detached and attached ADU configurations.',
        url: 'https://santacruzcounty.ca.gov/adu-plans',
        badge: 'Free',
        badgeVariant: 'outline',
        tags: ['Pre-Approved', 'Multiple Layouts'],
      },
      {
        title: 'San Jose Standard Plans',
        description: 'City of San Jose\'s standard ADU plan sets available for free download. Streamlined review process for standard plan applicants.',
        url: 'https://sanjoseca.gov/adu-plans',
        badge: 'Free',
        badgeVariant: 'outline',
        tags: ['Pre-Approved', 'San Jose'],
      },
      {
        title: 'Maxable Space Plan Library',
        description: 'Extensive library of ADU floor plans from Maxable. Filter by size, style, and ADU type. Includes both free and premium plan sets.',
        url: 'https://maxablespace.com/plans',
        badge: 'Free',
        badgeVariant: 'outline',
        tags: ['Large Library', 'Filtered Search'],
      },
      {
        title: 'Concord Standard Plans',
        description: 'City of Concord\'s pre-approved ADU plan program. Free downloadable plan sets with expedited permitting for qualifying projects.',
        url: 'https://concordca.gov/adu-plans',
        badge: 'Free',
        badgeVariant: 'outline',
        tags: ['Pre-Approved', 'Contra Costa'],
      },
      {
        title: 'LADBS Standard Plans',
        description: 'Los Angeles Department of Building and Safety standard ADU plan sets. Widely used across Southern California jurisdictions.',
        url: 'https://ladbs.org/adu-plans',
        badge: 'Free',
        badgeVariant: 'outline',
        tags: ['Pre-Approved', 'LA County'],
      },
      {
        title: 'SnapADU Library',
        description: 'SnapADU\'s collection of pre-designed ADU plans optimized for California codes. Quick-turnaround plan sets available for purchase.',
        url: 'https://snapadu.com/plans',
        badge: 'Tool',
        badgeVariant: 'outline',
        tags: ['Pre-Designed', 'Quick Turn'],
      },
    ],
  },
];

const BADGE_STYLES: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  Official: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Non-Profit': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  Prefab: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  Calculator: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  Tool: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  Builder: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  Free: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
};

const SECTION_ICONS: Record<string, React.ElementType> = {
  official: Shield,
  prefab: Factory,
  calculators: Calculator,
  design: Palette,
  builders: HardHat,
  floorplans: LayoutGrid,
};

// ── Component ───────────────────────────────────────────────────────────────

export function ResourcesHub() {
  const [activeTab, setActiveTab] = useState('official');
  const [searchQuery, setSearchQuery] = useState('');

  const totalResources = RESOURCE_SECTIONS.reduce(
    (acc, section) => acc + section.items.length,
    0
  );

  const getFilteredItems = (section: ResourceSection): ResourceItem[] => {
    if (!searchQuery.trim()) return section.items;
    const q = searchQuery.toLowerCase();
    return section.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.toLowerCase().includes(q))
    );
  };

  const getFilteredCount = (): number => {
    if (!searchQuery.trim()) return totalResources;
    return RESOURCE_SECTIONS.reduce(
      (acc, section) => acc + getFilteredItems(section).length,
      0
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ADU Resources Hub
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalResources} curated resources across {RESOURCE_SECTIONS.length} categories
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background border-input ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Section Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1 bg-muted/50">
          {RESOURCE_SECTIONS.map((section) => {
            const Icon = SECTION_ICONS[section.id];
            const count = getFilteredItems(section).length;
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{section.title}</span>
                <span className="sm:hidden">{section.title.split(' ')[0]}</span>
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] h-4 min-w-4 px-1 flex items-center justify-center"
                >
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Section Content */}
          {RESOURCE_SECTIONS.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Section Header */}
                <div className="flex items-start gap-3 mb-4 mt-2">
                  <div className="rounded-lg bg-amber-500/10 p-2 shrink-0">
                    {(() => {
                      const SectionIcon = section.icon;
                      return <SectionIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{section.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Resource Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {getFilteredItems(section).map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.03 }}
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Card className="p-4 hover:shadow-md transition-all duration-200 group border-border/50 hover:border-amber-500/30 h-full">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm flex items-center gap-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                {item.title}
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </h4>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${BADGE_STYLES[item.badge] || ''}`}
                            >
                              {item.badge}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                            {item.description}
                          </p>

                          {/* Price & Region (prefab sections) */}
                          {item.priceRange && (
                            <div className="flex items-center gap-3 text-xs mb-2">
                              <span className="font-medium text-amber-600 dark:text-amber-400">
                                {item.priceRange}
                              </span>
                              {item.region && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {item.region}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px] text-muted-foreground"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card>
                      </a>
                    </motion.div>
                  ))}
                </div>

                {/* No Results */}
                {getFilteredItems(section).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No resources found matching &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
