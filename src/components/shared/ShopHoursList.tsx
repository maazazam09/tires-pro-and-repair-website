import { DAY_LABELS, parseHours } from "@/lib/constants";

type ShopHoursListProps = {
  hoursJson: string;
  className?: string;
  itemClassName?: string;
};

export function ShopHoursList({ hoursJson, className, itemClassName }: ShopHoursListProps) {
  const hours = parseHours(hoursJson);

  return (
    <ul className={className}>
      {Object.entries(DAY_LABELS).map(([key, label]) => (
        <li key={key} className={itemClassName}>
          <span>{label}</span>
          <span>{hours[key] ?? "Closed"}</span>
        </li>
      ))}
    </ul>
  );
}