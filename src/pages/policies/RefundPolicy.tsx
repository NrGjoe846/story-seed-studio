import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const RefundPolicy = () => {
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
                    <h1 className="text-4xl font-display font-bold mb-8">Cancellation & Refund Policy</h1>

                    <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-6">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-[#9B1B1B]">Cancellation Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Once a registration is completed for an event, it cannot be cancelled. Slots are reserved immediately upon payment.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-[#9B1B1B]">Refund Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Story Seed Studio maintains a <span className="font-bold text-foreground">strict no-refund policy</span> for all competition registrations.
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                                <li>The registration fee is non-refundable and non-transferable under any circumstances.</li>
                                <li>If a participant is unable to submit their story or attend the event for personal reasons, no refund will be provided.</li>
                                <li>If an event is cancelled by Story Seed Studio due to unforeseen circumstances, a full refund will be processed to the original payment method within 5-7 business days.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-[#9B1B1B]">Duplicate Payments</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                In the rare event of a technical error resulting in a duplicate payment for the same registration:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                                <li>Please contact our support team immediately with transaction details.</li>
                                <li>Duplicate payments will be verified and refunds initiated within 3-5 business days.</li>
                                <li>The refund amount will credit back to your account usually within 5-7 business days depending on your bank.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-[#9B1B1B]">Questions?</h2>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-muted-foreground">For any payment-related queries, please contact:</p>
                                <p className="font-medium mt-2">Email: hello@storyseed.in</p>
                                <p className="font-medium">Phone: +91 90430 88697</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
