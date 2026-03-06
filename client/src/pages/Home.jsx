/**
 * ===========================================
 * Home Page
 * ===========================================
 * 
 * Landing page for CineVest platform.
 * Displays featured films, investment opportunities,
 * and platform information.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, TrendingUp, Users, Shield, Mail, CheckCircle, Loader2, Wallet, BarChart3, Clapperboard, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import FilmCard from '../components/ui/FilmCard';
import SEO from '../components/ui/SEO';
import { FilmGridSkeleton } from '../components/ui/Skeleton';
import api from '../utils/api';

function Home() {
  const location = useLocation();
  const [featuredFilms, setFeaturedFilms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scroll to hash section (e.g. /#how-it-works) on navigation
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      // Small delay to ensure the DOM is rendered
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.hash]);

  useEffect(() => {
    const fetchFilms = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/films/featured');
        setFeaturedFilms(res.data);
      } catch {
        // Silently fail — homepage still works without featured films
        setFeaturedFilms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilms();
  }, []);

  return (
    <div className="min-h-screen">
      <SEO description="Invest in upcoming film projects, track your ROI in real-time, and connect with fellow investors on CineVest." />

      {/* Hero Section */}
      <section className="section relative overflow-hidden">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Invest in the
              <span className="gradient-text"> Future of Cinema</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Join CineVest and become part of groundbreaking film projects.
              Earn returns while supporting the art of storytelling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Start Investing
                </Button>
              </Link>
              <Link to="/films">
                <Button variant="outline" size="lg">
                  Explore Films
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-muted/50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose CineVest?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Film className="w-10 h-10" />}
              title="Premium Films"
              description="Access exclusive investment opportunities in high-quality film productions."
            />
            <FeatureCard
              icon={<TrendingUp className="w-10 h-10" />}
              title="Track ROI"
              description="Monitor your investments and returns with our real-time dashboard."
            />
            <FeatureCard
              icon={<Users className="w-10 h-10" />}
              title="VIP Community"
              description="Connect with fellow investors and industry professionals."
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Secure Payments"
              description="Invest using crypto or traditional payment methods securely."
            />
          </div>
        </div>
      </section>

      {/* Featured Films Section */}
      <section className="section">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Featured Opportunities
            </h2>
            <Link to="/films" className="text-primary-500 hover:text-primary-400">
              View All →
            </Link>
          </div>
          
          {isLoading ? (
            <FilmGridSkeleton count={3} />
          ) : featuredFilms.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredFilms.map((film) => (
                <FilmCard key={film._id} film={film} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No featured films available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Waitlist Section */}
      <WaitlistSection />

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24">
        {/* Background with gradient + subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        {/* Decorative blurs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />

        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-primary-200" />
            <span className="text-sm font-medium text-white/90">Join 2,000+ investors worldwide</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight">
            Ready to Start Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-white">
              Investment Journey?
            </span>
          </h2>

          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
            Earn returns while supporting the next generation of filmmakers. It only takes a few minutes to get started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button
                variant="primary"
                size="lg"
                className="!bg-white !text-primary-700 hover:!bg-white/90 !shadow-xl !shadow-black/20 !px-8 !py-3.5 !text-base !font-bold"
              >
                Create Your Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/films" className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
              Browse Films First
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="card-hover text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 text-primary-500 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// How It Works Section with staggered text animations
function HowItWorksSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: '01',
      icon: <Users className="w-7 h-7" />,
      title: 'Create Your Account',
      description:
        'Sign up in seconds with your email or connect your crypto wallet. It\'s free — no hidden fees, no commitments.',
    },
    {
      number: '02',
      icon: <Clapperboard className="w-7 h-7" />,
      title: 'Browse Film Projects',
      description:
        'Explore curated film investment opportunities. Each project is vetted for quality, market potential, and transparency.',
    },
    {
      number: '03',
      icon: <Wallet className="w-7 h-7" />,
      title: 'Invest Securely',
      description:
        'Choose your amount, pay with crypto or traditional methods, and watch your investment get confirmed on-chain.',
    },
    {
      number: '04',
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'Track & Earn Returns',
      description:
        'Follow your portfolio in real-time from your dashboard. Earn returns as films generate revenue from box office, streaming, and distribution.',
    },
  ];

  return (
    <section id="how-it-works" ref={sectionRef} className="section bg-card/50 border-y border-border">
      <div className="container-custom">
        {/* Heading */}
        <div
          className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="inline-block text-sm font-semibold text-primary-500 tracking-wider uppercase mb-3">
            Simple & Transparent
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">
            From signup to your first return — four straightforward steps to
            start investing in cinema.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`relative group transition-all duration-700 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: isVisible ? `${(i + 1) * 150}ms` : '0ms' }}
            >
              {/* Connector line (hidden on last card & mobile) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-primary-500/40 to-transparent" />
              )}

              <div className="card-hover h-full flex flex-col items-center text-center">
                {/* Step number badge */}
                <span className="text-xs font-bold text-primary-500/60 tracking-widest mb-3">
                  STEP {step.number}
                </span>

                {/* Icon circle */}
                <div className="w-14 h-14 rounded-full bg-primary-500/15 text-primary-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary-500/25 transition-transform duration-300">
                  {step.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`text-center mt-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: isVisible ? '750ms' : '0ms' }}
        >
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Get Started — It's Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Waitlist Section Component
function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await api.post('/waitlist', { email, source: 'homepage' });
      setIsSubmitted(true);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section bg-card border-y border-border">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 text-primary-500 mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay in the Loop
          </h2>
          <p className="text-muted-foreground mb-8">
            Join our waitlist to get exclusive updates on new film opportunities,
            investment tips, and early access to premium features.
          </p>

          {isSubmitted ? (
            <div className="flex items-center justify-center gap-3 text-green-500">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg font-medium">You're on the list!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !email}
                className="whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  'Join Waitlist'
                )}
              </Button>
            </form>
          )}

          <p className="text-sm text-muted-foreground mt-4">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Home;
