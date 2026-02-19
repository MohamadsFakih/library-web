require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@admin.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const SAMPLE_MEDIA = [
  // Movies
  { type: "MOVIE", title: "Inception", creator: "Christopher Nolan", genre: "Sci-Fi", description: "A thief who steals corporate secrets through dream-sharing technology.", releaseDate: new Date("2010-07-16") },
  { type: "MOVIE", title: "The Shawshank Redemption", creator: "Frank Darabont", genre: "Drama", description: "Two imprisoned men bond over a number of years.", releaseDate: new Date("1994-09-23") },
  { type: "MOVIE", title: "Spirited Away", creator: "Hayao Miyazaki", genre: "Animation", description: "A girl wanders into a world of spirits.", releaseDate: new Date("2001-07-20") },
  { type: "MOVIE", title: "Parasite", creator: "Bong Joon-ho", genre: "Thriller", description: "Greed and class discrimination in modern Korea.", releaseDate: new Date("2019-05-30") },
  // Music
  { type: "MUSIC", title: "Blonde", creator: "Frank Ocean", genre: "R&B", description: "Alternative R&B album.", releaseDate: new Date("2016-08-20"), metadata: "Album" },
  { type: "MUSIC", title: "Abbey Road", creator: "The Beatles", genre: "Rock", description: "The Beatles' final album.", releaseDate: new Date("1969-09-26"), metadata: "Album" },
  { type: "MUSIC", title: "Random Access Memories", creator: "Daft Punk", genre: "Electronic", description: "Grammy-winning electronic album.", releaseDate: new Date("2013-05-17"), metadata: "Album" },
  // Games
  { type: "GAME", title: "The Legend of Zelda: Breath of the Wild", creator: "Nintendo", genre: "Action-Adventure", description: "Open-world adventure in Hyrule.", releaseDate: new Date("2017-03-03"), metadata: "Nintendo Switch" },
  { type: "GAME", title: "Elden Ring", creator: "FromSoftware", genre: "RPG", description: "Open-world action RPG.", releaseDate: new Date("2022-02-25"), metadata: "PC, PlayStation, Xbox" },
  { type: "GAME", title: "Hades", creator: "Supergiant Games", genre: "Roguelike", description: "Roguelike dungeon crawler with Greek myth.", releaseDate: new Date("2020-09-17"), metadata: "PC, Nintendo Switch" },
];

async function main() {
  if (ADMIN_PASSWORD) {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", disabled: false, passwordHash, name: existing.name || "Admin" },
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

  const mediaCount = await prisma.media.count();
  if (mediaCount === 0) {
    await prisma.media.createMany({ data: SAMPLE_MEDIA });
    console.log("Sample media (movies, music, games) created.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
