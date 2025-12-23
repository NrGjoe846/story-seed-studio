import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="page-enter">
      <section className="pt-0 pb-0 bg-gradient-to-br from-primary via-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(212,175,55,0.15)_1px,transparent_0)] [background-size:20px_20px]"></div>
        </div>
        <div className="container mx-auto px-4 min-h-[200px] flex flex-col items-center justify-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/20 rounded-full mb-4">
            <Shield className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">Legal</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground">
            Privacy Policy
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
                    1. Information We Collect
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect information you provide directly, including name, email address, age, and story submissions. For participants under 18, we collect parental/guardian contact information as well.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    2. How We Use Your Information
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We use collected information to provide and improve our services, communicate about competitions, process registrations, and ensure platform security. We never sell personal information to third parties.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    3. Data Protection for Minors
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We take special care to protect the privacy of children. We comply with COPPA and require parental consent for users under 13. Parents can request to view, modify, or delete their child's data at any time.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    4. Data Security
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We implement industry-standard security measures to protect your data. This includes encryption, secure servers, and regular security audits. However, no internet transmission is 100% secure.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    5. Cookies and Tracking
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We use cookies to improve user experience and analyze platform usage. You can control cookie settings through your browser. Essential cookies are required for basic platform functionality.
                  </p>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    6. Your Rights
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You have the right to access, correct, or delete your personal information. You can also opt out of marketing communications. To exercise these rights, contact us at privacy@storyseed.studio
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
                    For questions about this Privacy Policy or data practices, contact our Data Protection Officer at privacy@storyseed.studio
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

export default Privacy;
