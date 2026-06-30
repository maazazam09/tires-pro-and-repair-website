export const BUSINESS = {
  name: "Tire Pro and Repair",
  phone: "(530) 717-1765",
  phoneRaw: "5307171765",
  email: "info@tireproandrepair.com",
  address: "821 Cherry St",
  city: "Chico",
  state: "CA",
  zip: "95928",
  fullAddress: "821 Cherry St, Chico, CA 95928",
  instagram: "https://instagram.com/tireproandrepair",
  instagramHandle: "@tireproandrepair",
} as const;

export const BOOKING_PATH = "/contact#booking";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/reviews", label: "Reviews" },
  { href: "/offers", label: "Offers" },
  { href: "/contact", label: "Contact" },
] as const;

export const SHOP_HOURS_TIME = "9AM to 6PM";

export const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export const DEFAULT_HOURS: Record<string, string> = {
  mon: SHOP_HOURS_TIME,
  tue: SHOP_HOURS_TIME,
  wed: SHOP_HOURS_TIME,
  thu: SHOP_HOURS_TIME,
  fri: SHOP_HOURS_TIME,
  sat: SHOP_HOURS_TIME,
  sun: SHOP_HOURS_TIME,
};

export function buildHoursJson(openingTime = "9AM", closingTime = "6PM") {
  const time = `${openingTime} to ${closingTime}`;
  return JSON.stringify(
    Object.fromEntries(Object.keys(DAY_LABELS).map((day) => [day, time])),
  );
}

export function parseHours(hoursJson: string): Record<string, string> {
  try {
    return JSON.parse(hoursJson) as Record<string, string>;
  } catch {
    return { ...DEFAULT_HOURS };
  }
}

export function parseOpeningClosingTimes(hoursJson: string) {
  const hours = parseHours(hoursJson);
  const sample = hours.mon ?? SHOP_HOURS_TIME;
  const parts = sample.split(/\s+to\s+|-/).map((part) => part.trim()).filter(Boolean);

  return {
    openingTime: parts[0] ?? "9AM",
    closingTime: parts[1] ?? "6PM",
  };
}
