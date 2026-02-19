require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@admin.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (ADMIN_PASSWORD) {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", disabled: false, passwordHash: passwordHash, name: existing.name || "Admin" },
      });
      console.log("Admin user updated. Email:", ADMIN_EMAIL);
    } else {
      await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          passwordHash,
          name: "Admin",
          role: "ADMIN",
          disabled: false,
        },
      });
      console.log("Admin user created. Email:", ADMIN_EMAIL);
    }
  }

  // Seed sample books if none exist
  const bookCount = await prisma.book.count();
  if (bookCount === 0) {
    await prisma.book.createMany({
      data: [
        { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Fiction", description: "A story of decadence and the American Dream.", totalCopies: 3 },
        { title: "1984", author: "George Orwell", genre: "Dystopian", description: "A totalitarian society under constant surveillance.", totalCopies: 2 },
        { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Fiction", description: "Racial injustice in the American South.", totalCopies: 2 },
      ],
    });
    console.log("Sample books created.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
