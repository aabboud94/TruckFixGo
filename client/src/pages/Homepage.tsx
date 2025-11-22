import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SEOHead from "@/components/SEOHead";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  CheckCircle,
  Clock,
  Gauge,
  MapPin,
  Menu,
  Phone,
  Shield,
  Star,
  Target,
  Truck,
  Users,
  Wrench,
  X,
  Globe2,
  ClipboardList,
  Timer
} from "lucide-react";

import heroEmergencyImage from "@assets/generated_images/Hero_emergency_truck_repair_5d0a67fb.png";
import beforeAfterImage from "@assets/generated_images/Before_after_truck_repair_3bf1fc17.png";
import fleetMaintenanceImage from "@assets/generated_images/Fleet_maintenance_service_e4d45b61.png";
import tireServiceImage from "@assets/generated_images/Professional_tire_service_ba62f28d.png";

export default function Homepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEOHead
        title="Mobile Truck Repair & Fleet Support | 24/7 Roadside Service | TruckFixGo"
        description="24/7 mobile truck repair, preventative maintenance, and emergency roadside support for fleets and owner-operators. Professional technicians, transparent pricing, and rapid dispatch wherever you are."
        canonical="https://truckfixgo.com/"
      />

      {/* Top contact bar */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 text-sm">
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600 text-white font-semibold">Live 24/7</Badge>
            <div className="flex items-center gap-2 text-white/80">
              <Phone className="h-4 w-4" />
              <span>Emergency desk: (800) 555-TRUCK</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-white/80">
              <Clock className="h-4 w-4" />
              <span>Average dispatch confirmation in under 10 minutes</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-white/80">
            <Shield className="h-4 w-4" />
            <span>Certified technicians | Fully insured</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-emerald-600" />
              <div>
                <span className="text-xl font-bold tracking-tight">TruckFixGo</span>
                <p className="text-xs text-slate-500">Mobile truck repair & fleet support</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
              <a href="/services" className="hover:text-emerald-700" data-testid="link-services">Services</a>
              <a href="/pricing" className="hover:text-emerald-700" data-testid="link-pricing">Pricing</a>
              <a href="/fleet" className="hover:text-emerald-700" data-testid="link-fleet">Fleet programmes</a>
              <a href="/contractor/apply" className="hover:text-emerald-700" data-testid="link-become-contractor">Join our network</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="secondary"
                className="border-slate-300 text-slate-800"
                onClick={() => handleNavigate("/scheduled-booking")}
                data-testid="button-schedule-header"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book service
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={() => handleNavigate("/emergency")}
                data-testid="button-emergency-header"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Emergency support
              </Button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md border border-slate-200"
              aria-label="Toggle navigation"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 text-sm font-semibold text-slate-800">
              <a href="/services" className="block px-2" data-testid="mobile-link-services">Services</a>
              <a href="/pricing" className="block px-2" data-testid="mobile-link-pricing">Pricing</a>
              <a href="/fleet" className="block px-2" data-testid="mobile-link-fleet">Fleet programmes</a>
              <a href="/contractor/apply" className="block px-2" data-testid="mobile-link-become-contractor">Join our network</a>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => handleNavigate("/emergency")}
                  data-testid="mobile-button-emergency"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Emergency support
                </Button>
                <Button
                  variant="secondary"
                  className="border-slate-300 text-slate-800"
                  onClick={() => handleNavigate("/scheduled-booking")}
                  data-testid="mobile-button-schedule"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book service
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_10%_20%,_#10b981,_transparent_25%),radial-gradient(circle_at_80%_0%,_#22c55e,_transparent_20%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center relative">
          <div className="space-y-6">
            <Badge className="bg-white/10 text-white border border-white/20 px-3 py-1">Professional mobile repair</Badge>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight">
              Reliable roadside assistance for every journey
            </h1>
            <p className="text-lg text-white/80 max-w-2xl">
              Keep your fleet and drivers moving with rapid-response technicians, transparent updates, and preventative maintenance built around your routes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={() => handleNavigate("/emergency")}
                data-testid="button-hero-emergency"
              >
                <Phone className="w-5 h-5 mr-2" />
                Request emergency help
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20"
                onClick={() => handleNavigate("/scheduled-booking")}
                data-testid="button-hero-scheduled"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule maintenance
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              {[{
                title: "Under 60 min", subtitle: "Average on-site arrival in active regions"
              }, {
                title: "4.8/5", subtitle: "Service rating from fleet partners"
              }, {
                title: "2,500+", subtitle: "Vehicles supported last quarter"
              }].map((stat) => (
                <div key={stat.title} className="rounded-xl border border-white/15 bg-white/5 p-4">
                  <div className="text-2xl font-bold">{stat.title}</div>
                  <p className="text-sm text-white/70">{stat.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-sm">
              <img src={heroEmergencyImage} alt="Technician providing mobile truck repair" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-8 left-6 bg-white text-slate-900 rounded-2xl shadow-xl p-4 w-[260px] border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-800">Live job tracking</p>
              </div>
              <p className="text-sm text-slate-600">
                Drivers receive status updates, technician ETA, and contact details automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Why teams choose TruckFixGo</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Balanced support for fleets and owner-operators</h2>
              <p className="text-base text-slate-600 max-w-2xl mt-2">
                From a single vehicle to nationwide fleets, we combine rapid response with preventative care to keep utilisation high and downtime low.
              </p>
            </div>
            <Button
              variant="secondary"
              className="border-slate-300 text-slate-800"
              onClick={() => handleNavigate("/login")}
              data-testid="button-start-account"
            >
              Create account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[{
              title: "24/7 dispatch", description: "Specialists triage requests immediately and allocate the nearest vetted technician.", icon: Clock
            }, {
              title: "Transparent pricing", description: "Clear estimates, approval workflows, and digital invoices for every job.", icon: Shield
            }, {
              title: "Certified expertise", description: "Multi-brand diagnostics, tyres, brakes, hydraulics, electrical, and aftertreatment systems.", icon: Wrench
            }, {
              title: "Global-ready", description: "Neutral communications and multi-lingual updates keep international teams aligned.", icon: Globe2
            }, {
              title: "Driver-first updates", description: "SMS/email progress tracking so drivers know when help arrives.", icon: Target
            }, {
              title: "Data you can use", description: "Service history, maintenance reminders, and uptime reports for every vehicle.", icon: Gauge
            }].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-slate-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                      <CardDescription className="text-slate-600 text-base mt-2">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service highlights */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm font-semibold text-emerald-300">On-site specialists</p>
              <h2 className="text-3xl sm:text-4xl font-black">Repairs that meet your standards</h2>
              <p className="text-base text-white/80 max-w-2xl mt-2">
                We pair experienced technicians with modern diagnostics to resolve issues at the roadside, yard, or depot with the same care as a workshop visit.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-white/10 border border-white/20 text-white">ISO-aligned processes</Badge>
              <Badge className="bg-white/10 border border-white/20 text-white">Digital sign-off</Badge>
              <Badge className="bg-white/10 border border-white/20 text-white">Safety-first approach</Badge>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[{
              title: "Emergency roadside",
              description: "Breakdowns, no-starts, aftertreatment faults, and warning lights diagnosed on the spot.",
              image: beforeAfterImage
            }, {
              title: "Tyres & wheels",
              description: "Tyre replacement, balancing, and wheel torque checks with premium inventory on hand.",
              image: tireServiceImage
            }, {
              title: "Preventative maintenance",
              description: "Scheduled servicing, inspections, and fluid analysis to avoid unplanned stops.",
              image: fleetMaintenanceImage
            }, {
              title: "Fleet projects",
              description: "Multi-vehicle updates, seasonal readiness, and compliance checks coordinated centrally.",
              image: heroEmergencyImage
            }].map((card) => (
              <Card key={card.title} className="bg-white/5 border border-white/10 overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-44 overflow-hidden">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 space-y-2">
                    <CardTitle className="text-lg font-bold text-white">{card.title}</CardTitle>
                    <CardDescription className="text-white/80 text-sm leading-relaxed">
                      {card.description}
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Simple workflow</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">From request to repair with clear updates</h2>
              <p className="text-base text-slate-600 mt-3">
                The TruckFixGo platform keeps dispatchers, drivers, and finance aligned. Submit requests from web or mobile, track arrival times, and receive digital reports once work is complete.
              </p>

              <div className="mt-6 space-y-4">
                {[{
                  title: "Share the issue",
                  detail: "Log the vehicle, location, symptoms, and urgency so we can dispatch accurately."
                }, {
                  title: "Approve with confidence",
                  detail: "Receive a clear estimate and confirm with a single tap. Optional approvals for fleets."
                }, {
                  title: "Track progress",
                  detail: "See technician ETA, parts on hand, and completion notes in real time."
                }].map((step, index) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{step.title}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>Digital job cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  <span>Audit-ready history</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-emerald-600" />
                  <span>Realistic ETAs</span>
                </div>
              </div>
            </div>

            <Card className="border-slate-200 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Live portal</Badge>
                  <span className="text-xs text-slate-500">Sample timeline</span>
                </div>
                <div className="space-y-3 text-sm">
                  {[{
                    label: "08:12", text: "Driver reports coolant leak near exit 14."
                  }, {
                    label: "08:14", text: "Dispatch assigns technician 3. Parts confirmed on vehicle."
                  }, {
                    label: "08:21", text: "ETA shared with driver and dispatcher."
                  }, {
                    label: "09:02", text: "Repair completed. Photo proof and notes uploaded."
                  }].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-14 text-xs font-semibold text-slate-500">{item.label}</div>
                      <div className="flex-1 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="bg-slate-200" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Avg. acceptance time</p>
                    <p className="text-xl font-bold text-slate-900">7 minutes</p>
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => handleNavigate("/login")}
                    data-testid="button-cta-account"
                  >
                    Create account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fleet & owner benefits */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-3">
            <p className="text-sm font-semibold text-emerald-700">Designed for modern operations</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Support that scales with your routes</h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto">
              Whether you manage a regional fleet or work independently, TruckFixGo balances speed, safety, and cost control.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[{
              title: "Fleet leaders",
              detail: "Centralise approvals, billing, and uptime reporting across all locations.",
              icon: Users
            }, {
              title: "Dispatch teams",
              detail: "Standardised request forms, live ETAs, and direct technician contact to reduce driver downtime.",
              icon: MapPin
            }, {
              title: "Owner-operators",
              detail: "Fast assistance, fair pricing, and digital records to keep you on schedule.",
              icon: Truck
            }].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-slate-200 bg-white">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                    <CardDescription className="text-slate-600 text-base leading-relaxed">{item.detail}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-3">
            <p className="text-sm font-semibold text-emerald-700">Trusted partners</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Teams appreciate predictable outcomes</h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto">
              Feedback from logistics leaders and drivers who rely on TruckFixGo to keep commitments on time.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[{
              quote: "TruckFixGo gives us reliable ETAs and keeps finance in the loop with clean invoices. Downtime per incident is down significantly.",
              name: "Logistics Manager",
              role: "International courier fleet",
              rating: 5
            }, {
              quote: "Technicians arrive prepared and communicate clearly. Our drivers feel supported wherever they are.",
              name: "Operations Lead",
              role: "Regional distribution fleet",
              rating: 5
            }, {
              quote: "As an owner-operator, I value transparent pricing and quick approvals. The portal makes it straightforward.",
              name: "Owner-operator",
              role: "Long-haul transport",
              rating: 5
            }].map((testimonial) => (
              <Card key={testimonial.name} className="border-slate-200">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-base text-slate-700 leading-relaxed">“{testimonial.quote}”</p>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-emerald-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wide">Ready when you are</p>
          <h2 className="text-3xl sm:text-4xl font-black">Create your account and keep your schedule on track</h2>
          <p className="text-base text-white/80 max-w-3xl mx-auto">
            Set up once, save vehicle details, payment preferences, and notification settings. Our team monitors requests around the clock.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-slate-50"
              onClick={() => handleNavigate("/login")}
              data-testid="button-final-account"
            >
              Create account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="border-white text-white hover:bg-white/10"
              onClick={() => handleNavigate("/fleet")}
              data-testid="button-final-fleet"
            >
              Talk with fleet team
              <Phone className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-sm mt-4">
            {["Multi-brand diagnostics", "Electronic job records", "Safety-first procedures"].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-emerald-300">Company</p>
              <a href="/about" className="block text-white/80 hover:text-white">About TruckFixGo</a>
              <a href="/contact" className="block text-white/80 hover:text-white">Contact</a>
              <a href="/contractor/apply" className="block text-white/80 hover:text-white">Become a partner</a>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-emerald-300">Services</p>
              <a href="/emergency" className="block text-white/80 hover:text-white" data-testid="footer-link-emergency">Emergency roadside</a>
              <a href="/scheduled-booking" className="block text-white/80 hover:text-white" data-testid="footer-link-scheduled">Preventative maintenance</a>
              <a href="/fleet" className="block text-white/80 hover:text-white" data-testid="footer-link-fleet-solutions">Fleet coordination</a>
              <a href="/services" className="block text-white/80 hover:text-white" data-testid="footer-link-all-services">All services</a>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-emerald-300">Support</p>
              <span className="block text-white/80">24/7 hotline: (800) 555-TRUCK</span>
              <span className="block text-white/80">Email: support@truckfixgo.com</span>
              <span className="block text-white/80">Live chat in portal</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-emerald-300">Compliance</p>
              <span className="block text-white/80">Safety-first operating procedures</span>
              <span className="block text-white/80">Insurance and certification on file</span>
              <span className="block text-white/80">Digital service records</span>
            </div>
          </div>

          <Separator className="bg-white/10 mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Professional mobile truck repair</span>
            </div>
            <p>© {new Date().getFullYear()} TruckFixGo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
