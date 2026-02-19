import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <span className="font-bold text-xl">StudentCompanion</span>
                    </Link>
                    <Button variant="ghost" asChild>
                        <Link to="/" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="flex-1 pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
                    <p className="text-muted-foreground italic">Last Updated: {new Date().toLocaleDateString()}</p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">1. Introduction</h2>
                        <p>Welcome to StudentCompanion. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">2. Information We Collect</h2>
                        <p>We may collect personal information that you provide to us, such as:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Account Information: Name, email address, password.</li>
                            <li>Profile Information: Matric number, department, faculty, and university.</li>
                            <li>App Data: Tasks, grades, and timetable entries you create.</li>
                            <li>Communications: Messages sent via our chat hub.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
                        <p>We use your data to provide, maintain, and improve our services, including:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Personalizing your experience.</li>
                            <li>Facilitating collaboration via chat.</li>
                            <li>Calculating and tracking your academic performance.</li>
                            <li>Sending important notifications and updates.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">4. Data Security</h2>
                        <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">5. Your Rights</h2>
                        <p>You have the right to access, update, or delete your personal information at any time via your account settings.</p>
                    </section>

                    <section className="space-y-4 text-sm text-muted-foreground pt-8 border-t">
                        <p>If you have any questions about this Privacy Policy, please contact us at support@studentcompanion.com.</p>
                    </section>
                </div>
            </main>
        </div>
    );
}
