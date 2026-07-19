export const vehicleMakes = [
  "Acura",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "Freightliner",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Maserati",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "MINI",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "Ram",
  "Rolls-Royce",
  "Scion",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
].sort((a, b) => a.localeCompare(b));

const vehicleDataCache = new Map<string, { expires: number; data: string[] }>();
const cacheTtlMs = 1000 * 60 * 60 * 24;

function isValidYear(year: number) {
  return Number.isInteger(year) && year >= 2000 && year <= 2026;
}

function cleanModelName(model: string, make: string) {
  let cleaned = model
    .replace(/\b(2WD|4WD|AWD|FWD|RWD)\b/gi, "")
    .replace(/\b(2Dr|3Dr|4Dr|5Dr)\b/g, "")
    .replace(/\b(2\.0T|3\.0T|4Matic|xDrive|sDrive)\b/gi, "")
    .replace(/\b(Long Range|Standard Range Plus|Standard Range|Mid Range|Performance)\b.*$/i, "")
    .replace(/\b(Blue|HFE|TRX|XRT|FFV|Mud Terrain Tires|Robo taxi|Carbon Aero)\b.*$/i, "")
    .replace(/\b(Sport|Touring|Limited|Premium|Platinum|Base)\b.*$/i, "")
    .replace(/\s+\/.*$/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+\(.*?\)$/g, "")
    .trim();

  if (make === "Tesla") cleaned = cleaned.replace(/^Model ([3SXY]).*$/i, "Model $1");
  if (make === "BMW") {
    cleaned = cleaned
      .replace(/^[iM]?[2]\d{2}.*$/i, "2 Series")
      .replace(/^[iM]?[3]\d{2}.*$/i, "3 Series")
      .replace(/^[iM]?[4]\d{2}.*$/i, "4 Series")
      .replace(/^[iM]?[5]\d{2}.*$/i, "5 Series")
      .replace(/^[iM]?[6]\d{2}.*$/i, "6 Series")
      .replace(/^[iM]?[7]\d{2}.*$/i, "7 Series")
      .replace(/^[iM]?[8]\d{2}.*$/i, "8 Series");
  }
  if (make === "Mercedes-Benz") {
    cleaned = cleaned
      .replace(/^AMG C.*$/i, "C-Class")
      .replace(/^AMG E.*$/i, "E-Class")
      .replace(/^AMG S.*$/i, "S-Class")
      .replace(/^AMG G(?!L).*$/i, "G-Class")
      .replace(/^AMG CLA.*$/i, "CLA-Class")
      .replace(/^AMG CLS.*$/i, "CLS-Class")
      .replace(/^AMG GLA.*$/i, "GLA-Class")
      .replace(/^AMG GLC.*$/i, "GLC-Class")
      .replace(/^AMG GLE.*$/i, "GLE-Class")
      .replace(/^AMG GLS.*$/i, "GLS-Class")
      .replace(/^AMG GT.*$/i, "AMG GT")
      .replace(/^C\d.*$/i, "C-Class")
      .replace(/^E\d.*$/i, "E-Class")
      .replace(/^S\d.*$/i, "S-Class")
      .replace(/^CLA\d.*$/i, "CLA-Class")
      .replace(/^CLS\d.*$/i, "CLS-Class")
      .replace(/^GLA\d.*$/i, "GLA-Class")
      .replace(/^GLC\d.*$/i, "GLC-Class")
      .replace(/^GLE\d.*$/i, "GLE-Class")
      .replace(/^GLS\d.*$/i, "GLS-Class")
      .replace(/^G\d.*$/i, "G-Class");
  }
  if (make === "Porsche") {
    cleaned = cleaned
      .replace(/^(911).*$/i, "$1")
      .replace(/^(718 Boxster).*$/i, "$1")
      .replace(/^(718 Cayman).*$/i, "$1")
      .replace(/^(Cayenne).*$/i, "$1")
      .replace(/^(Macan).*$/i, "$1")
      .replace(/^(Panamera).*$/i, "$1");
  }
  if (make === "Ford") {
    cleaned = cleaned
      .replace(/^F150.*$/i, "F-150")
      .replace(/^F250.*$/i, "F-250")
      .replace(/^F350.*$/i, "F-350");
  }

  cleaned = cleaned
    .replace(/^(Colorado|Corvette|Elantra|Ioniq 5|Ioniq 6|Santa Cruz|Santa Fe|Accord|Civic|CR-V|HR-V|Pilot|Passport|Ridgeline|Odyssey)\s+.+$/i, "$1")
    .trim();

  return cleaned;
}

function isModelLikeTrimOrIncomplete(model: string) {
  const normalized = model.toLowerCase();
  return (
    !model ||
    normalized === "unknown" ||
    normalized.includes("incomplete") ||
    normalized.includes("not reported") ||
    normalized.includes("trailer") ||
    normalized.includes("chassis") ||
    normalized.includes("cutaway") ||
    normalized.includes("stripped chassis")
  );
}

type FuelEconomyMenuItem = { text?: string; value?: string };

function normalizeMenuItems(menuItem: FuelEconomyMenuItem | FuelEconomyMenuItem[] | undefined) {
  if (!menuItem) return [];
  return Array.isArray(menuItem) ? menuItem : [menuItem];
}

async function fetchFuelEconomyMenu(path: string, params: Record<string, string | number>) {
  const url = new URL(`https://www.fueleconomy.gov/ws/rest/vehicle/menu/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!response.ok) {
    throw new Error("Vehicle data could not be loaded. Please try again.");
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Vehicle data could not be loaded. Please try again.");
  }
  const body = await response.json() as { menuItem?: FuelEconomyMenuItem | FuelEconomyMenuItem[] };
  return normalizeMenuItems(body.menuItem).map((item) => item.text || item.value || "");
}

async function fetchModelsForMakeYear(year: number, make: string) {
  const models = await fetchFuelEconomyMenu("model", { year, make });

  return [...new Set(models
    .map((model) => cleanModelName(model, make))
    .filter((model) => !isModelLikeTrimOrIncomplete(model)))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function cachedModelsForMakeYear(year: number, make: string) {
  const key = `${year}:${make}`;
  const cached = vehicleDataCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;
  const data = await fetchModelsForMakeYear(year, make);
  vehicleDataCache.set(key, { expires: Date.now() + cacheTtlMs, data });
  return data;
}

export async function getVehicleMakesForYear(year: number) {
  if (!isValidYear(year)) return [];

  const makes = await fetchFuelEconomyMenu("make", { year });
  const available = new Set(makes);
  return vehicleMakes.filter((make) => available.has(make));
}

export async function getVehicleModelsForYearMake(year: number, make: string) {
  if (!isValidYear(year) || !vehicleMakes.includes(make)) return [];
  return cachedModelsForMakeYear(year, make);
}
