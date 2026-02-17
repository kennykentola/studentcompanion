import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Calendar,
    GraduationCap,
    CheckSquare,
    MessageSquare,
    Zap
} from "lucide-react";

export default function Home() {
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
                        <Button variant="ghost" asChild>
                            <Link to="/login">Login</Link>
                        </Button>
                        <Button asChild>
                            <Link to="/register">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                        New: UI 4.0 Grading Scale Support
                    </div>
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
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a>
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground">dict</a>
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

function Stat({ number, label }: { number: string, label: string }) {
    return (
        <div className="space-y-2">
            <div className="text-4xl font-extrabold text-primary">{number}</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
    )
}
