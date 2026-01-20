import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Linkedin } from 'lucide-react';
const footerLinks = {
  quickLinks: [{
    name: 'Home',
    path: '/'
  }, {
    name: 'About Us',
    path: '/about'
  }, {
    name: 'Events',
    path: '/events'
  }, {
    name: 'Gallery',
    path: '/gallery'
  }, {
    name: 'Leaderboard',
    path: '/leaderboard'
  }, {
    name: 'Contact',
    path: '/contact'
  }],
  legal: [{
    name: 'Terms & Conditions',
    path: '/terms'
  }, {
    name: 'Privacy Policy',
    path: '/privacy'
  }, {
    name: 'FAQ',
    path: '/faq'
  }, {
    name: 'Shipping & Delivery',
    path: '/shipping-policy'
  }, {
    name: 'Cancellation & Refund',
    path: '/refund-policy'
  }]
};
const socialLinks = [{
  icon: Facebook,
  href: 'https://www.facebook.com/profile.php?id=61584643318972',
  label: 'Facebook'
}, {
  icon: Twitter,
  href: 'https://x.com/StudioStor72404',
  label: 'Twitter'
}, {
  icon: Instagram,
  href: 'https://www.instagram.com/storyseed.studio?igsh=MWhnZHI2Nmt2enYycA==',
  label: 'Instagram'
}, {
  icon: Youtube,
  href: 'https://www.youtube.com/@StorySeed.Studio',
  label: 'YouTube'
}, {
  icon: Linkedin,
  href: 'https://www.linkedin.com/in/story-seed-studio-3a95a5392/',
  label: 'LinkedIn'
}];
export const Footer = () => {
  return <footer className="bg-charcoal text-primary-foreground">
    <div className="container mx-auto px-4 py-12 sm:py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
        {/* Brand */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center group">
              <div className="h-10 sm:h-12 px-2 sm:px-4 py-1 bg-[#9B1B1B] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-md overflow-hidden">
                <img
                  src="/assets/logo.png"
                  alt="Story Seed Studio"
                  className="h-10 sm:h-12 w-auto scale-150"
                />
              </div>
            </Link>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg leading-tight">Story Seed</span>
              <span className="text-[10px] text-primary-foreground/60 tracking-wider uppercase">
                Studio
              </span>
            </div>
          </div>
          <p className="text-primary-foreground/70 text-xs sm:text-sm leading-relaxed">
            India's most joyful storytelling platform for children. Share your stories, compete with peers, and win exciting awards.
          </p>
          <div className="flex gap-2 sm:gap-3">
            {socialLinks.map(social => <a key={social.label} href={social.href} aria-label={social.label} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300">
              <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>)}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display font-semibold text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h4>
          <ul className="space-y-2">
            {footerLinks.quickLinks.map(link => <li key={link.path}>
              <Link to={link.path} className="text-primary-foreground/70 hover:text-primary transition-colors text-xs sm:text-sm">
                {link.name}
              </Link>
            </li>)}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-display font-semibold text-base sm:text-lg mb-3 sm:mb-4">Legal</h4>
          <ul className="space-y-2">
            {footerLinks.legal.map(link => <li key={link.path}>
              <Link to={link.path} className="text-primary-foreground/70 hover:text-primary transition-colors text-xs sm:text-sm">{link.name}
              </Link>
            </li>)}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-display font-semibold text-base sm:text-lg mb-3 sm:mb-4">Contact Us</h4>
          <ul className="space-y-3 sm:space-y-4">
            <li className="flex items-start gap-2 sm:gap-3">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-primary-foreground/70 text-xs sm:text-sm">
                12B, Bose St, Kodungaiyur (East), Krishnamoorthy Nagar, Kodungaiyur, Chennai, Tamil Nadu 6001181
              </span>
            </li>
            <li className="flex items-center gap-2 sm:gap-3">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-primary-foreground/70 text-xs sm:text-sm">+91 90430 88697</span>
            </li>
            <li className="flex items-center gap-2 sm:gap-3">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-primary-foreground/70 text-xs sm:text-sm">hello@storyseed.in</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <p className="text-primary-foreground/50 text-xs sm:text-sm text-center sm:text-left">
          © {new Date().getFullYear()} Story Seed Studio. All rights reserved.
        </p>
        <p className="text-primary-foreground/50 text-xs sm:text-sm text-center sm:text-right">

        </p>
      </div>
    </div>
  </footer>;
};
