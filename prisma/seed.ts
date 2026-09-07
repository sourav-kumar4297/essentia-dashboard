import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Seed users only — no demo leads (leads come from HubSpot). */
async function main() {
  const users = [
    {
      email: "admin@essentia.com",
      name: "BD Admin",
      role: "ADMIN",
    },
    {
      email: "member@essentia.com",
      name: "BD Member",
      role: "MEMBER",
    },
    {
      email: "souravkumar4297@gmail.com",
      name: "Sourav Kumar",
      role: "SUPERADMIN",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, blocked: false },
      create: u,
    });
  }

  const removed = await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "admin@essentia.local",
          "member@essentia.local",
          "ops@essentia.local",
          "bd@essentia.local",
        ],
      },
    },
  });

  console.log("Seeded users:");
  for (const u of users) console.log(" ", u.role + ":", u.email);
  if (removed.count) {
    console.log(`Removed ${removed.count} legacy .local account(s).`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
