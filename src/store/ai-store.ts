import { create } from 'zustand';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  contextWindow: string;
  speed: 'fast' | 'medium' | 'slow';
  isFree: boolean;
  popular: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: number;
}

export interface CityInfo {
  name: string;
  county: string;
  region: string;
  chapters: number;
  hasJadu: boolean;
  hasPriority: boolean;
}

interface AIStore {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Most capable for complex ADU code analysis and multi-step zoning reasoning.',
    icon: '✨',
    color: 'from-emerald-500 to-teal-600',
    capabilities: ['Code Analysis', 'Reasoning', 'RAG', 'Multilingual'],
    contextWindow: '128K tokens',
    speed: 'medium',
    isFree: false,
    popular: true,
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Best-in-class for parsing complex zoning ordinances and legal documents.',
    icon: '🧠',
    color: 'from-orange-500 to-amber-600',
    capabilities: ['Legal Analysis', 'Long Context', 'Precision', 'Safety'],
    contextWindow: '200K tokens',
    speed: 'fast',
    isFree: false,
    popular: true,
  },
  {
    id: 'gemini-2.0',
    name: 'Gemini 2.0 Pro',
    provider: 'Google',
    description: 'Native document understanding for PDF zoning codes and site plans.',
    icon: '💎',
    color: 'from-blue-500 to-cyan-600',
    capabilities: ['Document AI', 'Vision', 'PDF Parsing', 'Code'],
    contextWindow: '1M tokens',
    speed: 'fast',
    isFree: true,
    popular: true,
  },
  {
    id: 'llama-3.1',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    description: 'Open-source model for self-hosted ADU compliance checking.',
    icon: '🦙',
    color: 'from-purple-500 to-violet-600',
    capabilities: ['Open Source', 'Self-Host', 'RAG', 'Customizable'],
    contextWindow: '128K tokens',
    speed: 'medium',
    isFree: true,
    popular: false,
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Cost-efficient model with strong code and regulation parsing capabilities.',
    icon: '🔍',
    color: 'from-rose-500 to-pink-600',
    capabilities: ['Regulation Parse', 'Cost Efficient', 'Code', 'Math'],
    contextWindow: '128K tokens',
    speed: 'fast',
    isFree: true,
    popular: true,
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large 2',
    provider: 'Mistral AI',
    description: 'Excellent multilingual support for California\'s diverse communities.',
    icon: '🌬️',
    color: 'from-sky-500 to-indigo-600',
    capabilities: ['Multilingual', 'Function Calling', 'JSON', 'Fast'],
    contextWindow: '128K tokens',
    speed: 'fast',
    isFree: false,
    popular: false,
  },
  {
    id: 'qwen-2.5',
    name: 'Qwen 2.5 Max',
    provider: 'Alibaba',
    description: 'Strong performance for Chinese and Asian language ADU inquiries.',
    icon: '🌏',
    color: 'from-red-500 to-orange-600',
    capabilities: ['Chinese', 'Multilingual', 'Analysis', 'Fast'],
    contextWindow: '128K tokens',
    speed: 'fast',
    isFree: true,
    popular: false,
  },
];

export const COVERED_CITIES: CityInfo[] = [
  { name: 'Los Angeles', county: 'Los Angeles', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: true },
  { name: 'San Francisco', county: 'San Francisco', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: true },
  { name: 'San Jose', county: 'Santa Clara', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'San Diego', county: 'San Diego', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: true },
  { name: 'Sacramento', county: 'Sacramento', region: 'Central Valley', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Oakland', county: 'Alameda', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: true },
  { name: 'Fresno', county: 'Fresno', region: 'Central Valley', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Long Beach', county: 'Los Angeles', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Bakersfield', county: 'Kern', region: 'Central Valley', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Anaheim', county: 'Orange', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Santa Ana', county: 'Orange', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Riverside', county: 'Riverside', region: 'Inland Empire', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Stockton', county: 'San Joaquin', region: 'Central Valley', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Irvine', county: 'Orange', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Chula Vista', county: 'San Diego', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Fremont', county: 'Alameda', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Santa Clarita', county: 'Los Angeles', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'San Bernardino', county: 'San Bernardino', region: 'Inland Empire', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Modesto', county: 'Stanislaus', region: 'Central Valley', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Pasadena', county: 'Los Angeles', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Palo Alto', county: 'Santa Clara', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Berkeley', county: 'Alameda', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Burbank', county: 'Los Angeles', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Glendale', county: 'Los Angeles', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Santa Cruz', county: 'Santa Cruz', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Ventura', county: 'Ventura', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Simi Valley', county: 'Ventura', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Thousand Oaks', county: 'Ventura', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Oxnard', county: 'Ventura', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Concord', county: 'Contra Costa', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Walnut Creek', county: 'Contra Costa', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Richmond', county: 'Contra Costa', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Daly City', county: 'San Mateo', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'San Mateo', county: 'San Mateo', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Redwood City', county: 'San Mateo', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Mountain View', county: 'Santa Clara', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Sunnyvale', county: 'Santa Clara', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Cupertino', county: 'Santa Clara', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Santa Clara', county: 'Santa Clara', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Sunnyvale', county: 'Santa Clara', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Hayward', county: 'Alameda', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Cupertino', county: 'Santa Clara', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Napa', county: 'Napa', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Petaluma', county: 'Sonoma', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Santa Rosa', county: 'Sonoma', region: 'Bay Area', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Visalia', county: 'Tulare', region: 'Central Valley', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Clovis', county: 'Fresno', region: 'Central Valley', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Huntington Beach', county: 'Orange', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Garden Grove', county: 'Orange', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Fullerton', county: 'Orange', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Costa Mesa', county: 'Orange', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Newport Beach', county: 'Orange', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Carlsbad', county: 'San Diego', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Encinitas', county: 'San Diego', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Escondido', county: 'San Diego', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Oceanside', county: 'San Diego', region: 'Southern CA', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Ontario', county: 'San Bernardino', region: 'Inland Empire', chapters: 12, hasJadu: true, hasPriority: false },
  { name: 'Rancho Cucamonga', county: 'San Bernardino', region: 'Inland Empire', chapters: 12, hasJadu: true, hasPriority: false },
];

export const REGIONS = [...new Set(COVERED_CITIES.map(c => c.region))];

export const LEGAL_REFS = [
  { code: 'Gov. Code §65852.2', title: 'State ADU Standards', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2' },
  { code: 'AB 2221 (2023)', title: 'Expanded ADU Rights', url: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB2221' },
  { code: 'SB 897 (2023)', title: 'ADU Streamlining', url: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240SB897' },
  { code: 'Gov. Code §65852.1', title: 'JADU Standards', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.1' },
  { code: 'HCD ADU Handbook', title: 'ADU Technical Guide', url: 'https://www.hcd.ca.gov/policy-research/planning/adu/' },
];

export interface AduCompany {
  name: string;
  region: string;
  specialty: string;
  founded: string;
  website: string;
  priceRange: string;
  description: string;
  tags: string[];
}

export const ADU_COMPANIES: AduCompany[] = [
  { name: 'Abodu', region: 'Bay Area', specialty: 'Prefab / Turnkey ADU', founded: '2018', website: 'abodu.com', priceRange: '$250K–$450K', description: 'Award-winning all-in-one ADU service. Handles permits, construction, and installation. Pre-permitted designs approved in 40+ CA cities.', tags: ['Prefab', 'Bay Area', 'Pre-permitted'] },
  { name: 'Cover Build', region: 'SoCal', specialty: 'Custom Prefab ADU', founded: '2015', website: 'cover.build', priceRange: '$250K–$500K', description: 'Technology-driven architecture studio using software to design and prefabricate fully custom ADUs with factory-built steel-frame panels.', tags: ['Prefab', 'SoCal', 'Custom Design'] },
  { name: 'Dvele', region: 'SoCal', specialty: 'Prefab / Smart Home ADU', founded: '2017', website: 'dvele.com', priceRange: '$300K–$600K', description: 'High-performance prefab homes with integrated smart home systems, energy monitoring, and passive-house standards. LEED-inspired.', tags: ['Prefab', 'SoCal', 'Smart Home'] },
  { name: 'Mighty Buildings', region: 'Bay Area', specialty: '3D-Printed ADUs', founded: '2017', website: 'mightybuildings.com', priceRange: '$200K–$450K', description: 'Pioneer in 3D-printed construction using proprietary composite material. CAL FIRE approved. Significant cost and time savings.', tags: ['3D Printed', 'Bay Area', 'Innovative'] },
  { name: 'Villa Homes', region: 'Bay Area', specialty: 'Full-Service / Turnkey', founded: '2019', website: 'villahomes.com', priceRange: '$200K–$400K', description: 'Streamlined full-service ADU company. Feasibility, design, permitting, and construction. Strong track record across 20+ cities.', tags: ['Turnkey', 'Bay Area', 'Full-Service'] },
  { name: 'United Dwelling', region: 'SoCal', specialty: 'Garage Conversion Specialist', founded: '2019', website: 'uniteddwelling.com', priceRange: '$150K–$280K', description: 'Converts existing garages into ADUs for free in exchange for affordable rental agreements. Social impact model.', tags: ['Garage Conversion', 'SoCal', 'Social Impact'] },
  { name: 'Otto ADU', region: 'Bay Area', specialty: 'ADU Design + Build', founded: '2020', website: 'ottoaduconstruction.com', priceRange: '$180K–$380K', description: 'Boutique contractor with strong expertise in hillside construction, VHFHSZ zones, and complex permitting.', tags: ['Design+Build', 'Bay Area', 'Hillside'] },
  { name: 'Acton ADU', region: 'Bay Area', specialty: 'ADU Consulting & Build', founded: '2016', website: 'actonadu.com', priceRange: '$160K–$350K', description: 'One of the earliest Bay Area ADU specialists. Deep expertise in Santa Clara County and San Jose.', tags: ['Consulting', 'Bay Area', 'Veteran'] },
  { name: 'Homestead Modern', region: 'Bay Area', specialty: 'Flat-Pack Prefab ADU', founded: '2020', website: 'homesteadmodern.com', priceRange: '$180K–$360K', description: 'Panelized construction with modern Scandinavian-inspired design. Shorter build timelines.', tags: ['Prefab', 'Bay Area', 'Modern Design'] },
  { name: 'LA ADU Specialists', region: 'SoCal', specialty: 'Permits + Construction', founded: '2017', website: 'laaduspecs.com', priceRange: '$140K–$300K', description: 'High-volume Los Angeles contractor specializing in standard plan program approvals and garage conversions.', tags: ['Permits', 'SoCal', 'High Volume'] },
  { name: 'Cottage ADU', region: 'SoCal', specialty: 'Design + Build ADU', founded: '2018', website: 'cottageadu.com', priceRange: '$160K–$340K', description: 'San Diego design-build firm focused exclusively on ADUs. Strong track record with coastal and historic zones.', tags: ['Design+Build', 'SoCal', 'Coastal'] },
  { name: 'Maxable Space', region: 'Statewide', specialty: 'Education + Marketplace', founded: '2019', website: 'maxablespace.com', priceRange: 'Free / Varies', description: 'ADU education platform and contractor marketplace. Helps homeowners understand the process and connects them with vetted builders.', tags: ['Marketplace', 'Statewide', 'Education'] },
  { name: 'CalAtlantic Homes', region: 'Statewide', specialty: 'Production Builder ADU', founded: '2000', website: 'calatlantichomes.com', priceRange: '$200K–$450K', description: 'Large production builder with ADU programs for new tract developments. Good for new home buyers wanting ADU from day one.', tags: ['Production', 'Statewide'] },
  { name: 'Plus ADU', region: 'Bay Area', specialty: 'Licensed ADU Architect', founded: '2020', website: 'plusadu.com', priceRange: '$50K design only', description: 'Architecture firm specializing exclusively in ADU design. Provides stamped plans for most Bay Area and LA jurisdictions.', tags: ['Architecture', 'Bay Area', 'SoCal'] },
  { name: 'California ADU Company', region: 'Bay Area', specialty: 'End-to-End Platform', founded: '2018', website: 'californiaaduco.com', priceRange: '$180K–$400K', description: 'Full-service platform covering feasibility study, design, permit procurement, general contracting, and property management.', tags: ['Full-Service', 'Bay Area', 'Management'] },
];

export const ALL_COMPANY_TAGS = [...new Set(ADU_COMPANIES.flatMap(c => c.tags))].sort();

export const useAIStore = create<AIStore>((set) => ({
  selectedModel: AI_MODELS[0],
  setSelectedModel: (model) => set({ selectedModel: model }),
  selectedCity: '',
  setSelectedCity: (city) => set({ selectedCity: city }),
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  isChatOpen: false,
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  isTyping: false,
  setIsTyping: (typing) => set({ isTyping: typing }),
}));
