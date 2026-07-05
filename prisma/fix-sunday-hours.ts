import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    console.log("No SiteSettings row found (id=1). Nothing to do.");
    return;
  }

  let hours: Record<string, string> = {};
  try {
    hours = JSON.parse(settings.hoursJson) as Record<string, string>;
  } catch (err) {
    console.warn("Failed to parse hoursJson, will overwrite with a minimal object.");
  }

  hours.sun = "9AM to 4PM";

  await prisma.siteSettings.update({ where: { id: 1 }, data: { hoursJson: JSON.stringify(hours) } });

  console.log("Updated SiteSettings.hoursJson.sun to '9AM to 4PM'");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
