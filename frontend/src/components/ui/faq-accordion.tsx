"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = { q: string; a: string };
export type FaqGroup = { title: string; items: FaqItem[] };

function FaqRow({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line last:border-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-ink">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden text-sm leading-relaxed text-body transition-all duration-300",
          open ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {a}
      </div>
    </div>
  );
}

export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <div key={group.title}>
          <h2 className="mb-2 font-display text-2xl text-ink">{group.title}</h2>
          <div className="rounded-2xl border border-line px-6">
            {group.items.map((item) => (
              <FaqRow key={item.q} {...item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
