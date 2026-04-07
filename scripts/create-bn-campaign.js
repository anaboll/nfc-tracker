/**
 * Creates "Biura Nieruchomości Bydgoszcz" campaign under TwojeNFC client
 * with 34 pre-defined tags, one per real estate agency.
 *
 * Each tag has a hardcoded 4-char code (so local and production share the same
 * links). Idempotent — safe to run multiple times; won't overwrite existing tags.
 *
 * Each tag redirects to https://twojenfc.pl/#jak-to-dziala (tracking happens via
 * the HashTracker client component when the hash matches #jak-to-dziala/CODE).
 *
 * Usage (inside app container):
 *   docker exec nfc_app node /app/scripts/create-bn-campaign.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CLIENT_SLUG = "twojenfc";
const CAMPAIGN_NAME = "Biura Nieruchomości Bydgoszcz";
const TARGET_URL = "https://twojenfc.pl/#jak-to-dziala";

// 34 agencies with hardcoded unique codes.
// Codes use only safe characters (no 0/O, no 1/I/L) to avoid visual confusion.
const AGENCIES = [
  { code: "2BPE", nazwa: "Pracownia Nieruchomości",       osoba: "Aleksandra Kunach / Michał Pacoszyński", email: "biuro@pracownia-nieruchomosci.pl" },
  { code: "4UGF", nazwa: "Makler Nieruchomości",          osoba: "Justyna i Jarek Jędryczka",               email: "biuro@bydgoskimakler.pl" },
  { code: "6VPC", nazwa: "Atelier Nieruchomości",         osoba: "Michał Kilkowski",                        email: "biuro@atelier.bydgoszcz.pl" },
  { code: "8NHG", nazwa: "Biuro Nieruchomości Ojczenasz", osoba: "Bogusław Ojczenasz",                      email: "biuro@ojczenasz.com" },
  { code: "CSQA", nazwa: "Północ Nieruchomości Bydgoszcz", osoba: "Michał Wiśniewski",                      email: "bydgoszcz@polnoc.pl" },
  { code: "DSFG", nazwa: "Sfera Nieruchomości",           osoba: "",                                        email: "biuro@sfera.nieruchomosci.pl" },
  { code: "KNSB", nazwa: "Biała Posesja Nieruchomości",   osoba: "Violetta Zdrojewska",                     email: "info@bialaposesja.pl" },
  { code: "PKGR", nazwa: "Dobre Nieruchomości",           osoba: "Grażyna Górniak",                         email: "kontakt@dobrenieruchomosci.eu" },
  { code: "463S", nazwa: "Metro Nieruchomości Bydgoszcz", osoba: "Anna Krygier",                            email: "a.krygier@metro.bydgoszcz.pl" },
  { code: "UER4", nazwa: "Bydgoskie Centrum Nieruchomości", osoba: "",                                      email: "biuro@bcn.nieruchomosci.pl" },
  { code: "YE9Y", nazwa: "Simple Biuro Nieruchomości",    osoba: "",                                        email: "bok@grupasimple.pl" },
  { code: "2YHT", nazwa: "Jagła Nieruchomości",           osoba: "",                                        email: "biuro@jagla.pl" },
  { code: "BX53", nazwa: "Kancelaria Nieruchomości CLASS", osoba: "",                                       email: "sekretariat@class.com.pl" },
  { code: "45PC", nazwa: "Nieruchomości Apartament",      osoba: "",                                        email: "joannam@nieruchomosci-apartament.pl" },
  { code: "GZ84", nazwa: "Housing Market",                osoba: "",                                        email: "bydgoszcz@housingmarket.pl" },
  { code: "J8DT", nazwa: "Forma Nieruchomości",           osoba: "Martyna / Adam Grodkiewicz",              email: "biuro@forma-nieruchomosci.pl" },
  { code: "XDZR", nazwa: "IDEA Nieruchomości",            osoba: "",                                        email: "agata@ideanieruchomosci.com" },
  { code: "682P", nazwa: "Rodźko Nieruchomości",          osoba: "",                                        email: "rodzko@rodzko.pl" },
  { code: "BRFF", nazwa: "HORYZONT Nieruchomości",        osoba: "",                                        email: "biuro@horyzont.nieruchomosci.pl" },
  { code: "PBKJ", nazwa: "Rezydent Nieruchomości",        osoba: "",                                        email: "biuro@rezydent.bydgoszcz.pl" },
  { code: "4G68", nazwa: "Meritum Nieruchomości",         osoba: "",                                        email: "centrum@meritum-nieruchomosci.pl" },
  { code: "GCFD", nazwa: "DREAM HOUSE Biuro Nieruchomości", osoba: "Paulina Gawrońska",                     email: "dreamhouse@dhnieruchomosci.com.pl" },
  { code: "6WBU", nazwa: "LIBERA Nieruchomości",          osoba: "Sabina Libera",                           email: "biuro@libera.nieruchomosci.pl" },
  { code: "BYC5", nazwa: "Atlantis Nieruchomości",        osoba: "Daniel Grochocki",                        email: "biuro@atlantisnieruchomosci.com" },
  { code: "7ZAE", nazwa: "DM Nieruchomości",              osoba: "Dawid Mikołajski",                        email: "dm@dmnieruchomosci.pl" },
  { code: "M9HG", nazwa: "Bydgoscy Zarządcy Nieruchomości", osoba: "",                                      email: "kontakt@bydgoscy.com" },
  { code: "VXEZ", nazwa: "Metrohouse Bydgoszcz",          osoba: "",                                        email: "bydgoszcz@metrohouse.pl" },
  { code: "PHBP", nazwa: "Art-Centrum Nieruchomości",     osoba: "",                                        email: "biuro@art-centrum.eu" },
  { code: "6SES", nazwa: "OLIMP Nieruchomości",           osoba: "",                                        email: "biuro@olimp-nieruchomosci.com" },
  { code: "6XEQ", nazwa: "Domator Nieruchomości",         osoba: "Andrzej Owczarski",                       email: "biuro@domatornieruchomosci.pl" },
  { code: "AR8E", nazwa: "M-6 Nieruchomości",             osoba: "Paweł Warszawski",                        email: "biuro@m-6.pl" },
  { code: "RQSP", nazwa: "SWITALA Nieruchomości",         osoba: "Dariusz Świtala",                         email: "kontakt@dariuszswitala.pl" },
  { code: "AYVZ", nazwa: "Centrum Nieruchomości",         osoba: "Honorata Witczak",                        email: "honorata.witczak@centrum.nieruchomosci.pl" },
  { code: "D6VC", nazwa: "Golden Home Nieruchomości",     osoba: "",                                        email: "kontakt@golden-home.nieruchomosci.pl" },
  // Added in second batch — agencies that originally had no code
  { code: "H7M2", nazwa: "EFEKT Nieruchomości",            osoba: "",                                        email: "efekt@efekt.bydgoszcz.pl" },
  { code: "F4X6", nazwa: "Freedom Nieruchomości Bydgoszcz", osoba: "",                                       email: "biuro@freedom.pl" },
  // Added in second batch — newly researched Bydgoszcz agencies
  { code: "T8GR", nazwa: "House Team Nieruchomości & Finanse", osoba: "Roksana Musiał-Dominiak / Marcin Głowacki", email: "biuro@house-team.pl" },
  { code: "J5WK", nazwa: "JAWA Nieruchomości",             osoba: "",                                        email: "biuro@jawanieruchomosci.pl" },
  { code: "P9TY", nazwa: "PRESTIGE Nieruchomości",         osoba: "Iwona Fryszkowska",                       email: "iwonaf@nieruchomosci-prestige.com" },
  { code: "E3QN", nazwa: "DOM EXPERT Nieruchomości",       osoba: "Marta Domrzalska",                        email: "martadomrzalska@gmail.com" },
];

async function main() {
  console.log(`\n=== BN campaign: ensuring ${AGENCIES.length} agencies ===\n`);

  // 1. Find TwojeNFC client
  const client = await prisma.client.findUnique({ where: { slug: CLIENT_SLUG } });
  if (!client) throw new Error(`Client with slug '${CLIENT_SLUG}' not found`);
  console.log(`Client: ${client.name} (${client.id})`);

  // 2. Create or find campaign (idempotent)
  let campaign = await prisma.campaign.findFirst({
    where: { name: CAMPAIGN_NAME, clientId: client.id },
  });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: { name: CAMPAIGN_NAME, clientId: client.id },
    });
    console.log(`Created campaign: ${campaign.name} (${campaign.id})`);
  } else {
    console.log(`Campaign exists: ${campaign.name} (${campaign.id})`);
  }

  // 3. Upsert hash-tracker tags (idempotent)
  // Each agency gets TWO tags:
  //   - id=CODE              -> tracks #jak-to-dziala/CODE (hash tracker on landing page)
  //   - id=wizytowka-CODE    -> tracks /s/wizytowka/CODE (server redirect to vCard)
  let createdHash = 0;
  let createdVcard = 0;
  let existedHash = 0;
  let existedVcard = 0;

  for (const agency of AGENCIES) {
    // --- Hash tracker tag ---
    const existingHash = await prisma.tag.findUnique({ where: { id: agency.code } });
    if (existingHash) {
      existedHash++;
      console.log(`  exists [hash]:    ${agency.code} -> ${agency.nazwa}`);
    } else {
      await prisma.tag.create({
        data: {
          id: agency.code,
          name: agency.nazwa,
          tagType: "url",
          targetUrl: TARGET_URL,
          description: `Email kampania (jak to dziala) - ${agency.osoba || agency.email}`,
          isActive: true,
          clientId: client.id,
          campaignId: campaign.id,
        },
      });
      createdHash++;
      console.log(`  created [hash]:   ${agency.code} -> ${agency.nazwa}`);
    }

    // --- vCard tracker tag ---
    const vcardId = `wizytowka-${agency.code}`;
    const existingVcard = await prisma.tag.findUnique({ where: { id: vcardId } });
    if (existingVcard) {
      existedVcard++;
      console.log(`  exists [vcard]:   ${vcardId} -> ${agency.nazwa}`);
    } else {
      await prisma.tag.create({
        data: {
          id: vcardId,
          name: `Wizytówka -> ${agency.nazwa}`,
          tagType: "url",
          targetUrl: "/vcard/wizytowka",
          description: `Email kampania (wizytowka) - ${agency.osoba || agency.email}`,
          isActive: true,
          clientId: client.id,
          campaignId: campaign.id,
        },
      });
      createdVcard++;
      console.log(`  created [vcard]:  ${vcardId} -> ${agency.nazwa}`);
    }
  }

  console.log(`\nDone.`);
  console.log(`  Hash tracker tags:  created ${createdHash}, existed ${existedHash}`);
  console.log(`  vCard tracker tags: created ${createdVcard}, existed ${existedVcard}`);
  console.log(`  Total expected:     ${AGENCIES.length * 2} (${AGENCIES.length} hash + ${AGENCIES.length} vcard)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
