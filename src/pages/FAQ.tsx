import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Story Seed Studio?',
        a: "Story Seed Studio is India's premier storytelling platform for children. We organize competitions, workshops, and events that help young storytellers express their creativity and share their stories with the world.",
      },
      {
        q: 'Who can participate in competitions?',
        a: 'Children aged 5-18 years can participate in our competitions. Different age groups have separate categories to ensure fair competition. Parental consent is required for all participants.',
      },
      {
        q: 'Is there a fee to participate?',
        a: 'Registration fees vary by competition. Some events are free, while others have nominal fees that cover platform costs and prize pools. Fee details are always displayed clearly before registration.',
      },
    ],
  },
  {
    category: 'Competitions',
    questions: [
      {
        q: 'How do I submit my story?',
        a: 'After registering for a competition, you can submit your story through your dashboard. You can upload written documents, audio recordings, or video submissions depending on the competition format.',
      },
      {
        q: 'How are winners selected?',
        a: 'Winners are selected through a combination of public voting and expert judge evaluation. The specific criteria and weightage are mentioned in each competition\'s rules.',
      },
      {
        q: 'Can I edit my submission after submitting?',
        a: 'You can edit your submission until the competition deadline. After the deadline, no changes can be made to ensure fairness in the judging process.',
      },
    ],
  },
  {
    category: 'Account & Technical',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click on "Register" and fill in your details. For participants under 18, a parent or guardian email is also required. You\'ll receive a confirmation email to activate your account.',
      },
      {
        q: 'I forgot my password. What should I do?',
        a: 'Click on "Forgot Password" on the login page and enter your registered email. You\'ll receive instructions to reset your password.',
      },
      {
        q: 'Is my data safe on Story Seed Studio?',
        a: 'Yes, we take data security very seriously. We use industry-standard encryption and security measures. We never share personal information with third parties without consent.',
      },
    ],
  },
];

const FAQ = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="page-enter">
      <section className="py-12 sm:py-16 bg-gradient-warm">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Help Center</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Find answers to common questions about Story Seed Studio
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-6 sm:space-y-8">
            {faqs.map((category, catIndex) => (
              <div key={category.category} className="animate-fade-in" style={{ animationDelay: `${catIndex * 0.1}s` }}>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-4">
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, index) => {
                    const itemId = `${catIndex}-${index}`;
                    const isOpen = openItems.includes(itemId);
                    return (
                      <div
                        key={itemId}
                        className="bg-card rounded-xl border border-border/50 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium text-foreground pr-4 text-sm sm:text-base">{faq.q}</span>
                          <ChevronDown
                            className={cn(
                              'w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300',
                              isOpen && 'rotate-180'
                            )}
                          />
                        </button>
                        <div
                          className={cn(
                            'overflow-hidden transition-all duration-300',
                            isOpen ? 'max-h-96' : 'max-h-0'
                          )}
                        >
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-muted-foreground leading-relaxed text-sm sm:text-base">
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-12 text-center p-6 sm:p-8 bg-muted/30 rounded-2xl">
            <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Can't find the answer you're looking for? Contact our support team.
            </p>
            <a
              href="mailto:support@storyseed.studio"
              className="text-primary hover:underline font-medium text-sm sm:text-base"
            >
              support@storyseed.studio
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;

