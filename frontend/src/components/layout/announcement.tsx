import { getSettings } from "@/lib/data/settings";
import { resolveIcon } from "@/lib/icons";
import { Flor } from "@/components/ui/flor";

export async function Announcement() {
  const { announcement } = await getSettings();
  if (!announcement.enabled || announcement.items.length === 0) return null;

  return (
    <div className="announcement-bar bg-ink text-white">
      <div className="container-px flex h-10 items-center justify-center gap-6 text-xs font-medium tracking-wide">
        <span className="tema-rosa-flex items-center gap-2 max-sm:hidden!">
          <Flor className="h-4 w-4 text-white" />
          <span className="uppercase tracking-[0.18em]">Octubre Rosa</span>
        </span>
        {announcement.items.map((item, i) => {
          const Icon = resolveIcon(item.icon);
          return (
            <span key={i} className={`items-center gap-2 ${i === 0 ? "flex" : "hidden sm:flex"}`}>
              <Icon className="h-3.5 w-3.5 text-gold" />
              {item.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
