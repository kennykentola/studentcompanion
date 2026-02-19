import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Disclaimer() {
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
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-10 w-10 text-amber-500" />
                        <h1 className="text-4xl font-extrabold tracking-tight">Disclaimer</h1>
                    </div>
                    <p className="text-muted-foreground italic">Last Updated: {new Date().toLocaleDateString()}</p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">1. General Information</h2>
                        <p>The information provided by StudentCompanion is for general informational purposes only. While we strive for accuracy, we make no representations or warranties of any kind regarding the completeness, accuracy, or reliability of any information on the site.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">2. Educational Advice</h2>
                        <p>The CGPA calculations, grade tracking, and study tools are provided as aids and should not be considered official academic records. Users should always verify their performance with their respective institution's official portal.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">3. External Links</h2>
                        <p>Our platform may contain links to external websites that are not provided or maintained by us. We do not guarantee the accuracy or completeness of any information on these external sites.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">4. "Use at Your Own Risk"</h2>
                        <p>Your use of the platform and your reliance on any information provided is solely at your own risk. We shall not be held liable for any loss or damage incurred as a result of the use of the site.</p>
                    </section>

                    <section className="space-y-4 text-sm text-muted-foreground pt-8 border-t">
                        <p>If you require official academic counseling or technical support, please consult with your university or contact support@studentcompanion.com.</p>
                    </section>
                </div>
            </main>
        </div>
    );
}
