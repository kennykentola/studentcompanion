import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Accessing via alias if configured, or relative path

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <header className="w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-primary">Student Companion</h1>
                <nav className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link to="/login">Login</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/register">Get Started</Link>
                    </Button>
                </nav>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                    Your Academic Journey, <span className="text-primary">Streamlined.</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                    Manage tasks, track grades, collaborate with peers, and stay organized—all in one place.
                </p>
                <div className="flex gap-4">
                    <Button size="lg" asChild>
                        <Link to="/register">Join Now</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link to="/about">Learn More</Link>
                    </Button>
                </div>
            </main>

            <footer className="w-full py-6 text-center text-muted-foreground border-t">
                &copy; {new Date().getFullYear()} Student Companion System. All rights reserved.
            </footer>
        </div>
    );
}
