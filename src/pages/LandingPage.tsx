import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Wrench, Sparkles, ChevronRight, Star, BarChart3, Users, Calendar, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Background Pattern */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px]" />
            </div>

            <Navbar />

            <main className="relative z-10 overflow-hidden">
                <HeroSection />
                <ProductShowcase />
                <ComparisonSection />
                <FutureProductSection />
                <SocialProof />
            </main>

            <Footer />
        </div>
    );
}

function Navbar() {
    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        >
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-full px-6 py-3 flex items-center justify-between shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-slate-900">
                            AutoCRM
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <Link to="#" className="hover:text-blue-600 transition-colors">Features</Link>
                        <Link to="#" className="hover:text-blue-600 transition-colors">Pricing</Link>
                        <Link to="#" className="hover:text-blue-600 transition-colors">Enterprise</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                            Login
                        </Link>
                        <Link
                            to="/"
                            className="px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 group shadow-lg shadow-slate-900/10"
                        >
                            Get Started
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}

function HeroSection() {
    return (
        <section className="pt-40 pb-20 px-6">
            <div className="max-w-7xl mx-auto text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-8 uppercase tracking-wider"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    New Release v2.0
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] text-slate-900"
                >
                    Run your auto shop like a <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                        tech startup.
                    </span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    Stop wrestling with paper and legacy software. AutoCRM gives you a
                    drag-and-drop scheduler, instant customer portals, and 1-click invoicing.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                >
                    <Link
                        to="/"
                        className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 transition-all flex items-center gap-2 group active:scale-[0.98]"
                    >
                        Launch Dashboard
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all">
                        View Demo
                    </button>
                </motion.div>

                {/* Visual Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 60, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.4, type: "spring" }}
                    className="relative max-w-5xl mx-auto perspective-1000 group"
                >
                    <div className="relative bg-slate-900/5 p-2 rounded-[1.5rem] lg:rounded-[2rem] ring-1 ring-slate-900/10 shadow-2xl shadow-blue-500/10 rotate-x-12 transform-gpu group-hover:rotate-x-0 transition-all duration-700 ease-out">
                        <img
                            src="/assets/dashboard-hero.png"
                            alt="AutoCRM Dashboard Interface"
                            className="rounded-xl lg:rounded-2xl w-full h-auto shadow-inner border border-slate-200/50"
                        />
                        {/* Floating Interaction Element */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -right-4 lg:-right-12 top-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 z-20 flex items-center gap-3"
                        >
                            <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 font-semibold">Job Completed</div>
                                <div className="text-sm font-bold text-slate-900">+$850.00</div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function ProductShowcase() {
    return (
        <section className="py-24 bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
                    <div className="order-2 lg:order-1">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[100px]" />
                            <img
                                src="/assets/analytics.png"
                                alt="Financial Analytics"
                                className="relative z-10 rounded-2xl shadow-2xl border border-slate-200 w-full"
                            />
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <h3 className="text-orange-500 font-bold tracking-wider uppercase mb-4 text-sm">Real-time Intelligence</h3>
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">Know your numbers.<br />Grow your profits.</h2>
                        <p className="text-slate-600 text-lg leading-relaxed mb-8">
                            Stop guessing. Our analytics engine tracks every penny, technician efficiency, and parts margin in real-time. See exactly where your money is coming from.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle className="w-5 h-5 text-green-500" /> Technician Efficiency Tracking
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle className="w-5 h-5 text-green-500" /> 1-Click Profit & Loss
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle className="w-5 h-5 text-green-500" /> Customer Retention Heatmaps
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <h3 className="text-blue-500 font-bold tracking-wider uppercase mb-4 text-sm">Customer Experience</h3>
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">Approvals in their pocket.<br />Trust on demand.</h2>
                        <p className="text-slate-600 text-lg leading-relaxed mb-8">
                            Send digital inspections (DVI) with photos directly to your customer's phone. They see what you see, and approve work with a single tap.
                        </p>
                        <button className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-2 group">
                            Explore Customer Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="relative mx-auto max-w-[300px] lg:max-w-none">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px]" />
                        <img
                            src="/assets/mobile-app.png"
                            alt="Mobile Customer Portal"
                            className="relative z-10 rounded-[2.5rem] shadow-2xl border-[8px] border-slate-900 mx-auto"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function ComparisonSection() {
    return (
        <section className="py-20 bg-white border-y border-slate-200" id="pricing">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Whatever your needs, we have a solution that fits.
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                        From basic estimating to full-scale shop management, choose the power you need.
                    </p>
                </div>

                {/* Comparison Table */}
                <div className="grid md:grid-cols-4 gap-0 border border-slate-200 rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">

                    {/* Feature Labels Column (Hidden on mobile, visible on desktop) */}
                    <div className="hidden md:flex flex-col bg-slate-50">
                        <div className="h-48 p-6 flex items-end pb-4 font-bold text-slate-400 uppercase tracking-wider text-sm">
                            Core Features
                        </div>
                        {/* Feature Rows */}
                        <FeatureLabelRow label="Estimates & Quotes" />
                        <FeatureLabelRow label="Customer & Vehicle Data" />
                        <FeatureLabelRow label="Parts & Labor Lookup" />
                        <FeatureLabelRow label="Repair Orders & Invoices" />
                        <FeatureLabelRow label="Parts Ordering (AutoZone)" />
                        <FeatureLabelRow label="Digital Inspections (DVI)" />
                        <FeatureLabelRow label="2-Way Texting" />
                        <FeatureLabelRow label="Technician Time Tracking" />
                        <FeatureLabelRow label="Inventory Management" />
                    </div>

                    {/* Tier 1: Estimator */}
                    <div className="flex flex-col">
                        <div className="h-48 p-8 flex flex-col items-center justify-center border-b border-slate-100 bg-white">
                            <h3 className="font-bold text-slate-900 text-lg mb-2">ESTIMATOR</h3>
                            <div className="text-3xl font-bold text-slate-900 mb-1">$0<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                            <button className="mt-4 px-6 py-2 border border-blue-200 text-blue-600 rounded-full text-sm font-bold hover:bg-blue-50 transition-colors">
                                Try Free
                            </button>
                        </div>
                        <FeatureCheckRow active={true} mobileLabel="Estimates & Quotes" />
                        <FeatureCheckRow active={true} mobileLabel="Customer & Vehicle Data" />
                        <FeatureCheckRow active={true} mobileLabel="Parts & Labor Lookup" />
                        <FeatureCheckRow active={false} mobileLabel="Repair Orders & Invoices" />
                        <FeatureCheckRow active={false} mobileLabel="Parts Ordering (AutoZone)" />
                        <FeatureCheckRow active={false} mobileLabel="Digital Inspections (DVI)" />
                        <FeatureCheckRow active={false} mobileLabel="2-Way Texting" />
                        <FeatureCheckRow active={false} mobileLabel="Technician Time Tracking" />
                        <FeatureCheckRow active={false} mobileLabel="Inventory Management" />
                    </div>

                    {/* Tier 2: Shop Manager */}
                    <div className="flex flex-col relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
                        <div className="h-48 p-8 flex flex-col items-center justify-center border-b border-blue-50 bg-blue-50/10">
                            <h3 className="font-bold text-blue-700 text-lg mb-2">SHOP MANAGER</h3>
                            <div className="text-3xl font-bold text-slate-900 mb-1">$99<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                                Get Started
                            </button>
                        </div>
                        <FeatureCheckRow active={true} mobileLabel="Estimates & Quotes" highlight />
                        <FeatureCheckRow active={true} mobileLabel="Customer & Vehicle Data" highlight />
                        <FeatureCheckRow active={true} mobileLabel="Parts & Labor Lookup" highlight />
                        <FeatureCheckRow active={true} mobileLabel="Repair Orders & Invoices" highlight />
                        <FeatureCheckRow active={true} mobileLabel="Parts Ordering (AutoZone)" highlight />
                        <FeatureCheckRow active={false} mobileLabel="Digital Inspections (DVI)" highlight />
                        <FeatureCheckRow active={false} mobileLabel="2-Way Texting" highlight />
                        <FeatureCheckRow active={false} mobileLabel="Technician Time Tracking" highlight />
                        <FeatureCheckRow active={false} mobileLabel="Inventory Management" highlight />
                    </div>

                    {/* Tier 3: Shop Manager PRO */}
                    <div className="flex flex-col relative overflow-hidden">
                        <div className="absolute top-4 -right-12 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-12 py-1 rotate-45 shadow-sm">
                            POPULAR
                        </div>
                        <div className="h-48 p-8 flex flex-col items-center justify-center border-b border-slate-100 bg-slate-900 text-white">
                            <h3 className="font-bold text-white text-lg mb-2">MANAGER PRO</h3>
                            <div className="text-3xl font-bold text-white mb-1">$259<span className="text-sm text-slate-400 font-normal">/mo</span></div>
                            <button className="mt-4 px-6 py-2 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-slate-100 transition-colors">
                                Go Pro
                            </button>
                        </div>
                        <FeatureCheckRow active={true} mobileLabel="Estimates & Quotes" />
                        <FeatureCheckRow active={true} mobileLabel="Customer & Vehicle Data" />
                        <FeatureCheckRow active={true} mobileLabel="Parts & Labor Lookup" />
                        <FeatureCheckRow active={true} mobileLabel="Repair Orders & Invoices" />
                        <FeatureCheckRow active={true} mobileLabel="Parts Ordering (AutoZone)" />
                        <FeatureCheckRow active={true} mobileLabel="Digital Inspections (DVI)" />
                        <FeatureCheckRow active={true} mobileLabel="2-Way Texting" />
                        <FeatureCheckRow active={true} mobileLabel="Technician Time Tracking" />
                        <FeatureCheckRow active={true} mobileLabel="Inventory Management" />
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-500 text-sm">
                        * All plans include 24/7 Support and Cloud Backups. Prices subject to change.
                    </p>
                </div>
            </div>
        </section>
    );
}

function FeatureLabelRow({ label }: { label: string }) {
    return (
        <div className="h-14 px-6 flex items-center text-sm font-medium text-slate-600 border-b border-slate-100 last:border-0">
            {label}
        </div>
    );
}

function FeatureCheckRow({ active, mobileLabel, highlight = false }: { active: boolean, mobileLabel: string, highlight?: boolean }) {
    return (
        <div className={`h-14 px-6 flex items-center justify-between md:justify-center border-b border-slate-100 last:border-0 ${highlight ? 'bg-blue-50/30' : ''}`}>
            <span className="md:hidden text-sm text-slate-500 font-medium">{mobileLabel}</span>
            {active ? (
                <CheckCircle className="w-5 h-5 text-green-500 fill-green-50" />
            ) : (
                <div className="w-5 h-5 rounded-full bg-slate-100/50"></div>
            )}
        </div>
    );
}

function FutureProductSection() {
    return (
        <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-6 uppercase tracking-wider">
                        Coming Q4 2026
                    </div>
                    <h2 className="text-4xl font-bold mb-6">Project Nebula: <br />The Future of Prediction.</h2>
                    <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
                        Imagine if your CRM knew a car needed service before the customer did.
                        We're building AI-driven predictive maintenance that automatically fills your schedule.
                    </p>

                    <form className="flex gap-2 max-w-sm">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-indigo-300/50"
                        />
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors whitespace-nowrap">
                            Join Waitlist
                        </button>
                    </form>
                </div>

                <div className="relative">
                    <div className="aspect-square rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl p-8 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <Sparkles className="w-24 h-24 text-indigo-300 opacity-50" />

                        {/* Abstract Floating Elements */}
                        <motion.div
                            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-10 right-10 w-20 h-20 bg-purple-500/30 rounded-2xl blur-xl"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function SocialProof() {
    return (
        <section className="py-16 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-10">
                    Powering top shops across the country
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
                    {/* Dark Logos for Light Mode */}
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700"><Star className="fill-slate-700" /> ShopMaster</div>
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700"><Wrench className="fill-slate-700" /> AutoFix</div>
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700"><ShieldCheck className="fill-slate-700" /> SafeDrive</div>
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700"><BarChart3 className="fill-slate-700" /> GrowthMech</div>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-700">AutoCRM</span>
                </div>

                <div className="text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} AutoCRM System. All rights reserved.
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-500">
                    <Link to="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
                    <Link to="#" className="hover:text-blue-600 transition-colors">Terms</Link>
                    <Link to="#" className="hover:text-blue-600 transition-colors">Twitter</Link>
                </div>
            </div>
        </footer>
    );
}
