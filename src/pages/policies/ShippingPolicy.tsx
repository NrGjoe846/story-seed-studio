import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ShippingPolicy = () => {
    return (
        <div className="min-h-screen bg-background py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link to="/">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <h1 className="text-4xl font-display font-bold mb-8">Shipping & Delivery Policy</h1>

                    <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-6">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-[#9B1B1B]">Digital Service Delivery</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Story Seed Studio provides purely digital services (online storytelling competitions).
                                No physical goods are shipped or delivered.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-[#9B1B1B]">Turnaround Time</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Upon successful registration and payment for an event:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                                <li>You will receive an immediate confirmation of your registration via email or on the dashboard.</li>
                                <li>Your <span className="font-semibold text-foreground">Unique Registration Key</span> is generated instantly.</li>
                                <li>Access to the story submission portal is granted immediately or as per the scheduled submission start date of the event.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-[#9B1B1B]">Awards & Certificates</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Participation certificates are digital and can be downloaded from your dashboard after the event concludes.
                                For winners receiving physical trophies or medals (if applicable for a specific event), delivery timelines
                                will be communicated individually via email. Standard delivery for physical awards (if any) is 14-21 business days.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-[#9B1B1B]">Contact Support</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you experience any issues with accessing the digital platform after payment, please contact our support team immediately.
                            </p>
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                <p className="font-medium">Email: hello@storyseed.in</p>
                                <p className="font-medium">Phone: +91 90430 88697</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingPolicy;
