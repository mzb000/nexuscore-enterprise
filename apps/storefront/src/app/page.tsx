"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles, ArrowRight, Bot, X, Send } from "lucide-react";

const DEMO_PRODUCTS = [
  {
    id: "prod-1",
    sku: "NX-Q1-LAPTOP",
    title: "Nexus Quantum X1 Laptop",
    description: "Ultra-fast neural workstation with 64GB Unified RAM and 2TB NVMe PCIe 5.0 SSD.",
    category: "Computing",
    price: 2499.0,
  },
  {
    id: "prod-2",
    sku: "AU-NC-HEADSET",
    title: "Aura Noise-Cancelling Headphones",
    description: "Active acoustic cancellation with 40-hour lossless Bluetooth audio and spatial soundstage.",
    category: "Audio",
    price: 349.0,
  },
  {
    id: "prod-3",
    sku: "NX-RT-GPU",
    title: "Nexus Accelerator Tensor GPU",
    description: "Enterprise local inference engine with 32GB VRAM optimized for quantized LLMs.",
    category: "Hardware",
    price: 1899.0,
  },
  {
    id: "prod-4",
    sku: "SM-SEC-KEY",
    title: "Nexus Titan FIDO2 Hardware Key",
    description: "Physical dual-factor authentication key with NFC and biometric fingerprint reader.",
    category: "Security",
    price: 85.0,
  },
];

export default function Home() {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your NexusCore AI Concierge. How can I assist you with products, order status, or technical specifications today?" }
  ]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    // Simulate LangGraph RAG response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Thank you for your inquiry about "${userMsg.content}". Our catalog confirms stock availability with a 30-day return policy and full manufacturer warranty. Would you like me to reserve one in your cart?`,
        },
      ]);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar onOpenAI={() => setIsAiOpen(true)} />

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-sky-950/20 via-slate-950 to-slate-950 px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next.js 15 &bull; React 19 &bull; LangGraph Autonomous AI</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Autonomous Commerce, <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-teal-300 bg-clip-text text-transparent">
              Engineered at Scale.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Experience real-time stock sync, distributed transaction sagas, and semantic hybrid vector search powered by a polyglot microservice backbone.
          </p>

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => setIsAiOpen(true)}
              className="flex items-center space-x-2 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition-all"
            >
              <span>Chat with AI Concierge</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <main className="mx-auto max-w-7xl px-6 py-16 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Featured Enterprise Catalog</h2>
            <p className="text-sm text-slate-400">Directly synchronized with MongoDB & Elasticsearch cluster</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_PRODUCTS.map((prod) => (
            <ProductCard key={prod.id} {...prod} />
          ))}
        </div>
      </main>

      {/* AI Concierge Drawer / Modal */}
      {isAiOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-slate-900 border-l border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Bot className="h-5 w-5" />
              <h3 className="font-semibold text-white">AI Concierge & RAG Agent</h3>
            </div>
            <button
              onClick={() => setIsAiOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-200 border border-slate-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about products, warranty, policies..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="rounded-lg bg-sky-500 p-2 text-white hover:bg-sky-400 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
