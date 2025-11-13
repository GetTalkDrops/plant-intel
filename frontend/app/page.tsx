// app/page.tsx

import { HeroHeader } from "@/components/hero-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <HeroHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-background to-background dark:from-blue-950/20" />

        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Now accepting pilot programs
            </div>

            <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-7xl">
              Manufacturing Intelligence
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground lg:text-xl">
              Transform your ERP and MES data into actionable insights. Map your
              files once, get intelligent analysis every time.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/dashboard">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="relative rounded-2xl border bg-gradient-to-br from-background to-muted/30 p-2 shadow-2xl backdrop-blur-sm">
              <div className="aspect-video rounded-xl border bg-background/50 backdrop-blur-sm">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Dashboard Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12"></footer>
    </div>
  );
}
