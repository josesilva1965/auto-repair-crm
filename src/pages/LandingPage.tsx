import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Wrench,
    Calendar,
    FileText,
    Package,
    Users,
    Car,
    CreditCard,
    Clock,
    UserCheck,
    Star,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    Menu,
    X,
    Play
} from 'lucide-react';

// Hook for scroll-triggered animations
function useScrollAnimation() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
}

export function LandingPage() {
    return (
        <div className="min-h-screen bg-stone-50">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <CTASection />
            <Footer />
        </div>
    );
}

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <span className={`text-2xl font-bold ${scrolled ? 'text-stone-900' : 'text-white'}`}>
                            AutoCRM
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className={`font-medium transition-colors ${scrolled ? 'text-stone-600 hover:text-amber-600' : 'text-white/80 hover:text-white'}`}>
                            Features
                        </a>
                        <a href="#how-it-works" className={`font-medium transition-colors ${scrolled ? 'text-stone-600 hover:text-amber-600' : 'text-white/80 hover:text-white'}`}>
                            How It Works
                        </a>
                        <a href="#testimonials" className={`font-medium transition-colors ${scrolled ? 'text-stone-600 hover:text-amber-600' : 'text-white/80 hover:text-white'}`}>
                            Testimonials
                        </a>
                        <a href="#cta" className={`font-medium transition-colors ${scrolled ? 'text-stone-600 hover:text-amber-600' : 'text-white/80 hover:text-white'}`}>
                            Pricing
                        </a>
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login" className={`font-medium transition-colors ${scrolled ? 'text-stone-700 hover:text-amber-600' : 'text-white/90 hover:text-white'}`}>
                            Sign In
                        </Link>
                        <Link to="/" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                            Start Free Trial
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? (
                            <X className={scrolled ? 'text-stone-900' : 'text-white'} size={24} />
                        ) : (
                            <Menu className={scrolled ? 'text-stone-900' : 'text-white'} size={24} />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-white/20">
                        <div className="flex flex-col gap-4 pt-4">
                            <a href="#features" className="text-stone-700 font-medium">Features</a>
                            <a href="#how-it-works" className="text-stone-700 font-medium">How It Works</a>
                            <a href="#testimonials" className="text-stone-700 font-medium">Testimonials</a>
                            <a href="#cta" className="text-stone-700 font-medium">Pricing</a>
                            <Link to="/" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-2.5 rounded-full font-semibold mt-2 text-center">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

function HeroSection() {
    return (
        <section className="relative h-screen overflow-hidden">
            {/* Background with Video */}
            <div className="absolute inset-0 bg-stone-900">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-60"
                >
                    <source src="/videos/hero_loop.mp4" type="video/mp4" />
                </video>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/50 to-stone-900/90" />
            </div>


            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Industry Badge */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium">
                            <Wrench size={16} className="text-amber-400" />
                            Auto Repair CRM
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
                        One Platform.
                        <br />
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            Total Control.
                        </span>
                        <br />
                        Unlimited Growth.
                    </h1>

                    {/* Subtext */}
                    <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10">
                        Streamline operations, boost revenue, and delight customers with the all-in-one business management solution built for auto repair shops.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/" className="group bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-amber-500/40 transition-all flex items-center gap-2">
                            Start Your Free Trial
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="group flex items-center gap-2 text-white/90 hover:text-white px-8 py-4 rounded-full font-semibold text-lg border border-white/30 hover:border-white/50 transition-all">
                            <Play size={20} className="text-amber-400" />
                            Watch Demo
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                        <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeaturesSection() {
    const { ref, isVisible } = useScrollAnimation();

    const features = [
        { icon: Calendar, title: 'Smart Scheduling', desc: 'AI-powered appointment booking with automated reminders and optimal bay allocation' },
        { icon: FileText, title: 'Work Orders', desc: 'Digital work orders with technician assignment, time tracking, and photo documentation' },
        { icon: Package, title: 'Parts Inventory', desc: 'Real-time inventory tracking, automatic reorder alerts, and supplier management' },
        { icon: CreditCard, title: 'Invoicing & Payments', desc: 'Professional estimates, invoices, and integrated payment processing' },
        { icon: Users, title: 'Customer Database', desc: 'Complete customer profiles with contact info, preferences, and communication history' },
        { icon: Car, title: 'Vehicle History', desc: 'Full service history for every vehicle including repairs, maintenance, and recalls' }
    ];

    return (
        <section id="features" className="py-24 bg-stone-50">
            <div
                ref={ref}
                className={`max-w-7xl mx-auto px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-amber-600 font-semibold text-sm uppercase tracking-wider">Features</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mt-3 mb-6">
                        Everything You Need to Run Your Shop
                    </h2>
                    <p className="text-xl text-stone-600 max-w-3xl mx-auto">
                        Powerful tools designed specifically for auto repair shops, all in one intuitive platform.
                    </p>
                </div>

                {/* Feature Image */}
                <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl">
                    <img
                        src="/imgs/auto-repair.jpg"
                        alt="Auto Repair Software"
                        className="w-full h-[400px] object-cover transition-all duration-500"
                    />
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100"
                        >
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <feature.icon size={28} className="text-amber-600" />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 mb-3">{feature.title}</h3>
                            <p className="text-stone-600 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HowItWorksSection() {
    const { ref, isVisible } = useScrollAnimation();

    const steps = [
        { number: '01', title: 'Sign Up & Setup', desc: 'Create your account in minutes. Import existing data or start fresh with our guided setup wizard.' },
        { number: '02', title: 'Customize Your Workflow', desc: 'Configure settings for your specific business needs. Add team members, services, and pricing.' },
        { number: '03', title: 'Go Live & Grow', desc: 'Start accepting bookings, processing orders, and watching your business thrive with real-time insights.' }
    ];

    return (
        <section id="how-it-works" className="py-24 bg-stone-900">
            <div
                ref={ref}
                className={`max-w-7xl mx-auto px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-amber-500 font-semibold text-sm uppercase tracking-wider">How It Works</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6">
                        Up and Running in Minutes
                    </h2>
                    <p className="text-xl text-stone-400 max-w-3xl mx-auto">
                        Getting started with AutoCRM is simple. No complex setup, no technical expertise required.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent z-0" />
                            )}

                            <div className="relative z-10 text-center">
                                <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/30">
                                    <span className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                                        {step.number}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                                <p className="text-stone-400 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TestimonialsSection() {
    const [current, setCurrent] = useState(0);
    const { ref, isVisible } = useScrollAnimation();

    const testimonials = [
        {
            name: 'Marcus Johnson',
            role: 'Owner, Johnson Auto Care',
            image: '/assets/testimonial-1.jpg',
            industry: 'Auto Repair',
            quote: 'AutoCRM transformed how we run our shop. Work orders that used to take 15 minutes now take 2. Our customers love the digital updates, and we\'ve seen a 40% increase in repeat business.',
            rating: 5
        },
        {
            name: 'Sarah Williams',
            role: 'Manager, Elite Auto Service',
            image: '/assets/testimonial-2.jpg',
            industry: 'Auto Repair',
            quote: 'The scheduling system alone has paid for itself. We serve 30% more customers per week, and our technicians are happier because everything is organized. Best decision we\'ve made.',
            rating: 5
        }
    ];

    const next = () => setCurrent((c) => (c + 1) % testimonials.length);
    const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

    return (
        <section id="testimonials" className="py-24 bg-stone-50">
            <div
                ref={ref}
                className={`max-w-7xl mx-auto px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-amber-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mt-3 mb-6">
                        Trusted by Shop Owners
                    </h2>
                    <p className="text-xl text-stone-600 max-w-3xl mx-auto">
                        See what industry leaders are saying about AutoCRM.
                    </p>
                </div>

                {/* Testimonial Card */}
                <div className="relative max-w-4xl mx-auto">
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            {/* Avatar Placeholder */}
                            <div className="flex-shrink-0">
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-lg">
                                    <Users size={48} className="text-amber-600" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-center md:text-left">
                                {/* Stars */}
                                <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                                    {[...Array(testimonials[current].rating)].map((_, i) => (
                                        <Star key={i} size={20} className="fill-amber-400 text-amber-400" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-xl md:text-2xl text-stone-700 leading-relaxed mb-6 italic">
                                    "{testimonials[current].quote}"
                                </p>

                                {/* Author */}
                                <div>
                                    <p className="font-bold text-stone-900 text-lg">{testimonials[current].name}</p>
                                    <p className="text-stone-500">{testimonials[current].role}</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                                        {testimonials[current].industry}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button
                            onClick={prev}
                            className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-stone-600 hover:text-amber-600"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        {/* Dots */}
                        <div className="flex items-center gap-2">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrent(index)}
                                    className={`h-3 rounded-full transition-all ${index === current ? 'bg-amber-500 w-8' : 'bg-stone-300 w-3'}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={next}
                            className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-stone-600 hover:text-amber-600"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CTASection() {
    const { ref, isVisible } = useScrollAnimation();

    return (
        <section id="cta" className="py-24 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
            <div
                ref={ref}
                className={`max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-3xl p-12 md:p-16 border border-amber-500/20">
                    <span className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm uppercase tracking-wider mb-4">
                        <CircleCheck size={16} />
                        14-Day Free Trial
                    </span>

                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Transform Your Shop?
                    </h2>

                    <p className="text-xl text-stone-400 max-w-2xl mx-auto mb-10">
                        Join thousands of auto shops that trust AutoCRM to streamline operations and boost growth. No credit card required.
                    </p>

                    {/* Email Form */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full sm:w-96 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <Link
                            to="/"
                            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2"
                        >
                            Get Started Free
                            <ArrowRight size={20} />
                        </Link>
                    </div>

                    <p className="text-stone-500 text-sm">
                        Free 14-day trial. No credit card required. Cancel anytime.
                    </p>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    const links = {
        Product: ['Features', 'Pricing', 'Integrations', 'API', 'Updates'],
        Company: ['About', 'Blog', 'Careers', 'Press', 'Partners'],
        Resources: ['Documentation', 'Help Center', 'Community', 'Webinars', 'Templates'],
        Legal: ['Privacy', 'Terms', 'Security', 'Cookie Policy']
    };

    return (
        <footer className="bg-stone-900 border-t border-stone-800">
            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* Top Section */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
                    {/* Logo & Description */}
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">AutoCRM</span>
                        </div>
                        <p className="text-stone-400 mb-6 max-w-xs">
                            The all-in-one business management platform for auto repair shops.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                            </a>
                            <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                            <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(links).map(([category, items]) => (
                        <div key={category}>
                            <h4 className="font-semibold text-white mb-4">{category}</h4>
                            <ul className="space-y-3">
                                {items.map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-stone-400 hover:text-white transition-colors text-sm">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Section */}
                <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-stone-500 text-sm">
                        © {new Date().getFullYear()} AutoCRM. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2 text-stone-400 text-sm">
                            <Wrench size={16} className="text-amber-500" />
                            Auto Repair Solutions
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
