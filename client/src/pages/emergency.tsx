import { useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import {
  ArrowRight,
  PhoneCall,
  Clock3,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  Headset,
  Truck,
} from "lucide-react";

const responseMetrics = [
  { label: "Avg dispatch", value: "6 min", icon: Clock3 },
  { label: "Coverage", value: "47 states", icon: MapPin },
  { label: "On-site ETA", value: "45 min", icon: Zap },
];

const workflow = [
  {
    title: "Request support",
    description: "Share your location and what happened. Our AI-assisted triage guides you in under 60 seconds.",
    icon: PhoneCall,
  },
  {
    title: "We dispatch the right tech",
    description: "We match certified heavy-duty techs with the parts and tools for your unit and issue.",
    icon: Truck,
  },
  {
    title: "Track arrival + proof",
    description: "Live ETA, driver badge verification, photos, and repair summary are shared in real time.",
    icon: CheckCircle2,
  },
];

const guarantees = [
  {
    title: "24/7 live dispatch",
    detail: "Human dispatchers back every AI decision to keep you moving day or night.",
  },
  {
    title: "Safety-first",
    detail: "Driver identity verification, DOT-compliant procedures, and incident logging on every job.",
  },
  {
    title: "Transparent pricing",
    detail: "Upfront quote with emergency surcharge breakdown before you confirm the job.",
  },
];

const painkillers = [
  "Blown tire, brake issues, no-starts, coolant leaks",
  "Fuel delivery, lockouts, jump starts, light electrical",
  "Mobile welding + minor structural repairs on the shoulder",
];

export default function EmergencyLanding() {
  const [, setLocation] = useLocation();

  const heroCopy = useMemo(
    () => ({
      headline: "24/7 emergency roadside repair for heavy-duty trucks.",
      subhead: "Talk to dispatch in under a minute, get an ETA you can trust, and keep freight moving.",
    }),
    []
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead
        title="Emergency Truck Repair | 24/7 Roadside Assistance"
        description="Immediate roadside assistance for heavy-duty trucks. Under-60-second triage, verified techs, and live ETA tracking."
      />

      <header className="relative overflow-hidden border-b bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#f97316_0,_transparent_35%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-orange-500 text-white hover:bg-orange-500" variant="default">
                24/7 Live Dispatch
              </Badge>
              <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                DOT-compliant workflows
              </Badge>
              <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                Nationwide coverage
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{heroCopy.headline}</h1>
              <p className="max-w-3xl text-lg text-slate-100 sm:text-xl">{heroCopy.subhead}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="bg-orange-500 text-white shadow-lg hover:bg-orange-600"
                onClick={() => setLocation("/emergency/request")}
                data-testid="button-start-emergency-request"
              >
                Start emergency request
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <a href="tel:1-800-TRUCK-FIX" className="flex items-center">
                  <PhoneCall className="mr-2 h-5 w-5" /> 1-800-TRUCK-FIX
                </a>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {responseMetrics.map(metric => (
                <div
                  key={metric.label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <metric.icon className="h-10 w-10 text-orange-400" />
                  <div>
                    <div className="text-2xl font-semibold">{metric.value}</div>
                    <p className="text-sm text-slate-200">{metric.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-orange-200">
              <ShieldCheck className="h-5 w-5" /> Safety-First Workflow
            </div>
            <ul className="space-y-4 text-slate-100">
              {guarantees.map(guarantee => (
                <li key={guarantee.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-orange-500/30 p-2 text-orange-200">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">{guarantee.title}</p>
                      <p className="text-sm text-slate-200">{guarantee.detail}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
                What we fix roadside
              </div>
              <span className="text-sm text-slate-600">Heavy-duty trucks, reefers, trailers</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {painkillers.map(item => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="rounded-full bg-orange-100 p-2 text-orange-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <p className="text-slate-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold text-orange-600">
                <Headset className="h-5 w-5" /> Live dispatcher + AI triage
              </div>
              <p className="mt-3 text-slate-700">
                You get a human-backed dispatcher validating location, equipment, and safety before sending a tech. We text ETA,
                badge verification, and progress updates to you and your fleet contacts instantly.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Badge variant="secondary">VIN + unit captured</Badge>
                <Badge variant="secondary">Photo + voice notes</Badge>
                <Badge variant="secondary">Geolocation lock</Badge>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldCheck className="h-5 w-5 text-orange-500" /> Incident-proofed workflow
            </div>
            <div className="mt-4 space-y-4">
              {workflow.map(step => (
                <div key={step.title} className="flex gap-3 rounded-xl border bg-slate-50 p-4">
                  <div className="rounded-lg bg-white p-2 shadow-sm">
                    <step.icon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{step.title}</p>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-slate-800">
              <p className="font-semibold text-orange-700">Ready to dispatch?</p>
              <p className="text-sm text-orange-700/90">Start the guided workflow or call dispatch. We respond immediately.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={() => setLocation("/emergency/request")}>
                  Start guided request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100" asChild>
                  <a href="tel:1-800-TRUCK-FIX">Call dispatch now</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">How it works</p>
              <h2 className="text-3xl font-bold text-slate-900">Stay on the road with a predictable emergency workflow.</h2>
              <p className="max-w-3xl text-slate-700">
                Every step is built for drivers on the shoulder and fleet managers who need traceable updates.
              </p>
            </div>
            <Button size="lg" className="bg-orange-500 text-white hover:bg-orange-600" onClick={() => setLocation("/emergency/request")}>
              Launch request
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {workflow.map(step => (
              <div key={step.title} className="rounded-2xl border bg-slate-50 p-6">
                <div className="mb-4 inline-flex rounded-full bg-orange-100 p-3 text-orange-700">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="text-lg font-semibold text-slate-900">{step.title}</p>
                <p className="mt-2 text-sm text-slate-700">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
