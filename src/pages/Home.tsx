import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Calendar,
    GraduationCap,
    CheckSquare,
    MessageSquare,
    Zap,
    Menu,
    X
} from "lucide-react";

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Navigation */}
            <header className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <span className="font-bold text-xl">StudentCompanion</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
                        <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2">
                            <Button variant="ghost" asChild>
                                <Link to="/login">Login</Link>
                            </Button>
                            <Button asChild>
                                <Link to="/register">Get Started</Link>
                            </Button>
                        </div>
                        <button
                            className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-background border-b animate-in slide-in-from-top duration-300">
                        <div className="flex flex-col p-6 space-y-4">
                            <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">Features</a>
                            <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">Testimonials</a>
                            <div className="flex flex-col gap-2 pt-4 border-t">
                                <Button variant="outline" asChild onClick={() => setIsMenuOpen(false)}>
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button asChild onClick={() => setIsMenuOpen(false)}>
                                    <Link to="/register">Get Started</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                        Master Your <span className="text-primary">Academic Life</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                        The all-in-one platform for students to track grades, manage tasks, organize schedules, and collaborate with peers.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button size="lg" className="h-12 px-8 text-lg" asChild>
                            <Link to="/register">Start for Free</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
                            <Link to="/login">Student Login</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Everything You Need to Succeed</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Stop juggling multiple apps. StudentCompanion brings your entire academic workflow into one intuitive dashboard.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={LayoutDashboard}
                            title="Central Command"
                            description="Visual dashboard with real-time stats, weather updates, and upcoming deadlines at a glance."
                        />
                        <FeatureCard
                            icon={GraduationCap}
                            title="Grade Tracking"
                            description="Calculate CGPA automatically (Standard 5.0 or UI 4.0), visualize performance, and track history."
                        />
                        <FeatureCard
                            icon={Calendar}
                            title="Smart Timetable"
                            description="Manage your class schedule, labs, and study sessions with a dynamic weekly calendar."
                        />
                        <FeatureCard
                            icon={CheckSquare}
                            title="Task Management"
                            description="Kanban-style task board to organize assignments, projects, and daily to-dos."
                        />
                        <FeatureCard
                            icon={MessageSquare}
                            title="Peer Chat"
                            description="Connect with classmates, share notes, and discuss topics in real-time."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Real-time Alerts"
                            description="Get instant notifications for class changes, deadlines, and grade updates."
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Loved by Students</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Don't just take our word for it. Here's what students are saying about StudentCompanion.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TestimonialCard
                            name="Alex Johnston"
                            role="Computer Science, Year 3"
                            content="This app completely saved my semester. The grade tracking feature helped me realize I needed to pull up my socks in Algorithms, and I ended up properly balancing my study time."
                        />
                        <TestimonialCard
                            name="Sarah Miller"
                            role="Biology, Year 2"
                            content="The timetable and task manager are lifesavers. I used to miss deadlines constantly, but now I get alerts for everything. Highly recommend!"
                        />
                        <TestimonialCard
                            name="David Chen"
                            role="Engineering, Year 4"
                            content="I love how clean and fast the interface is. It doesn't get in the way, it just helps me stay organized. The dark mode is also really nice for late-night study sessions."
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof / Stats */}
            <section className="py-20 border-y">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <Stat number="100%" label="Free to Use" />
                    <Stat number="4.0/5.0" label="CGPA Support" />
                    <Stat number="24/7" label="Availability" />
                    <Stat number="Secure" label="Data Encryption" />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8 bg-card border rounded-3xl p-12 shadow-lg">
                    <h2 className="text-3xl md:text-4xl font-bold">Ready to boost your productivity?</h2>
                    <p className="text-lg text-muted-foreground">
                        Join thousands of students calculating their CGPA and organizing their lives with StudentCompanion.
                    </p>
                    <Button size="lg" className="h-12 px-8 text-lg" asChild>
                        <Link to="/register">Create Free Account</Link>
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-muted/50 border-t mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-muted-foreground">StudentCompanion</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Student Companion. Built for students, by students.
                    </p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
                        <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
                        <Link to="/disclaimer" className="text-sm text-muted-foreground hover:text-foreground">Disclaimer</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
}



function TestimonialCard({ name, role, content }: { name: string, role: string, content: string }) {
    return (
        <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow flex flex-col h-full">
            <div className="flex-1 mb-4">
                <p className="text-muted-foreground italic">"{content}"</p>
            </div>
            <div className="flex items-center gap-3 mt-auto">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-sm">{name}</h4>
                    <p className="text-xs text-muted-foreground">{role}</p>
                </div>
            </div>
        </div>
    )
}

function Stat({ number, label }: { number: string, label: string }) {
    return (
        <div className="space-y-2">
            <div className="text-4xl font-extrabold text-primary">{number}</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
    )
}
