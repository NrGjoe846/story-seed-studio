import { BookOpen, Mic, Upload, CheckCircle, Award } from 'lucide-react';

const steps = [
    {
        number: '01',
        title: 'Choose a Topic',
        description: 'Kids select from our themed storytelling categories',
        icon: BookOpen,
    },
    {
        number: '02',
        title: 'Create & Narrate',
        description: 'Children craft and tell their story in their own words',
        icon: Mic,
    },
    {
        number: '03',
        title: 'Record & Upload',
        description: 'Parents capture the magic and submit the video',
        icon: Upload,
    },
    {
        number: '04',
        title: 'Review Process',
        description: 'Our team carefully reviews for quality and safety',
        icon: CheckCircle,
    },
    {
        number: '05',
        title: 'Publish',
        description: 'Approved videos go live, and kids earn Rewards',
        icon: Award,
    },
];

export const HowItWorksSection = () => {
    return (
        <section className="py-20 bg-background relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(155,27,27,0.15)_1px,transparent_0)] [background-size:40px_40px]"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16 animate-fade-in">
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                        How It <span className="text-gradient">Works</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        A simple journey from imagination to celebration
                    </p>
                </div>

                {/* Timeline Container */}
                <div className="max-w-6xl mx-auto">
                    {/* Desktop Timeline */}
                    <div className="hidden md:block relative">
                        {/* Timeline Line */}
                        <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full"></div>

                        {/* Steps */}
                        <div className="grid grid-cols-5 gap-4">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div
                                        key={step.number}
                                        className="relative animate-fade-in"
                                        style={{ animationDelay: `${index * 0.15}s` }}
                                    >
                                        {/* Step Number Badge */}
                                        <div className="flex justify-center mb-6">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow border-4 border-background z-10 relative">
                                                    {step.number}
                                                </div>
                                                {/* Connecting dot */}
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                                            </div>
                                        </div>

                                        {/* Content Card */}
                                        <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:scale-105 h-[220px] flex flex-col">
                                            {/* Icon */}
                                            <div className="mb-4 flex justify-center">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Icon className="w-6 h-6 text-primary" />
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-display text-lg font-bold text-foreground mb-2 text-center">
                                                {step.title}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-sm text-muted-foreground text-center leading-relaxed flex-1">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile Timeline */}
                    <div className="md:hidden space-y-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.number}
                                    className="relative animate-fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex gap-4">
                                        {/* Left side - Number and Line */}
                                        <div className="flex flex-col items-center">
                                            {/* Number Badge */}
                                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-glow border-4 border-background shrink-0">
                                                {step.number}
                                            </div>

                                            {/* Connecting Line */}
                                            {index < steps.length - 1 && (
                                                <div className="w-1 flex-1 bg-gradient-to-b from-primary to-primary/20 rounded-full mt-2 min-h-[60px]"></div>
                                            )}
                                        </div>

                                        {/* Right side - Content */}
                                        <div className="flex-1 pb-8">
                                            <div className="bg-card border-2 border-primary/20 rounded-2xl p-5 shadow-lg">
                                                {/* Icon */}
                                                <div className="mb-3 inline-flex">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Icon className="w-5 h-5 text-primary" />
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                                                    {step.title}
                                                </h3>

                                                {/* Description */}
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};
