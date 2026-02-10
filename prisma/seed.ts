import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "marcins91";
  const password = process.env.ADMIN_PASSWORD || "hebanowa10";

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name: "Admin",
      mustChangePass: true,
    },
  });

  console.log(`Admin user created: ${email}`);

  // Demo tag
  await prisma.tag.upsert({
    where: { id: "boulder-tygodnia" },
    update: {},
    create: {
      id: "boulder-tygodnia",
      name: "Boulder Tygodnia",
      targetUrl: "/watch/boulder-tygodnia",
      description: "Pilotazowy tag NFC - boulder tygodnia",
    },
  });

  console.log("Demo tag created: boulder-tygodnia");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
