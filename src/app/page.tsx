"use client";

import { Header } from "@/components/header";
import { Shield, Sparkles, QrCode, Lock, Zap, Gift, ArrowRight, Check, ChevronDown, Github, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/wallet-button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { connected } = useWallet();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <Header />

      <HeroSection />
      <FeaturedCards />
      <ProcessSection />
      <RoadmapSection />
      <FAQSection />
      <Footer />
    </main>
  );
}

function HeroSection() {
  const { connected } = useWallet();
  const router = useRouter();
  
  return (
    <div className="relative z-10 pt-32 pb-20 px-4 hero-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Gift Crypto Like Cash
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Create private, expiring SOL & USDC drops with one tap. Share a QR, they scan and claim — powered by Solana speed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (connected) {
                  router.push("/dashboard/create-form");
                } else {
                  router.push("/login");
                }
              }}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all duration-200 flex items-center gap-2"
            >
              <Gift className="h-5 w-5" />
              Create Gift
            </motion.button>
            <Link href="/#faq">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-zinc-800/50 border border-zinc-700/50 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-all duration-200 flex items-center gap-2"
              >
                Learn More
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeaturedCards() {
  const features = [
    {
      icon: Shield,
      title: "Escrow Protection",
      description: "USDC is locked in secure program-controlled PDAs until claimed by the recipient."
    },
    {
      icon: QrCode,
      title: "QR Code Magic",
      description: "Generate instant QR codes that recipients can scan with any mobile device to claim."
    },
    {
      icon: Lock,
      title: "Recipient Verified",
      description: "Only the designated wallet address can claim the gift - no unauthorized access."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built on Solana for sub-second confirmations and minimal transaction fees."
    }
  ];

  return (
    <div className="relative z-10 py-20 px-4 border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Why Choose SOLPACKET?
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Privacy-first USDC gift cards powered by Solana escrow
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Connect Wallet",
      description: "Link your Phantom or Solflare wallet securely to get started."
    },
    {
      number: "02",
      title: "Create Gift",
      description: "Enter recipient address, USDC amount, and optional message."
    },
    {
      number: "03",
      title: "Generate QR",
      description: "Get a unique QR code linked to the escrow PDA for secure claiming."
    },
    {
      number: "04",
      title: "Share & Claim",
      description: "Recipient scans QR code and claims USDC directly to their wallet."
    }
  ];

  return (
    <div className="relative z-10 py-20 px-4 bg-gradient-to-b from-transparent to-zinc-900/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Four simple steps to USDC gift card creation
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="text-6xl font-bold text-violet-500/20 mb-4">{step.number}</div>
              <h3 className="text-2xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{step.description}</p>
              
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 w-8 h-0.5 bg-gradient-to-r from-violet-500/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoadmapSection() {
  const phases = [
    {
      phase: "Phase 1",
      title: "Foundation",
      status: "Completed",
      items: [
        "Core escrow smart contract deployment",
        "USDC token support",
        "Basic wallet integration",
        "QR code generation system",
        "Database and storage setup"
      ]
    },
    {
      phase: "Phase 2",
      title: "Enhanced Features",
      status: "In Progress",
      items: [
        "Recipient address verification",
        "Advanced message encryption",
        "Mobile-optimized UI/UX",
        "Transaction history and analytics",
        "Gift card templates"
      ]
    },
    {
      phase: "Phase 3",
      title: "Ecosystem Growth",
      status: "Planned",
      items: [
        "Mainnet deployment",
        "Batch gift creation",
        "Custom branding for gifts",
        "API for third-party integrations",
        "Additional SPL token support"
      ]
    }
  ];

  return (
    <div className="relative z-10 py-20 px-4 border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Development Roadmap
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Our journey to revolutionize USDC gift cards
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {phases.map((phase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 hover:border-violet-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-violet-400 font-medium mb-1">{phase.phase}</p>
                  <h3 className="text-2xl font-bold text-white">{phase.title}</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  phase.status === "Completed" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : phase.status === "In Progress"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-zinc-700/50 text-zinc-400 border border-zinc-700"
                }`}>
                  {phase.status}
                </div>
              </div>
              
              <ul className="space-y-3">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is SOLPACKET?",
      answer: "SOLPACKET is a USDC gift card platform on Solana. Create gift cards with USDC that are held in escrow until claimed by the designated recipient."
    },
    {
      question: "Which tokens are supported?",
      answer: "Currently we exclusively support USDC on Solana devnet. All gift cards are created and claimed using USDC only."
    },
    {
      question: "How does the escrow work?",
      answer: "When you create a gift, USDC is transferred to a Program Derived Address (PDA) controlled by our smart contract. Only the designated recipient can claim the funds."
    },
    {
      question: "How long are gifts valid?",
      answer: "Gifts remain claimable for 24 hours after creation. After expiry, unclaimed funds can be recovered by the sender."
    },
    {
      question: "What fees do I pay?",
      answer: "You only pay standard Solana network fees (typically <$0.01). We don't charge any additional platform fees."
    },
    {
      question: "Can anyone claim my gift?",
      answer: "No. Each gift is locked to a specific recipient wallet address. Only the designated recipient can claim the USDC from escrow."
    }
  ];

  return (
    <div id="faq" className="relative z-10 py-20 px-4 bg-gradient-to-b from-zinc-900/30 to-transparent">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-zinc-400">
            Everything you need to know about SOLPACKET
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                <ChevronDown
                  className={`h-5 w-5 text-violet-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-48" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-6 text-zinc-400 leading-relaxed">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-zinc-800/50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-8 mb-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image src="/logo.png" alt="SOLPACKET Logo" width={40} height={40} className="rounded-xl" />
              <div>
                <h3 className="text-lg font-bold text-white">SOLPACKET</h3>
              </div>
            </div>
            <p className="text-zinc-400 mb-4">
              Secure USDC gift cards with escrow protection on Solana.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="https://x.com/solpacket" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                <Twitter className="h-4 w-4 text-zinc-400" />
              </a>
              <a href="https://github.com/NikhilRaikwar/SolPacket" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center hover:bg-zinc-800 transition-colors">
                <Github className="h-4 w-4 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © 2025 SOLPACKET. Built on Solana Devnet.
          </p>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="h-3 w-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Devnet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}