"use client";

import React from "react";
import { ShoppingCart, Bot, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export const Navbar = ({ onOpenAI }: { onOpenAI: () => void }) => {
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">NexusCore</span>
            <span className="ml-2 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
              Enterprise
            </span>
          </div>
        </div>

        <nav className="flex items-center space-x-6">
          <button
            onClick={onOpenAI}
            className="flex items-center space-x-2 rounded-lg bg-indigo-600/20 px-4 py-2 text-sm font-medium text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
          >
            <Bot className="h-4 w-4" />
            <span>AI Concierge</span>
          </button>

          <div className="relative flex items-center cursor-pointer text-slate-300 hover:text-white">
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white shadow-lg shadow-sky-500/50">
                {itemCount}
              </span>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
