import {
  Award,
  BadgeCheck,
  BadgePercent,
  Banknote,
  Clock,
  CreditCard,
  Crown,
  Gem,
  Gift,
  Globe,
  Heart,
  Leaf,
  MapPin,
  Medal,
  MessageCircle,
  Package,
  Phone,
  RefreshCcw,
  Repeat,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Set curado de íconos que ofrece el sistema para la barra superior y la
 * barra de beneficios. La clave (string) es lo que se guarda en la config;
 * el componente se resuelve acá. Compartido por la home y el selector del admin.
 */
export const ICONS: Record<string, LucideIcon> = {
  Truck,
  Package,
  Globe,
  MapPin,
  Store,
  ShieldCheck,
  BadgeCheck,
  CreditCard,
  Wallet,
  Banknote,
  BadgePercent,
  Tag,
  Gift,
  Sparkles,
  Star,
  Crown,
  Medal,
  Award,
  Gem,
  Heart,
  Leaf,
  RefreshCcw,
  Repeat,
  Clock,
  Ruler,
  Wrench,
  Phone,
  MessageCircle,
};

/** Nombres disponibles para el selector. */
export const ICON_NAMES = Object.keys(ICONS);

/** Resuelve un nombre de ícono a su componente (con fallback a Sparkles). */
export function resolveIcon(name?: string | null): LucideIcon {
  return (name && ICONS[name]) || Sparkles;
}
