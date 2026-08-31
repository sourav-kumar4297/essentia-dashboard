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
      email: "admin@essentia.local",
      name: "BD Admin",
      role: "ADMIN",
    },
    {
      email: "member@essentia.local",
      name: "BD Member",
      role: "MEMBER",
    },
    {
      email: "ops@essentia.local",
      name: "Ops Admin",
      role: "ADMIN",
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
      update: { name: u.name, role: u.role },
      create: u,
    });
  }

  console.log("Seeded users only (no dummy leads):");
  for (const u of users) console.log(" ", u.role + ":", u.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
