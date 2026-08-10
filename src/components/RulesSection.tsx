"use client";

import rules from "@/data/rules.json";
import { CollapsibleSection } from "./CollapsibleSection";

type RulesData = { title: string; sections: { heading: string; items: string[] }[] };
const data = rules as RulesData;

const DISPLAY_TITLE = "Official 1v1 Rules";

export function RulesSection() {
  return (
    <CollapsibleSection title={DISPLAY_TITLE} defaultOpen={false}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {data.sections
          .filter((section) => section.items.length > 0)
          .map((section) => (
            <div key={section.heading}>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-widest text-amber-500">
                {section.heading}
              </h3>
              <ul className="space-y-1 text-sm text-zinc-400">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </CollapsibleSection>
  );
}
