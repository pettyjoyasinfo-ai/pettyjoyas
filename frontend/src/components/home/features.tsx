import { getSettings } from "@/lib/data/settings";
import { resolveIcon } from "@/lib/icons";

export async function Features() {
  const { features } = await getSettings();
  if (features.items.length === 0) return null;

  return (
    <section className="border-b border-line">
      <div className="container-px grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
        {features.items.map((item, i) => {
          const Icon = resolveIcon(item.icon);
          return (
            <div key={i} className="flex items-center gap-3.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-stone-bg text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                {item.text && <p className="text-xs text-muted">{item.text}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
