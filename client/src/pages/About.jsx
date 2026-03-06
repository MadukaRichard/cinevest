/**
 * ===========================================
 * About Us Page
 * ===========================================
 */

import { Film, Shield, Users, TrendingUp, Globe, Award } from 'lucide-react';
import Card from '../components/ui/Card';
import SEO from '../components/ui/SEO';

const values = [
  {
    icon: <Film className="w-8 h-8" />,
    title: 'Cinema Innovation',
    description:
      'We believe in democratizing film investment, making it accessible to everyone who wants to be part of the cinematic world.',
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Trust & Security',
    description:
      'Every transaction is secured with blockchain technology. Your investments are protected by industry-leading security protocols.',
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: 'Community First',
    description:
      'Our community of investors and filmmakers collaborate transparently. Together we bring stories to life.',
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Sustainable Returns',
    description:
      'We carefully vet every project to maximize ROI potential while ensuring creative integrity.',
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: 'Global Reach',
    description:
      'CineVest connects filmmakers and investors from around the world, breaking down geographic barriers.',
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: 'Quality Content',
    description:
      'We only feature projects that meet our rigorous quality standards and have strong commercial potential.',
  },
];

const stats = [
  { label: 'Films Funded', value: '50+' },
  { label: 'Total Invested', value: '$12M+' },
  { label: 'Active Investors', value: '5,000+' },
  { label: 'Average ROI', value: '18%' },
];

function About() {
  return (
    <div className="min-h-screen">
      <SEO title="About" description="Learn about CineVest's mission to democratize film investment and connect creators with investors." />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="gradient-text">CineVest</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            CineVest is revolutionizing how films are funded. We connect
            visionary filmmakers with passionate investors, creating a
            transparent and rewarding ecosystem for everyone in the world of
            cinema.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold gradient-text">
                  {stat.value}
                </p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4">
        <div className="container-custom max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            To democratize film investment and empower both filmmakers and
            investors. By leveraging blockchain technology and a transparent
            platform, we're breaking down the barriers that have traditionally
            kept film investment exclusive to industry insiders and venture
            capitalists.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-card border-y border-border">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((item) => (
              <Card key={item.title} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 text-primary-500 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team / CTA */}
      <section className="py-20 px-4">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Join the Revolution
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Whether you're a filmmaker seeking funding or an investor looking
            for the next big opportunity, CineVest is the platform for you.
          </p>
          <a
            href="/signup"
            className="btn-primary inline-block px-8 py-3 rounded-lg font-semibold"
          >
            Get Started Today
          </a>
        </div>
      </section>
    </div>
  );
}

export default About;
