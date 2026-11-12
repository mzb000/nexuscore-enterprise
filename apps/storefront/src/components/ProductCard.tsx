"use client";

import React from "react";
import { Plus, Check } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

interface ProductCardProps {
  id: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  price: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  sku,
  title,
  description,
  category,
  price,
}) => {
  const [added, setAdded] = React.useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({ id, sku, title, price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm hover:border-slate-700 hover:shadow-md transition-all">
      <div>
        <span className="inline-block rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
          {category}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400 line-clamp-2">{description}</p>
      </div>

      <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/60">
        <div>
          <span className="text-xs text-slate-500">Price</span>
          <p className="text-xl font-bold text-sky-400">${price.toFixed(2)}</p>
        </div>

        <button
          onClick={handleAdd}
          className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            added
              ? "bg-emerald-600 text-white"
              : "bg-sky-500 text-white hover:bg-sky-400 shadow-md shadow-sky-500/20"
          }`}
        >
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{added ? "Added" : "Add to Cart"}</span>
        </button>
      </div>
    </div>
  );
};
