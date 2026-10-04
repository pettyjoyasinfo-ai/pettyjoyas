import { getSettings } from "@/lib/data/settings";
import { resolveIcon } from "@/lib/icons";
import { Flor } from "@/components/ui/flor";

export async function Announcement() {
  const { announcement } = await getSettings();
  if (!announcement.enabled || announcement.items.length === 0) return null;

  return (
    <div className="announcement-bar bg-ink text-white">
      <div className="mx-auto flex h-10 w-full max-w-[1600px] items-center justify-center gap-5 overflow-hidden whitespace-nowrap px-4 text-xs font-medium tracking-wide">
        <span className="tema-rosa-flex shrink-0 items-center gap-2 max-sm:hidden!">
          <Flor className="h-4 w-4 shrink-0 text-white" />
          <span className="uppercase tracking-[0.18em]">Octubre Rosa</span>
        </span>
        {announcement.items.map((item, i) => {
          const Icon = resolveIcon(item.icon);
          // Una sola línea: según el ancho se muestran 1, 2 o todos los avisos.
          const visibility = i === 0 ? "flex" : i === 1 ? "hidden md:flex" : "hidden xl:flex";
          return (
            <span key={i} className={`shrink-0 items-center gap-2 ${visibility}`}>
              <Icon className="h-3.5 w-3.5 shrink-0 text-gold" />
              {item.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
