import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
                    <h1 className="text-4xl font-extrabold tracking-tight">Terms of Use</h1>
                    <p className="text-muted-foreground italic">Last Updated: {new Date().toLocaleDateString()}</p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
                        <p>By accessing or using StudentCompanion, you agree to be bound by these Terms of Use. If you do not agree, please do not use our services.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">2. User Accounts</h2>
                        <p>You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You must provide accurate and complete information when registering.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">3. Acceptable Use</h2>
                        <p>You agree not to use the platform for any unlawful purpose or in any way that could damage, disable, or impair the service. Prohibited activities include:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Harassing or abusing other users.</li>
                            <li>Uploading malicious code or spam.</li>
                            <li>Attempting to gain unauthorized access to our systems.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">4. Limitation of Liability</h2>
                        <p>StudentCompanion is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, or incidental damages arising from your use of the platform.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">5. Changes to Terms</h2>
                        <p>We reserve the right to modify these terms at any time. Your continued use of the platform after changes are posted constitutes your acceptance of the new terms.</p>
                    </section>

                    <section className="space-y-4 text-sm text-muted-foreground pt-8 border-t">
                        <p>For any inquiries regarding these terms, please contact us at support@studentcompanion.com.</p>
                    </section>
                </div>
            </main>
        </div>
    );
}
