import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Seed users only — no demo leads (leads come from HubSpot). */
async function main() {
  const users = [
    {
      email: "pkv@essentia.in",
      name: "PKV",
      role: "ADMIN",
      team: "business-development",
      profileSetupComplete: false,
    },
    {
      email: "akshin@essentia.in",
      name: "Akshin",
      role: "ADMIN",
      team: "business-development",
      profileSetupComplete: false,
    },
    {
      email: "lavanya@essentia.in",
      name: "Lavanya",
      role: "MEMBER",
      team: "business-development",
      profileSetupComplete: false,
    },
    {
      email: "executive@essentia.in",
      name: "Executive",
      role: "MEMBER",
      team: "business-development",
      profileSetupComplete: false,
    },
    {
      email: "crm.ruby@essentia.in",
      name: "Ruby",
      role: "MEMBER",
      team: "business-development",
      profileSetupComplete: false,
    },
    {
      email: "admin@essentia.com",
      name: "Team Leader",
      role: "ADMIN",
      team: "business-development",
      profileSetupComplete: false,
    },
    {
      email: "member@essentia.com",
      name: "Executive",
      role: "MEMBER",
      team: "business-development",
      profileSetupComplete: false,
    },
    {
      email: "souravkumar4297@gmail.com",
      name: "Sourav Kumar",
      role: "SUPERADMIN",
      team: "business-development",
      profileSetupComplete: true,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        blocked: false,
        team: u.team,
        profileSetupComplete: u.profileSetupComplete,
      },
      create: { ...u, phone: "" },
    });
  }

  console.log("Seeded users:");
  for (const u of users) console.log(" ", u.role + ":", u.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
