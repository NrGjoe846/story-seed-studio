import { FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="page-enter">
      <section className="pt-0 pb-0 bg-gradient-to-br from-primary via-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:20px_20px]"></div>
        </div>
        <div className="container mx-auto px-4 min-h-[200px] flex flex-col items-center justify-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/20 rounded-full mb-4">
            <FileText className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">Legal</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground">
            Terms & Conditions
          </h1>
        </div>
      </section>

      <section className="pt-0 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8 text-center">
              Last updated: January 1, 2025
            </p>

            <div className="space-y-6">
              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    By accessing and using Story Seed Studio's platform, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    2. Eligibility
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our platform is designed for children aged 5-18 years. Participants under 18 years must have parental or guardian consent to register and participate in competitions. Parents/guardians are responsible for supervising their children's use of the platform.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    3. User Registration
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To participate in competitions, users must register with accurate and complete information. Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    4. Content Ownership
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    All stories submitted to our platform remain the intellectual property of the author. By submitting, you grant Story Seed Studio a non-exclusive license to display, promote, and use your content for platform-related purposes.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    5. Competition Rules
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Each competition has specific rules and guidelines that participants must follow. Submissions must be original work and must not contain plagiarized, offensive, or inappropriate content. The decision of judges is final.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    6. Prizes and Awards
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Prize details are specified for each competition. Story Seed Studio reserves the right to substitute prizes of equal or greater value. Winners are responsible for any applicable taxes on prizes received.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    7. Contact Us
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about these Terms & Conditions, please contact us at legal@storyseed.studio
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
