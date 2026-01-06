"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Shield, Sparkles, QrCode, Lock, Zap, Gift, ArrowRight, Check, ChevronDown, Github, Twitter, ExternalLink, Rocket } from "lucide-react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/wallet-button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { connected } = useWallet();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background relative overflow-hidden grainy selection:bg-primary/30 selection:text-primary-foreground">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      <Header />

      <div className="relative z-10">
        <HeroSection />
        <FeaturedCards />
        <ProcessSection />
        <RoadmapSection />
        <FAQSection />
      </div>
      <Footer />
    </main>
  );
}

function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="relative pt-40 pb-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Solana Red Packets</span>
            </div>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
          >
            SEND WEALTH <br />
            <span className="text-primary italic font-light">INSTANTLY</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-sans"
          >
            Create private, expiring SOL & USDC drops with one tap. 
            Digital traditions, secured by Solana's lightning speed.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="scale-110">
              <WalletButton />
            </div>
            {connected && (
              <Link href="/dashboard?tab=create">
                <button className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-105 transition-all flex items-center gap-2 group shadow-xl shadow-primary/20">
                  <Plus className="h-5 w-5" />
                  Create Red Packet
                </button>
              </Link>
            )}
            <Link href="/#faq">
              <button className="px-8 py-3.5 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-muted transition-all flex items-center gap-2 group">
                How it works
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedCards() {
  const features = [
    {
      icon: Shield,
      title: "Escrow Protection",
      description: "USDC is locked in secure program-controlled PDAs until claimed."
    },
    {
      icon: QrCode,
      title: "QR Code Magic",
      description: "Generate instant QR codes that recipients can scan to claim."
    },
    {
      icon: Lock,
      title: "Recipient Verified",
      description: "Only the designated wallet address can claim the gift."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built on Solana for sub-second confirmations and minimal fees."
    }
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              The <span className="text-primary italic">Secure</span> Way <br />
              to Gift on Chain
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg">
              SolPacket combines ancient tradition with modern security. 
              Our escrow system ensures your funds are safe and only reachable by the right eyes.
            </p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <feature.icon className="h-24 w-24 text-primary" />
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Sync Wallet",
      description: "Connect your Phantom or Solflare wallet instantly."
    },
    {
      number: "02",
      title: "Forge Gift",
      description: "Specify amount, recipient, and your custom message."
    },
    {
      number: "03",
      title: "Mint Link",
      description: "Secure the funds in escrow and generate a unique QR."
    },
    {
      number: "04",
      title: "Seal & Send",
      description: "Recipient scans and claims. Tradition complete."
    }
  ];

  return (
    <section className="py-32 px-6 bg-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-30" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">Simple. Fast. Final.</h2>
          <p className="text-muted-foreground text-lg">Four steps to bridge the physical and digital gap.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative p-10 rounded-[2.5rem] bg-background border border-border/50 flex flex-col items-center text-center group hover:bg-card transition-colors"
            >
              <div className="text-5xl font-black text-primary/10 mb-6 group-hover:text-primary/20 transition-colors font-heading italic">
                {step.number}
              </div>
              <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-4 bg-primary/20 rounded-full blur-sm" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const phases = [
    {
      phase: "Phase 1",
      title: "Foundation",
      status: "Completed",
      items: [
        "Core escrow smart contract",
        "USDC token support",
        "Basic wallet integration",
        "QR code system"
      ]
    },
    {
      phase: "Phase 2",
      title: "Enhanced",
      status: "In Progress",
      items: [
        "Recipient verification",
        "Message encryption",
        "Mobile-optimized UI",
        "Gift card templates"
      ]
    },
    {
      phase: "Phase 3",
      title: "Expansion",
      status: "Planned",
      items: [
        "Mainnet deployment",
        "Batch gift creation",
        "Custom branding",
        "SPL token support"
      ]
    }
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">The Path Forward</h2>
          <p className="text-muted-foreground text-lg">Building the future of digital gifting on Solana.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {phases.map((phase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-10 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-primary text-xs font-black uppercase tracking-widest block mb-2">{phase.phase}</span>
                  <h3 className="text-3xl font-bold">{phase.title}</h3>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  phase.status === "Completed" 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : phase.status === "In Progress"
                    ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {phase.status}
                </div>
              </div>
              
              <ul className="space-y-4">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is SOLPACKET?",
      answer: "A high-security USDC gift card platform built on Solana. Funds are held in escrow and claimable via QR codes."
    },
    {
      question: "Which tokens are supported?",
      answer: "Currently USDC on Devnet. We're expanding to SOL and other SPL tokens soon."
    },
    {
      question: "How does the escrow work?",
      answer: "USDC is locked in a program-derived address. Only the recipient's signature can unlock the funds."
    },
    {
      question: "How long are gifts valid?",
      answer: "Gifts last 24 hours. If unclaimed, the sender can recover the funds."
    }
  ];

  return (
    <section id="faq" className="py-32 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">Common Questions</h2>
          <p className="text-muted-foreground text-lg">Everything you need to know about SolPacket.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="rounded-3xl border border-border/50 overflow-hidden bg-background"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-8 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <h3 className="text-xl font-bold">{faq.question}</h3>
                <ChevronDown className={`h-5 w-5 text-primary transition-transform duration-500 ${openIndex === i ? "rotate-180" : ""}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === i ? "max-h-40" : "max-h-0"}`}>
                <p className="px-8 pb-8 text-muted-foreground leading-relaxed font-sans">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
