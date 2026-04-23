'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  useAIStore,
  AI_MODELS,
  COVERED_CITIES,
  REGIONS,
  LEGAL_REFS,
  type AIModel,
} from '@/store/ai-store';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

import {
  Sun,
  Moon,
  Menu,
  MapPin,
  FileText,
  Bot,
  Clock,
  MessageSquareText,
  Scale,
  Workflow,
  BrainCircuit,
  FileBarChart,
  Languages,
  Building2,
  Landmark,
  FileDown,
  Github,
  Send,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Twitter,
  Linkedin,
  BookOpen,
  Search,
  Shield,
  Zap,
  CheckCircle,
  Hammer,
  AlertTriangle,
  GitBranch,
  Code,
  Database,
  Server,
  Settings,
  Terminal,
  Layers,
  FileCode,
  Cpu,
  Network,
  FolderTree,
  Laptop,
  Cloud,
  Globe,
  FolderOpen,
  HardDrive,
  Package,
  Download,
  Play,
  Copy,
  Blocks,
  ScrollText,
  ClipboardCheck,
} from 'lucide-react';

import { FeasibilityScorer } from '@/components/bayforge/FeasibilityScorer';
import { PrefabChecker } from '@/components/bayforge/PrefabChecker';
import { AduCompanies } from '@/components/bayforge/AduCompanies';
import { PermitChecklist } from '@/components/bayforge/PermitChecklist';
import { ResourcesHub } from '@/components/bayforge/ResourcesHub';
import { PrefabComparison } from '@/components/bayforge/PrefabComparison';
import { LegalFramework } from '@/components/bayforge/LegalFramework';
import { CityInsightsPanel } from '@/components/bayforge/CityInsightsPanel';
import { CitySpecificChecklist } from '@/components/bayforge/CitySpecificChecklist';
import { HiringChecklist } from '@/components/bayforge/HiringChecklist';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

// ─── Hydration-safe mount hook ─────────────────────────────────────────
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// ─── Animated Counter Hook ────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 2000, inView = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, inView]);

  return count;
}

// ─── Typing Indicator ─────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <motion.span
        className="h-2 w-2 rounded-full bg-amber-500"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-amber-500"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-amber-500"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  );
}

// ─── Section Wrapper for fade-in on scroll ────────────────────────────────
function Section({
  children,
  className,
  id,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
    >
      {children}
    </motion.section>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  value,
  suffix,
  label,
  inView,
}: {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  inView: boolean;
}) {
  const count = useAnimatedCounter(value, 2000, inView);

  return (
    <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-center mb-3">
        <div className="rounded-full bg-amber-500/10 p-3">
          <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground">
        {count.toLocaleString()}
        {suffix}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </Card>
  );
}

// ─── AI Model Card ───────────────────────────────────────────────────────
function ModelCard({
  model,
  isSelected,
  onSelect,
}: {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        className={`cursor-pointer transition-all duration-300 p-5 h-full ${
          isSelected
            ? 'border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
            : 'hover:shadow-md'
        }`}
        onClick={onSelect}
      >
        <CardHeader className="p-0 gap-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{model.icon}</span>
              <div>
                <CardTitle className="text-base">{model.name}</CardTitle>
                <CardDescription className="text-xs">{model.provider}</CardDescription>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {model.isFree && (
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]">
                  Free
                </Badge>
              )}
              {model.popular && (
                <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]">
                  Popular
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 gap-3">
          <p className="text-sm text-muted-foreground">{model.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {model.capabilities.map((cap) => (
              <Badge key={cap} variant="secondary" className="text-[11px]">
                {cap}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{model.contextWindow}</span>
            <Badge
              variant="outline"
              className={`text-[11px] ${
                model.speed === 'fast'
                  ? 'text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : model.speed === 'medium'
                    ? 'text-orange-600 dark:text-orange-400 border-orange-500/30'
                    : 'text-red-600 dark:text-red-400 border-red-500/30'
              }`}
            >
              {model.speed === 'fast' ? '⚡ Fast' : model.speed === 'medium' ? '🔄 Medium' : '🐌 Slow'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────
function Navbar() {
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useMounted();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Tools', href: '#tools' },
    { label: 'Models', href: '#models' },
    { label: 'Chat', href: '#chat' },
    { label: 'Coverage', href: '#coverage' },
    { label: 'Checklist', href: '#checklist' },
    { label: 'Companies', href: '#companies' },
    { label: 'Compare', href: '#prefab-compare' },
    { label: 'Resources', href: '#resources-hub' },
    { label: 'Legal', href: '#legal-framework' },
    { label: 'Hiring', href: '#hiring' },
    { label: 'Disclaimer', href: '#disclaimer' },
  ];

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm'
          : 'bg-transparent'
      }`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 text-xl font-bold"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Hammer className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
            BayForge AI
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {mounted && (
              <>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              </>
            )}
          </Button>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20"
            onClick={() => scrollTo('#chat')}
          >
            Get Analysis
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {mounted && (
              <>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              </>
            )}
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Hammer className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    BayForge AI
                  </span>
                </SheetTitle>
                <SheetDescription>Navigation menu</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 mt-4">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className="text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <Separator className="my-2" />
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white mt-2"
                  onClick={() => scrollTo('#chat')}
                >
                  Get Analysis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}

// ─── HERO SECTION ─────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/20 dark:bg-amber-500/10 blur-3xl"
          animate={{ x: [0, 60, -40, 0], y: [0, -30, 50, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-500/20 dark:bg-orange-500/10 blur-3xl"
          animate={{ x: [0, -50, 40, 0], y: [0, 40, -30, 0], scale: [1, 0.95, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-yellow-500/10 dark:bg-yellow-500/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Badge className="mb-6 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 px-4 py-1.5 text-sm">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            California ADU Zoning Expert
          </Badge>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
        >
          Build Your ADU with{' '}
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
            AI-Powered
          </span>
          <br />
          Zoning Confidence
        </motion.h1>

        <motion.p
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          Multi-agent RAG system analyzing 58+ California city zoning codes. Get instant
          answers with legal code references (Gov Code §65852.2, AB 2221, SB 897).
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/25 px-8 h-12 text-base"
            onClick={() => document.querySelector('#chat')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Start Free Analysis
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base"
            onClick={() => document.querySelector('#coverage')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Coverage
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>

        {/* Trust Strip */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-amber-500" />
            58+ Cities
          </span>
          <span className="hidden sm:block">|</span>
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-amber-500" />
            465 Zoning Pages
          </span>
          <span className="hidden sm:block">|</span>
          <span className="flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-amber-500" />
            7 AI Models
          </span>
          <span className="hidden sm:block">|</span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-500" />
            60-Day Approval Guarantee
          </span>
        </motion.div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS SECTION ─────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      icon: MapPin,
      num: 1,
      title: 'Select Your City',
      description: 'Choose from 58+ covered California cities or describe your property location.',
    },
    {
      icon: MessageSquareText,
      num: 2,
      title: 'Ask Your Question',
      description: 'Get answers about setbacks, height limits, lot coverage, parking, and more.',
    },
    {
      icon: Scale,
      num: 3,
      title: 'Get Legal References',
      description: 'Every answer includes specific California Government Code citations.',
    },
  ];

  return (
    <Section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">How BayForge AI Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line - desktop only */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 dark:from-amber-700 dark:via-orange-600 dark:to-amber-700" />

          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative"
            >
              <Card className="p-6 h-full text-center hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4 relative">
                  <div className="rounded-full bg-amber-500/10 p-3 z-10">
                    <step.icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-xs w-6 h-6 rounded-full flex items-center justify-center p-0 z-20">
                    {step.num}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── STATS SECTION ────────────────────────────────────────────────────────
function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const stats = [
    { icon: MapPin, value: 58, suffix: '+', label: 'Cities Covered' },
    { icon: FileText, value: 465, suffix: '', label: 'Zoning Pages' },
    { icon: Bot, value: 7, suffix: '', label: 'AI Models' },
    { icon: Clock, value: 60, suffix: '-Day', label: 'Approval (Ministerial)' },
  ];

  return (
    <Section className="py-20 px-4 sm:px-6 lg:px-8">
      <div ref={ref} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              inView={isInView}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── AI MODELS SECTION ────────────────────────────────────────────────────
function ModelsSection() {
  const { selectedModel, setSelectedModel } = useAIStore();

  return (
    <Section id="models" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            AI Models
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Choose Your AI Zoning Expert</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Each AI model excels at different aspects of zoning analysis. Pick the one that
            suits your needs.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AI_MODELS.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selectedModel.id === model.id}
              onSelect={() => setSelectedModel(model)}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── CITY COVERAGE SECTION ────────────────────────────────────────────────
function CityCoverageSection() {
  const [search, setSearch] = useState('');
  const [activeRegion, setActiveRegion] = useState('All');

  const filteredCities = COVERED_CITIES.filter((city) => {
    const matchesSearch =
      city.name.toLowerCase().includes(search.toLowerCase()) ||
      city.county.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = activeRegion === 'All' || city.region === activeRegion;
    return matchesSearch && matchesRegion;
  });

  // Deduplicate cities
  const uniqueCities = filteredCities.filter(
    (city, index, self) => index === self.findIndex((c) => c.name === city.name)
  );

  const regionTabs = ['All', ...REGIONS];

  const regionColor: Record<string, string> = {
    'Bay Area': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    'Southern CA': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    'Central Valley': 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    'Inland Empire': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  };

  return (
    <Section id="coverage" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            Coverage
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">58+ California Cities Covered</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Comprehensive zoning analysis across Bay Area, Southern California, Central Valley,
            and Inland Empire regions.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cities or counties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {regionTabs.map((region) => (
              <Button
                key={region}
                variant={activeRegion === region ? 'default' : 'outline'}
                size="sm"
                className={
                  activeRegion === region
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0'
                    : ''
                }
                onClick={() => setActiveRegion(region)}
              >
                {region}
              </Button>
            ))}
          </div>
        </div>

        {/* City Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {uniqueCities.map((city) => (
              <motion.div
                key={city.name}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow duration-200 cursor-default">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-500/10 p-2 mt-0.5 shrink-0">
                      <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{city.name}</h3>
                      <p className="text-xs text-muted-foreground">{city.county} County</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge
                          className={`text-[10px] px-1.5 ${
                            regionColor[city.region] || 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {city.region}
                        </Badge>
                        {city.hasJadu && (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] px-1.5">
                            JADU
                          </Badge>
                        )}
                        {city.hasPriority && (
                          <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px] px-1.5">
                            Priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {uniqueCities.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No cities found matching your search.</p>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── LIVE CHAT SECTION ────────────────────────────────────────────────────
function ChatSection() {
  const { selectedModel, messages, addMessage, isTyping, setIsTyping } = useAIStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const suggestions = [
    'What are the setback requirements for an ADU in Los Angeles?',
    'Can I build a two-story ADU?',
    'What is the 60-day ministerial approval process?',
    'How is a JADU different from an ADU?',
  ];

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: content.trim(),
      model: selectedModel.name,
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: content.trim() },
          ],
          model: selectedModel.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      setIsTyping(false);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = crypto.randomUUID();

      if (reader) {
        const assistantMessage = {
          id: assistantId,
          role: 'assistant' as const,
          content: '',
          model: selectedModel.name,
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  assistantContent += delta;
                  const store = useAIStore.getState();
                  const updatedMessages = [...store.messages];
                  const lastMsg = updatedMessages[updatedMessages.length - 1];
                  if (lastMsg && lastMsg.id === assistantId) {
                    updatedMessages[updatedMessages.length - 1] = {
                      ...lastMsg,
                      content: assistantContent,
                    };
                    useAIStore.setState({ messages: updatedMessages });
                  }
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      }
    } catch {
      setIsTyping(false);
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'Sorry, something went wrong. Please try again. If the issue persists, our team has been notified.',
        model: selectedModel.name,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Section id="chat" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            Live Chat
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Ask Our Zoning Expert</h2>
          <p className="mt-4 text-muted-foreground">
            Get real-time ADU zoning analysis powered by {selectedModel.name}.
          </p>
        </div>

        <Card className="overflow-hidden shadow-xl border-muted">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Hammer className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">BayForge AI</p>
                <p className="text-xs text-muted-foreground">{selectedModel.name} · {selectedModel.provider}</p>
              </div>
            </div>
            <div className="ml-auto flex gap-1.5">
              {selectedModel.isFree && (
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]">
                  Free
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {selectedModel.contextWindow}
              </Badge>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollContainerRef}
            className="max-h-96 overflow-y-auto p-4 space-y-4 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--border)) transparent',
            }}
          >
            {messages.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-amber-500/10 p-4 mb-4">
                  <MessageSquareText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Ask about ADU zoning in any California city
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="px-3 py-1.5 text-xs rounded-full border bg-muted/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors max-w-[280px] truncate"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-muted rounded-2xl rounded-bl-md">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t px-4 py-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about ADU setbacks, height limits, parking..."
                className="min-h-[44px] max-h-32 resize-none border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-amber-500/50 text-sm"
                rows={1}
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 disabled:opacity-50"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 px-1">
              BayForge AI provides general zoning guidance. Always verify with your city
              planning department before construction.
            </p>
          </div>
        </Card>
      </div>
    </Section>
  );
}

// ─── LEGAL REFERENCES SECTION ─────────────────────────────────────────────
function LegalRefsSection() {
  return (
    <Section id="legal" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            Legal
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">California Legal References</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Our analysis is grounded in California state law and recent legislation
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEGAL_REFS.map((ref) => (
            <motion.a
              key={ref.code}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="p-5 h-full hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <div className="rounded-lg bg-amber-500/10 p-2.5 w-fit mb-3 group-hover:bg-amber-500/20 transition-colors">
                  <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-base mb-1 flex items-center gap-1.5">
                  {ref.code}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ref.title}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium group-hover:underline">
                    View Official Source
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            </motion.a>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── FEATURES SECTION ─────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: Workflow,
      title: 'Multi-Agent RAG',
      description:
        'LangGraph agents collaborate to analyze your question against city-specific zoning documents.',
    },
    {
      icon: Scale,
      title: 'Legal Accuracy',
      description:
        'Every answer backed by California Government Code citations and HCD guidelines.',
    },
    {
      icon: BrainCircuit,
      title: '7 AI Models',
      description:
        'Choose from GPT-4o, Claude, Gemini, DeepSeek and more for the analysis style you prefer.',
    },
    {
      icon: MapPin,
      title: '58+ City Coverage',
      description:
        'Comprehensive zoning data for Bay Area, Southern California, Central Valley, and Inland Empire.',
    },
    {
      icon: FileBarChart,
      title: 'Instant PDF Reports',
      description:
        'Generate detailed feasibility reports with scoring, cost estimates, and timelines.',
    },
    {
      icon: Languages,
      title: 'Multilingual Support',
      description:
        'Ask questions in English, Spanish, Chinese, and more for California\'s diverse communities.',
    },
  ];

  return (
    <Section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Why BayForge AI?</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Everything you need for confident ADU planning and zoning compliance.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300">
                <div className="rounded-lg bg-amber-500/10 p-2.5 w-fit mb-4">
                  <feature.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── RESOURCES SECTION ────────────────────────────────────────────────────
function ResourcesSection() {
  const resources = [
    {
      icon: Building2,
      title: 'CA HCD ADU Page',
      description: 'Official California Housing & Community Development ADU resources and guidelines.',
      url: 'https://www.hcd.ca.gov/policy-research/planning/adu/',
    },
    {
      icon: Landmark,
      title: 'CA Legislative Info',
      description: 'Search California bills, codes, and constitution for ADU-related legislation.',
      url: 'https://leginfo.legislature.ca.gov/',
    },
    {
      icon: FileDown,
      title: 'ADU Handbook PDF',
      description: 'Official HCD ADU handbook with technical guidance for builders and homeowners.',
      url: 'https://www.hcd.ca.gov/policy-research/planning/adu/adu-handbook.pdf',
    },
    {
      icon: Building2,
      title: 'CalCities (League of CA Cities)',
      description: 'Advocacy and resources from the League of California Cities.',
      url: 'https://www.calcities.org/',
    },
    {
      icon: Github,
      title: 'GitHub Repository',
      description: 'Open-source codebase, documentation, and contribution guidelines.',
      url: 'https://github.com/bayforge-ai',
    },
    {
      icon: FileText,
      title: 'BayForge Blog',
      description: 'ADU tips, zoning updates, case studies, and engineering insights.',
      url: 'https://blog.bayforge.ai',
    },
  ];

  return (
    <Section id="resources" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            Resources
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Resources &amp; Links</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Official sources and tools to support your ADU journey.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <motion.a
              key={resource.title}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="p-5 h-full hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <div className="rounded-lg bg-amber-500/10 p-2.5 w-fit mb-3 group-hover:bg-amber-500/20 transition-colors">
                  <resource.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-base mb-1 flex items-center gap-1.5">
                  {resource.title}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {resource.description}
                </p>
              </Card>
            </motion.a>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── ARCHITECTURE SECTION ────────────────────────────────────────────────
function ArchitectureSection() {
  return (
    <Section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <GitBranch className="h-3.5 w-3.5 mr-1.5" />
            Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Multi-Agent System Architecture</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            LangGraph orchestrates a supervisor agent that routes queries to specialized zoning analysis agents.
          </p>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="relative mb-12">
          <Card className="p-6 sm:p-8 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Supervisor Agent */}
              <div className="flex flex-col items-center text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 mb-3 shadow-lg shadow-amber-500/20">
                    <BrainCircuit className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                <h3 className="font-bold text-base mb-1">Supervisor Agent</h3>
                <p className="text-xs text-muted-foreground">Routes queries to specialized agents</p>
                <Badge className="mt-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]">
                  LangGraph Router
                </Badge>
              </div>

              {/* Arrow - visible on md+ */}
              <div className="hidden md:flex items-center justify-center pt-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-px w-16 bg-gradient-to-r from-amber-500 to-orange-500" />
                  <ArrowRight className="h-5 w-5 text-amber-500 -rotate-45" />
                </div>
              </div>
              {/* Arrow mobile */}
              <div className="flex md:hidden items-center justify-center">
                <ArrowRight className="h-5 w-5 text-amber-500 rotate-90" />
              </div>

              {/* Zoning Analyst */}
              <div className="flex flex-col items-center text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-4 mb-3 shadow-lg shadow-orange-500/20">
                    <Scale className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                <h3 className="font-bold text-base mb-1">Zoning Analyst Agent</h3>
                <p className="text-xs text-muted-foreground">RAG retrieval + zoning analysis</p>
                <Badge className="mt-2 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]">
                  ChromaDB RAG
                </Badge>
              </div>
            </div>

            {/* Feasibility Scorer Row */}
            <div className="mt-8 pt-6 border-t border-dashed border-muted">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex md:hidden items-center">
                  <ArrowRight className="h-5 w-5 text-amber-500 rotate-90" />
                </div>
                <div className="hidden md:flex items-center">
                  <div className="h-8 border-l-2 border-dashed border-amber-500/40" />
                </div>

                <div className="flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 mb-3 shadow-lg shadow-emerald-500/20">
                      <FileBarChart className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <h3 className="font-bold text-base mb-1">Feasibility Scorer</h3>
                  <p className="text-xs text-muted-foreground">Rule-based + LLM scoring engine</p>
                  <Badge className="mt-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                    Dual Scoring
                  </Badge>
                </div>

                {/* ChromaDB RAG */}
                <div className="flex md:hidden items-center">
                  <ArrowRight className="h-5 w-5 text-amber-500 rotate-90" />
                </div>
                <div className="hidden md:flex items-center px-4">
                  <div className="h-px w-12 bg-gradient-to-r from-amber-300 to-orange-300" />
                </div>

                <div className="flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 mb-3 shadow-lg shadow-violet-500/20">
                      <Database className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <h3 className="font-bold text-base mb-1">ChromaDB Vector Store</h3>
                  <p className="text-xs text-muted-foreground">465-page corpus, 58 city PDFs</p>
                  <Badge className="mt-2 bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20 text-[10px]">
                    all-MiniLM-L6-v2
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AgentState Schema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Code className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-base">AgentState TypedDict Schema</h3>
            </div>
            <pre className="bg-zinc-950 text-zinc-300 rounded-lg p-4 text-xs sm:text-sm overflow-x-auto leading-relaxed">
{`class AgentState(TypedDict):
    query: str              # User's zoning question
    city: str               # Target city name
    messages: Annotated[list, add_messages]
    retrieved_docs: list    # RAG results
    analysis: str           # Zoning analysis
    feasibility_score: dict # {score, max, breakdown}
    report_data: dict       # PDF report payload
    next_agent: str         # Supervisor routing`}
            </pre>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Network className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-base">Tech Stack</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'LangGraph 0.4+', desc: 'Agent orchestration' },
                { name: 'LangChain 0.3+', desc: 'RAG pipeline' },
                { name: 'ChromaDB 0.6+', desc: 'Vector store' },
                { name: 'Ollama / Groq', desc: 'Pluggable LLMs' },
                { name: 'Streamlit 1.44+', desc: 'Web UI (7 tabs)' },
                { name: 'ReportLab 4.4+', desc: 'PDF reports' },
              ].map((tech) => (
                <div key={tech.name} className="rounded-lg border bg-muted/30 p-3">
                  <p className="font-medium text-xs text-amber-600 dark:text-amber-400">{tech.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{tech.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

// ─── PROJECT STRUCTURE SECTION ────────────────────────────────────────────
function ProjectStructureSection() {
  return (
    <Section id="project-structure" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <FolderTree className="h-3.5 w-3.5 mr-1.5" />
            Project Structure
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Directory Layout</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            A clean, modular project structure separating agents, core logic, UI, and data pipelines.
          </p>
        </div>

        <Card className="p-6 sm:p-8 overflow-x-auto">
          <pre className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre font-mono">
{`BayForge AI/
├── agents/
│   ├── graph.py              # LangGraph StateGraph
│   ├── supervisor.py         # Supervisor router
│   ├── zoning_expert.py      # Zoning Analyst with RAG
│   ├── prompts.py            # System prompts
│   └── state.py              # AgentState TypedDict
├── core/
│   ├── config.py             # Centralized config
│   ├── llm_factory.py        # Universal LLM factory (6 providers)
│   └── rag_pipeline.py       # BayForgeRAG class
├── ui/
│   ├── app.py                # Streamlit frontend (7 tabs)
│   └── report_generator.py   # PDF report generator
├── scripts/
│   ├── generate_exhaustive_shamel.py  # 58-city PDF generator
│   └── index_city.py                  # ChromaDB indexer
├── data/
│   ├── raw_pdfs/             # 58 ordinance PDFs
│   └── chroma_db/            # Vector database
└── docs/
    └── MODEL_GUIDE.md`}
          </pre>
        </Card>

        {/* Quick description cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
          {[
            { icon: GitBranch, label: 'agents/', desc: 'Multi-agent system' },
            { icon: Cpu, label: 'core/', desc: 'Config & RAG' },
            { icon: Layers, label: 'ui/', desc: 'Streamlit frontend' },
            { icon: Terminal, label: 'scripts/', desc: 'Data pipelines' },
            { icon: HardDrive, label: 'data/', desc: 'PDFs & ChromaDB' },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-lg border bg-muted/30">
              <item.icon className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <p className="font-semibold text-xs">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── TECH STACK SECTION ───────────────────────────────────────────────────
function TechStackSection() {
  const technologies = [
    {
      icon: GitBranch,
      name: 'LangGraph 0.4+',
      category: 'Agent Orchestration',
      description: 'StateGraph-based multi-agent coordination with conditional routing and message passing.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Blocks,
      name: 'LangChain 0.3+',
      category: 'RAG Pipeline',
      description: 'Document loaders, text splitters, retrieval chains, and prompt templates for zoning analysis.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Database,
      name: 'ChromaDB 0.6+',
      category: 'Vector Store',
      description: 'Local vector database storing 465+ pages of zoning code with semantic similarity search.',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Server,
      name: 'Ollama / Groq / OpenAI',
      category: 'Pluggable LLM',
      description: 'Universal LLM factory supporting 6 providers. Switch between local and cloud models seamlessly.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Layers,
      name: 'Streamlit 1.44+',
      category: 'Web UI',
      description: 'Rapid-prototype frontend with 7 interactive tabs: Chat, Feasibility, Compare, Map, Docs, Reports, Settings.',
      color: 'from-red-500 to-pink-600',
    },
    {
      icon: FileText,
      name: 'ReportLab 4.4+',
      category: 'PDF Reports',
      description: 'Professional PDF report generation with feasibility scores, tables, and formatted analysis.',
      color: 'from-sky-500 to-cyan-600',
    },
    {
      icon: Globe,
      name: 'all-MiniLM-L6-v2',
      category: 'Embeddings',
      description: 'Sentence-transformer model for generating 384-dimensional document embeddings.',
      color: 'from-lime-500 to-green-600',
    },
    {
      icon: Code,
      name: 'Python 3.10+',
      category: 'Runtime',
      description: 'Type-hinted Python with TypedDict, Annotated types, and modern async patterns.',
      color: 'from-yellow-500 to-amber-600',
    },
  ];

  return (
    <Section id="tech-stack" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <Cpu className="h-3.5 w-3.5 mr-1.5" />
            Tech Stack
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Powered By</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            A modern AI/ML stack optimized for local-first development and production deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {technologies.map((tech) => (
            <motion.div
              key={tech.name}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="p-5 h-full hover:shadow-lg transition-shadow duration-300">
                <div className={`rounded-lg bg-gradient-to-br ${tech.color} p-2.5 w-fit mb-3`}>
                  <tech.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-0.5">{tech.name}</h3>
                <Badge variant="secondary" className="text-[10px] mb-2">{tech.category}</Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">{tech.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── ORDINANCE STRUCTURE SECTION ──────────────────────────────────────────
function OrdinanceStructureSection() {
  const chapters = [
    { num: 1, title: 'Purpose, Intent & Legal Authority', desc: 'State mandate under Gov Code §65852.2 and AB 2221' },
    { num: 2, title: 'Definitions', desc: 'ADU, JADU, Setback, FHSZ, Lot Coverage, and more' },
    { num: 3, title: 'Applicability, Zoning, Overlays', desc: 'Where ADUs are permitted; overlay district rules' },
    { num: 4, title: 'Development Standards', desc: 'Size limits, setbacks, height, lot coverage, FAR' },
    { num: 5, title: 'Objective Design Standards', desc: 'Exterior design, materials, roof pitch guidelines' },
    { num: 6, title: 'Utilities', desc: 'Water, Sewer, Electrical, EV charger, Solar requirements' },
    { num: 7, title: 'Parking & Transit Exemptions', desc: 'When parking can be waived; transit proximity' },
    { num: 8, title: 'Owner Occupancy, Deed Restrictions', desc: 'Owner-occupancy rules; covenant requirements' },
    { num: 9, title: 'Permitting Process', desc: '60-day ministerial approval timeline, impact fees' },
    { num: 10, title: 'Special Case Scenario Matrix', desc: '14 edge cases: historic districts, HPOZ, coastal zones' },
    { num: 11, title: 'Fire & Life Safety', desc: 'Sprinkler requirements, fire access, egress' },
    { num: 12, title: 'Amnesty & Legalization Program', desc: 'Path to legalize existing unpermitted units' },
  ];

  return (
    <Section id="ordinance-structure" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <ScrollText className="h-3.5 w-3.5 mr-1.5" />
            Ordinance Structure
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">12-Chapter Ordinances</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Each of the 58 cities has a comprehensive 12-chapter ordinance PDF covering every aspect of ADU development.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((ch) => (
                  <TableRow key={ch.num}>
                    <TableCell className="text-center">
                      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs">
                        {ch.num}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{ch.title}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {ch.desc}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '12', label: 'Chapters per City' },
            { value: '58', label: 'Cities Covered' },
            { value: '14', label: 'Edge Cases Covered' },
            { value: '465', label: 'Total Pages' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-lg border bg-muted/30">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── SETUP GUIDE SECTION ──────────────────────────────────────────────────
function SetupGuideSection() {
  const steps = [
    {
      num: 1,
      icon: Package,
      title: 'Prerequisites',
      description: 'Python 3.10+, Git, and an AI model provider (Ollama recommended for free local inference).',
      code: '# Ensure Python 3.10+\npython --version\n\n# Install Git\ngit --version',
    },
    {
      num: 2,
      icon: Download,
      title: 'Clone & Install',
      description: 'Clone the repository and install dependencies in a virtual environment.',
      code: 'git clone https://github.com/bayforge-ai/bayforge-ai.git\ncd bayforge-ai\n\npython -m venv venv\nsource venv/bin/activate  # Windows: venv\\Scripts\\activate\n\npip install -r requirements.txt',
    },
    {
      num: 3,
      icon: Settings,
      title: 'Configure AI',
      description: 'Set your preferred LLM provider in the .env file.',
      code: 'cp .env.example .env\n\n# Edit .env and set:\n# LLM_PROVIDER=ollama\n# OLLAMA_MODEL=llama3\n# Or: LLM_PROVIDER=groq / openai',
    },
    {
      num: 4,
      icon: Server,
      title: 'Install Ollama & Pull Model',
      description: 'For free local inference, install Ollama and download a model.',
      code: '# Install Ollama (macOS/Linux)\ncurl -fsSL https://ollama.ai/install.sh | sh\n\n# Pull model (choose one)\nollama pull llama3\nollama pull mistral\nollama pull deepseek-r1',
    },
    {
      num: 5,
      icon: Database,
      title: 'Build Knowledge Base',
      description: 'Generate city PDFs and index them into ChromaDB for RAG retrieval.',
      code: '# Generate 58-city ordinance PDFs\npython scripts/generate_exhaustive_shamel.py\n\n# Index PDFs into ChromaDB\npython scripts/index_city.py',
    },
    {
      num: 6,
      icon: Play,
      title: 'Launch Streamlit',
      description: 'Start the web UI with 7 tabs: Chat, Feasibility, Compare, Map, Docs, Reports, Settings.',
      code: 'streamlit run ui/app.py\n\n# Opens at http://localhost:8501',
    },
  ];

  return (
    <Section id="setup" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <Terminal className="h-3.5 w-3.5 mr-1.5" />
            Setup Guide
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Get Started in 6 Steps</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            From zero to a fully operational ADU zoning analysis system in under 10 minutes.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step) => (
            <motion.div
              key={step.num}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <Card className="p-5 sm:p-6 overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-xs w-7 h-7 rounded-full flex items-center justify-center p-0 shrink-0">
                        {step.num}
                      </Badge>
                      <div className="rounded-lg bg-amber-500/10 p-1.5 shrink-0">
                        <step.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="font-semibold text-base">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed ml-12">
                      {step.description}
                    </p>
                  </div>
                  {/* Right: code */}
                  <div className="lg:w-[480px] shrink-0">
                    <pre className="bg-zinc-950 text-zinc-300 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
                      <code>{step.code}</code>
                    </pre>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── LLM PROVIDERS SECTION ────────────────────────────────────────────────
function LLMProvidersSection() {
  const providers = [
    {
      icon: Server,
      name: 'Ollama',
      pricing: 'Free, Local',
      tag: 'Default',
      description: 'Run LLMs locally on your machine. Zero API costs, full privacy.',
      models: ['llama3', 'mistral', 'gemma2', 'phi3', 'qwen2.5', 'deepseek-r1'],
      highlight: true,
    },
    {
      icon: Laptop,
      name: 'LM Studio',
      pricing: 'Free, Local',
      tag: 'GUI',
      description: 'Desktop app with a graphical interface for managing and running local models.',
      models: ['Any GGUF model'],
      highlight: false,
    },
    {
      icon: Cpu,
      name: 'Jan.ai',
      pricing: 'Free, Local',
      tag: 'Simple',
      description: 'Lightweight open-source desktop app for running local AI models.',
      models: ['Any GGUF model'],
      highlight: false,
    },
    {
      icon: Cloud,
      name: 'HuggingFace',
      pricing: 'Free Cloud',
      tag: 'Serverless',
      description: 'Access thousands of models via free inference API with rate limits.',
      models: ['Inference API models'],
      highlight: false,
    },
    {
      icon: Zap,
      name: 'Groq',
      pricing: 'Free Tier',
      tag: 'Fastest',
      description: 'Ultra-fast LPU inference. Generous free tier for development use.',
      models: ['llama-3.3-70b', 'mixtral-8x7b', 'gemma2-9b'],
      highlight: true,
    },
    {
      icon: Globe,
      name: 'OpenAI',
      pricing: 'Paid',
      tag: 'Best Quality',
      description: 'Industry-leading model quality. GPT-4o for complex zoning analysis.',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      highlight: false,
    },
  ];

  return (
    <Section id="llm-providers" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <Cpu className="h-3.5 w-3.5 mr-1.5" />
            LLM Providers
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">6 Supported Providers</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Universal LLM factory lets you swap providers with a single config change. Start free with Ollama or Groq.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <motion.div
              key={provider.name}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className={`p-5 h-full hover:shadow-lg transition-shadow duration-300 ${provider.highlight ? 'border-amber-500/50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="rounded-lg bg-amber-500/10 p-2.5">
                    <provider.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex gap-1.5">
                    <Badge className={`text-[10px] ${provider.highlight ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' : 'bg-muted text-muted-foreground'}`}>
                      {provider.pricing}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {provider.tag}
                    </Badge>
                  </div>
                </div>
                <h3 className="font-semibold text-base mb-1">{provider.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{provider.description}</p>
                <div className="flex flex-wrap gap-1">
                  {provider.models.map((model) => (
                    <Badge key={model} variant="outline" className="text-[10px]">
                      {model}
                    </Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── DATA & KNOWLEDGE BASE SECTION ────────────────────────────────────────
function DataKnowledgeBaseSection() {
  const regions = [
    { name: 'Bay Area', count: 28, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
    { name: 'Southern California', count: 21, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
    { name: 'Central Valley', count: 8, color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
    { name: 'State HCD', count: 1, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  ];

  return (
    <Section id="data" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <HardDrive className="h-3.5 w-3.5 mr-1.5" />
            Knowledge Base
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">Data &amp; Knowledge Base</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            The most comprehensive ADU zoning corpus in California, powering accurate RAG retrieval.
          </p>
        </div>

        {/* Region breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {regions.map((region) => (
            <Card key={region.name} className="p-5 text-center">
              <p className="text-3xl font-bold text-foreground">{region.count}</p>
              <Badge className={`mt-2 text-xs ${region.color}`}>
                {region.name}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">City PDFs</p>
            </Card>
          ))}
        </div>

        {/* Tech details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-base">ChromaDB Vector Store</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Embedding Model', value: 'all-MiniLM-L6-v2 (384-dim)' },
                { label: 'Chunk Size', value: '1,000 characters' },
                { label: 'Chunk Overlap', value: '150 characters' },
                { label: 'Splitter', value: 'RecursiveCharacterTextSplitter' },
                { label: 'Retrieval (k)', value: '5 documents per query' },
                { label: 'Total Documents', value: '465+ pages across 58 cities' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm py-1.5 border-b border-dashed border-muted last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <Badge variant="secondary" className="text-xs font-mono">{item.value}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <FileCode className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-base">Data Pipeline</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-xs shrink-0 mt-0.5">1</Badge>
                <div>
                  <p className="font-medium text-sm">Generate Ordinance PDFs</p>
                  <p className="text-xs text-muted-foreground">Python script creates 12-chapter PDFs per city with city-specific zoning data.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-xs shrink-0 mt-0.5">2</Badge>
                <div>
                  <p className="font-medium text-sm">Load &amp; Split Documents</p>
                  <p className="text-xs text-muted-foreground">PyPDFLoader reads PDFs, RecursiveCharacterTextSplitter creates chunks of 1000 chars with 150 overlap.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-xs shrink-0 mt-0.5">3</Badge>
                <div>
                  <p className="font-medium text-sm">Generate Embeddings</p>
                  <p className="text-xs text-muted-foreground">all-MiniLM-L6-v2 creates 384-dimensional vector embeddings for each chunk.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-xs shrink-0 mt-0.5">4</Badge>
                <div>
                  <p className="font-medium text-sm">Store in ChromaDB</p>
                  <p className="text-xs text-muted-foreground">Vectors stored locally with metadata (city, chapter) for filtered retrieval.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

// ─── DISCLAIMER SECTION ─────────────────────────────────────────────────────
function DisclaimerSection() {
  return (
    <section id="disclaimer" className="py-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-200">
                Disclaimer / Liability Waiver
              </h3>
              <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  <strong className="text-zinc-300">This project is a concept/idea only</strong> and does not represent a fully functional, production-ready product. It was developed solely as a personal learning exercise to strengthen technical skills in AI, web development, and software engineering.
                </p>
                <p>
                  BayForge AI is an <strong className="text-zinc-300">educational concept</strong> intended to benefit the community by exploring how AI and multi-agent RAG systems could potentially help homeowners navigate California ADU zoning regulations. It is <strong className="text-zinc-300">not a substitute</strong> for professional legal advice, architectural consultation, or official city planning department guidance.
                </p>
                <p>
                  Any zoning information, legal references, or code citations provided by this platform are for <strong className="text-zinc-300">general informational purposes only</strong>. Users should always verify all information with their local city planning department and consult qualified professionals before making any construction or investment decisions.
                </p>
                <p>
                  The developer assumes <strong className="text-zinc-300">no liability</strong> for any errors, inaccuracies, omissions, or any consequences arising from the use of this platform. Use at your own discretion and risk.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-600">
                  Built as an educational project to develop skills and contribute a constructive idea to the community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA SECTION ──────────────────────────────────────────────────────────
function CTASection() {
  return (
    <Section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-16 sm:px-16 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Build Your ADU?
            </h2>
            <p className="mt-4 text-amber-100 text-lg max-w-xl mx-auto">
              Get instant zoning analysis with legal code references. Start your ADU journey
              today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-amber-600 hover:bg-amber-50 shadow-lg px-8 h-12 text-base font-semibold"
                onClick={() => document.querySelector('#chat')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Start Free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 h-12 px-8 text-base"
                onClick={() => document.querySelector('#legal')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Legal Sources
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────
function Footer() {
  const footerLinks = {
    Platform: [
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'AI Models', href: '#models' },
      { label: 'City Coverage', href: '#coverage' },
      { label: 'Live Chat', href: '#chat' },
      { label: 'API', href: '#chat' },
    ],
    Legal: [
      { label: 'Gov Code §65852.2', href: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.2' },
      { label: 'AB 2221', href: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB2221' },
      { label: 'SB 897', href: 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240SB897' },
      { label: 'JADU Rules', href: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65852.1' },
      { label: 'HCD Handbook', href: 'https://www.hcd.ca.gov/policy-research/planning/adu/' },
    ],
    Resources: [
      { label: 'CA HCD', href: 'https://www.hcd.ca.gov/policy-research/planning/adu/' },
      { label: 'Legislative Info', href: 'https://leginfo.legislature.ca.gov/' },
      { label: 'ADU Handbook', href: 'https://www.hcd.ca.gov/policy-research/planning/adu/adu-handbook.pdf' },
      { label: 'CalCities', href: 'https://www.calcities.org/' },
      { label: 'Blog', href: 'https://blog.bayforge.ai' },
    ],
    Project: [
      { label: 'About', href: '#' },
      { label: 'GitHub', href: 'https://github.com/bayforge-ai' },
      { label: 'Contributing', href: 'https://github.com/bayforge-ai' },
      { label: 'License (MIT)', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/bayforge-ai', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-zinc-950 text-zinc-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Hammer className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent font-bold text-lg">
                BayForge AI
              </span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              AI-powered ADU zoning analysis for California homeowners and builders.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-zinc-200 text-sm mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-sm text-zinc-500 hover:text-amber-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <Separator className="my-8 bg-zinc-800" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">
            &copy; 2025 BayForge AI. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4 text-zinc-400" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
export default function HomePage() {
  const mounted = useMounted();

  return (
    <>
      <div className="min-h-screen flex flex-col scroll-smooth">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <HowItWorksSection />
          <StatsSection />

        {/* ─── INTERACTIVE TOOLS SECTION ─────────────────────────────── */}
        <Section id="tools" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Interactive Tools
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">ADU Planning Tools</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Feasibility scoring, prefab checking, and more — all the original BayForge tools now interactive.
              </p>
            </div>

            <Tabs defaultValue="feasibility" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="feasibility">Feasibility Scorer</TabsTrigger>
                <TabsTrigger value="prefab">Prefab Checker</TabsTrigger>
                <TabsTrigger value="companies">ADU Companies</TabsTrigger>
                <TabsTrigger value="checklist">Permit Checklist</TabsTrigger>
              </TabsList>
              <TabsContent value="feasibility">
                <Card className="p-6 mt-4">
                  <FeasibilityScorer />
                </Card>
              </TabsContent>
              <TabsContent value="prefab">
                <Card className="p-6 mt-4">
                  <PrefabChecker />
                </Card>
              </TabsContent>
              <TabsContent value="companies">
                <Card className="p-6 mt-4">
                  <AduCompanies />
                </Card>
              </TabsContent>
              <TabsContent value="checklist">
                <Card className="p-6 mt-4">
                  <PermitChecklist />
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Section>

        {/* ─── ADU COMPANIES SECTION ──────────────────────────────────── */}
        <Section id="companies" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                <Building2 className="h-3.5 w-3.5 mr-1.5" />
                Directory
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">Top California ADU Companies</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                15 curated ADU contractors, designers, and prefab manufacturers across California.
              </p>
            </div>
            <AduCompanies />
          </div>
        </Section>

          <ModelsSection />
          <CityCoverageSection />
          <ChatSection />
          <LegalRefsSection />
          <FeaturesSection />
          <ResourcesSection />
          <ArchitectureSection />
          <ProjectStructureSection />
          <TechStackSection />
          <OrdinanceStructureSection />
          <SetupGuideSection />
          <LLMProvidersSection />
          <DataKnowledgeBaseSection />

          {/* ─── CITY-SPECIFIC CHECKLIST ──────────────────────────────── */}
          <Section id="checklist" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                  <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                  Checklist
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold">ADU Permit Checklist Generator</h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  City-specific, type-specific step-by-step permit roadmap — 46 items across 5 phases.
                </p>
              </div>
              <Card className="p-6">
                <CitySpecificChecklist />
              </Card>
            </div>
          </Section>

          {/* ─── PREFAB COMPARISON TABLE ──────────────────────────────── */}
          <Section id="prefab-compare" className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  Compare
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold">Prefab ADU Side-by-Side Comparison</h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  8 top prefab manufacturers compared across price, delivery, features, and more.
                </p>
              </div>
              <PrefabComparison />
            </div>
          </Section>

          {/* ─── RESOURCES HUB ────────────────────────────── */}
          <Section id="resources-hub" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Resources Hub
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold">ADU Resources Hub — California 2026</h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  Official sources, prefab catalogs, cost tools, floor plans, and Bay Area guides — 37 curated resources.
                </p>
              </div>
              <ResourcesHub />
            </div>
          </Section>

          {/* ─── LEGAL FRAMEWORK ────────────────────────────── */}
          <Section id="legal-framework" className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                  <Scale className="h-3.5 w-3.5 mr-1.5" />
                  Legal
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold">California ADU Legal Framework</h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  The complete legal foundation for ADU development in California, including key statutes, amendments, and HCD guidance.
                </p>
              </div>
              <LegalFramework />
            </div>
          </Section>

          {/* ─── HIRING CHECKLIST ────────────────────────────── */}
          <Section id="hiring" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <Badge className="mb-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Hiring
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold">Before You Hire — Checklist</h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  8 critical items to verify before signing any ADU contractor agreement.
                </p>
              </div>
              <HiringChecklist />
            </div>
          </Section>

          <CTASection />
          <DisclaimerSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
