/**
 * ===========================================
 * Footer Component
 * ===========================================
 * 
 * Site footer with links and information.
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Platform: [
      { name: 'Browse Films', path: '/films' },
      { name: 'How It Works', path: '/', hash: 'how-it-works' },
      { name: 'Featured Films', path: '/', hash: 'featured' },
      { name: 'Dashboard', path: '/dashboard' },
    ],
    Company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: 'mailto:info@cinevest.com', external: true },
      { name: 'Twitter / X', path: 'https://twitter.com', external: true },
      { name: 'LinkedIn', path: 'https://linkedin.com', external: true },
    ],
    Legal: [
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:info@cinevest.com', label: 'Email' },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-2xl font-bold gradient-text">
              CineVest
            </Link>
            <p className="mt-4 text-muted-foreground text-sm">
              Invest in the future of cinema. Join our platform to support
              groundbreaking film projects and earn returns.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary-500 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4 text-foreground">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.hash ? (
                      <button
                        onClick={() => {
                          if (location.pathname === '/') {
                            document.getElementById(link.hash)?.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            navigate(`${link.path}#${link.hash}`);
                          }
                        }}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.name}
                      </button>
                    ) : link.external ? (
                      <a
                        href={link.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.path}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © {currentYear} CineVest. All rights reserved.
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2 md:mt-0">
            Investing involves risk. Please read our disclaimer before investing.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
