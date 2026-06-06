import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

const PRODUCT_NAMES = [
  "Robe Kabyle Azerou",
  "Robe Kabyle Tizi",
  "Robe Kabyle Djurdjura",
  "Robe Kabyle Tamgout",
  "Robe Kabyle Tikjda",
  "Robe Kabyle Akfadou",
  "Robe Kabyle Babor",
  "Robe Kabyle Tababort",
  "Robe Kabyle Lala Khedidja",
  "Robe Kabyle Gouraya",
  "Robe Kabyle Chelata",
  "Robe Kabyle Beni Ghobri",
  "Robe Kabyle Ait Menguellet",
  "Robe Kabyle Ait Yenni",
  "Robe Kabyle Ait Hichem",
  "Robe Kabyle Ouaguenoun",
  "Robe Kabyle Azazga",
  "Robe Kabyle Azzefoun",
  "Robe Kabyle Tigzirt",
  "Robe Kabyle Aokas",
  "Robe Kabyle Bejaia",
  "Robe Kabyle Gouraya Bejaia",
  "Robe Kabyle Tichy",
  "Robe Kabyle Jijel",
  "Robe Kabyle Setif",
  "Robe Kabyle Bouira",
  "Robe Kabyle Boumerdes",
  "Robe Kabyle Mchedallah",
  "Robe Kabyle Larbaa Nath Irathen",
  "Robe Kabyle Ain El Hammam",
];

const FABRICS = [
  "Satin de soie",
  "Velours",
  "Mousseline",
  "Brocart",
  "Coton brodé",
  "Soie traditionnelle",
  "Taffetas",
  "Organza",
  "Duchesse",
  "Crêpe de soie",
];

const COLORS = ["Rouge", "Bleu", "Vert", "Noir", "Blanc", "Or"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const DESCRIPTIONS: Record<string, string> = {
  "Robe Kabyle Azerou":
    "Magnifique robe kabyle traditionnelle inspirée des monts Azerou. Broderies fines au fil d'or sur un tissu de satin lumineux. Parfaite pour les grandes cérémonies et les fêtes traditionnelles.",
  "Robe Kabyle Tizi":
    "Robe kabyle élégante aux motifs de Tizi Ouzou. Finitions soignées avec des broderies héritées de générations de femmes artisanes. Un vêtement qui célèbre l'identité kabyle avec modernité.",
  "Robe Kabyle Djurdjura":
    "Inspirée du majestueux massif du Djurdjura, cette robe kabyle allie tradition et raffinement. Broderies complexes représentant les vallées et les sommets de la chaîne montagneuse.",
  "Robe Kabyle Tamgout":
    "Robe kabyle d'exception aux broderies inspirées du mont Tamgout. Les motifs géométriques traditionnels sont sublimés par des tons chatoyants et des finitions dorées.",
  "Robe Kabyle Tikjda":
    "Robe kabyle évoquant la pureté des cimes enneigées de Tikjda. Broderies délicates sur un tissu fluide et lumineux, idéale pour les occasions spéciales.",
  "Robe Kabyle Akfadou":
    "Cette robe puise son inspiration dans la forêt d'Akfadou. Les broderies rappellent les feuillages et les ramures, dans une palette de couleurs naturelles et chaleureuses.",
  "Robe Kabyle Babor":
    "Robe kabyle inspirée du mont Babor. Motifs ancestraux brodés à la main, perpétuant un savoir-faire unique transmis de mère en fille dans les villages kabyles.",
  "Robe Kabyle Tababort":
    "Élégante robe kabyle aux motifs du mont Tababort. Les broderies traditionnelles sont mises en valeur par des couleurs vibrantes et un tissu de qualité supérieure.",
  "Robe Kabyle Lala Khedidja":
    "Nommée en l'honneur du plus haut sommet du Djurdjura, cette robe est le joyau de notre collection. Broderies somptueuses au fil d'or et d'argent sur un tissu d'exception.",
  "Robe Kabyle Gouraya":
    "Robe kabyle inspirée du parc national de Gouraya. Les motifs marins et terrestres se mêlent dans des broderies d'une grande finesse, reflétant la beauté de la côte kabyle.",
};

function getDescription(index: number): string {
  const name = PRODUCT_NAMES[index];
  if (DESCRIPTIONS[name]) return DESCRIPTIONS[name];
  return `Robe kabyle traditionnelle ${name.replace("Robe Kabyle ", "")}. Confectionnée avec soin par nos artisanes, cette pièce unique allie broderies ancestrales et coupe moderne. Idéale pour les cérémonies, les fêtes et les grandes occasions. Chaque robe est un hommage au patrimoine culturel kabyle.`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(): number {
  const prices = [
    4500, 4800, 5200, 5500, 5800, 6000, 6200, 6500, 6800, 7000, 7200, 7500,
    7800, 8000, 8200, 8500, 8800, 9000, 9200, 9500, 9800, 10000, 10500,
    11000, 11500, 12000, 12500, 13000, 14000, 15000, 16000, 17000, 18000,
  ];
  return prices[randomInt(0, prices.length - 1)];
}

const ALGERIAN_WILAYAS = [
  { code: 1, name: "Adrar", nameAr: "أدرار" },
  { code: 2, name: "Chlef", nameAr: "الشلف" },
  { code: 3, name: "Laghouat", nameAr: "الأغواط" },
  { code: 4, name: "Oum El Bouaghi", nameAr: "أم البواقي" },
  { code: 5, name: "Batna", nameAr: "باتنة" },
  { code: 6, name: "Béjaïa", nameAr: "بجاية" },
  { code: 7, name: "Biskra", nameAr: "بسكرة" },
  { code: 8, name: "Béchar", nameAr: "بشار" },
  { code: 9, name: "Blida", nameAr: "البليدة" },
  { code: 10, name: "Bouira", nameAr: "البويرة" },
  { code: 11, name: "Tamanrasset", nameAr: "تمنراست" },
  { code: 12, name: "Tébessa", nameAr: "تبسة" },
  { code: 13, name: "Tlemcen", nameAr: "تلمسان" },
  { code: 14, name: "Tiaret", nameAr: "تيارت" },
  { code: 15, name: "Tizi Ouzou", nameAr: "تيزي وزو" },
  { code: 16, name: "Alger", nameAr: "الجزائر" },
  { code: 17, name: "Djelfa", nameAr: "الجلفة" },
  { code: 18, name: "Jijel", nameAr: "جيجل" },
  { code: 19, name: "Sétif", nameAr: "سطيف" },
  { code: 20, name: "Saïda", nameAr: "سعيدة" },
  { code: 21, name: "Skikda", nameAr: "سكيكدة" },
  { code: 22, name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس" },
  { code: 23, name: "Annaba", nameAr: "عنابة" },
  { code: 24, name: "Guelma", nameAr: "قالمة" },
  { code: 25, name: "Constantine", nameAr: "قسنطينة" },
  { code: 26, name: "Médéa", nameAr: "المدية" },
  { code: 27, name: "Mostaganem", nameAr: "مستغانم" },
  { code: 28, name: "M'Sila", nameAr: "المسيلة" },
  { code: 29, name: "Mascara", nameAr: "معسكر" },
  { code: 30, name: "Ouargla", nameAr: "ورقلة" },
  { code: 31, name: "Oran", nameAr: "وهران" },
  { code: 32, name: "El Bayadh", nameAr: "البيض" },
  { code: 33, name: "Illizi", nameAr: "إيليزي" },
  { code: 34, name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج" },
  { code: 35, name: "Boumerdès", nameAr: "بومرداس" },
  { code: 36, name: "El Tarf", nameAr: "الطارف" },
  { code: 37, name: "Tindouf", nameAr: "تندوف" },
  { code: 38, name: "Tissemsilt", nameAr: "تيسمسيلت" },
  { code: 39, name: "El Oued", nameAr: "الوادي" },
  { code: 40, name: "Khenchela", nameAr: "خنشلة" },
  { code: 41, name: "Souk Ahras", nameAr: "سوق أهراس" },
  { code: 42, name: "Tipaza", nameAr: "تيبازة" },
  { code: 43, name: "Mila", nameAr: "ميلة" },
  { code: 44, name: "Aïn Defla", nameAr: "عين الدفلى" },
  { code: 45, name: "Naâma", nameAr: "النعامة" },
  { code: 46, name: "Aïn Témouchent", nameAr: "عين تموشنت" },
  { code: 47, name: "Ghardaïa", nameAr: "غرداية" },
  { code: 48, name: "Relizane", nameAr: "غليزان" },
  { code: 49, name: "El M'Ghair", nameAr: "المغير" },
  { code: 50, name: "El Meniaa", nameAr: "المنيعة" },
  { code: 51, name: "Ouled Djellal", nameAr: "أولاد جلال" },
  { code: 52, name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار" },
  { code: 53, name: "Béni Abbès", nameAr: "بني عباس" },
  { code: 54, name: "Timimoun", nameAr: "تيميمون" },
  { code: 55, name: "Touggourt", nameAr: "تقرت" },
  { code: 56, name: "Djanet", nameAr: "جانت" },
  { code: 57, name: "In Salah", nameAr: "عين صالح" },
  { code: 58, name: "In Guezzam", nameAr: "عين قزام" },
];

export async function GET() {
  try {
    // 1. Create admin user
    const hashedPassword = await hash("admin123", 12);
    const admin = await db.user.upsert({
      where: { email: "admin@boutique-kabyles.dz" },
      update: {},
      create: {
        email: "admin@boutique-kabyles.dz",
        name: "Administrateur",
        password: hashedPassword,
        role: "admin",
      },
    });

    // 2. Create Ecotrack settings
    await db.ecotrackSettings.upsert({
      where: { id: "ecotrack-default" },
      update: {},
      create: {
        id: "ecotrack-default",
        apiToken:
          "f3T3yfdoMYkdm3s2608MNEo6IMc5W8TDY0899d7hZqyaTXWP4YcCtr4ZcypY",
        apiUrl: "https://fret.ecotrack.dz",
        active: true,
      },
    });

    // 3. Create wilayas
    for (const wilaya of ALGERIAN_WILAYAS) {
      await db.wilaya.upsert({
        where: { code: wilaya.code },
        update: { name: wilaya.name, nameAr: wilaya.nameAr },
        create: {
          code: wilaya.code,
          name: wilaya.name,
          nameAr: wilaya.nameAr,
        },
      });
    }

    // 4. Create communes for main wilayas
    const COMMUNES_BY_WILAYA: Record<number, string[]> = {
      1: ["Adrar", "Tamest", "Reggane", "In Zghmir", "Tsabit", "Fenoughil", "Zaouiet Kounta"],
      2: ["Chlef", "Ténès", "El Karimia", "Oued Fodda", "El Marsa", "Boukadir", "Ouled Fares"],
      3: ["Laghouat", "Aflou", "Ksar El Hirane", "Hassi R'Mel", "Brida", "El Ghicha"],
      5: ["Batna", "Barika", "Ain Touta", "N'Gaous", "Merouana", "Tazoult", "Seggana"],
      6: ["Béjaïa", "Akbou", "Sidi Aich", "Amizour", "El Kseur", "Kherrata", "Tichy", "Aokas", "Seddouk"],
      7: ["Biskra", "Tolga", "Ouled Djellal", "Sidi Okba", "M'Chounèche", "El Kantara", "Djemorah"],
      9: ["Blida", "Boufarik", "Bougara", "Mouzaia", "El Affroun", "Ouled Yaïch", "Chréa", "Beni Mered"],
      10: ["Bouira", "Lakhdaria", "Sour El Ghozlane", "M'Chedallah", "Ain Bessem", "El Hachimia", "Kadiria"],
      13: ["Tlemcen", "Maghnia", "Ghazaouet", "Remchi", "Nedroma", "Sebdou", "Beni Saf", "Hennaya"],
      14: ["Tiaret", "Frenda", "Ksar Chellala", "Sougueur", "Mahdia", "Ain Deheb"],
      15: ["Tizi Ouzou", "Azazga", "Draa Ben Khedda", "Draa El Mizan", "Larbaa Nath Irathen", "Ain El Hammam", "Ouaguenoun", "Tigzirt", "Azzefoun", "Boghni", "Mekla", "Ouadhias", "Ait Toudert"],
      16: ["Alger Centre", "Sidi M'Hamed", "El Madania", "Belouizdad", "Bab El Oued", "Bologhine", "Casbah", "Hussein Dey", "Kouba", "Bachdjerrah", "El Harrach", "Baraki", "Bir Mourad Raïs", "El Biar", "Bouzareah", "Birkhadem", "El Mouradia", "Hydra", "Ben Aknoun", "Dely Ibrahim", "Bab Ezzouar", "Dar El Beida", "Rouiba", "Ain Taya", "Bordj El Kiffan", "El Mohammadia", "Mohammadia", "Reghaia", "Ain Benian", "Staoueli", "Zeralda", "Cheraga", "Ouled Fayet", "El Achour", "Draria", "Douera", "Baba Hassen", "Khraicia", "Saoula"],
      17: ["Djelfa", "Ain Oussera", "Messaad", "Hassi Bahbah", "Charef", "Djelfa", "Moudjbara"],
      18: ["Jijel", "El Milia", "Taher", "Chekfa", "Sidi Marouf", "Texenna", "Ziama Mansouriah", "El Ancer"],
      19: ["Sétif", "El Eulma", "Ain Arnat", "Ain Oulmene", "Bougaa", "Ain El Kebira", "Guenzet", "Beni Aziz", "Amoucha", "Ain Azel"],
      21: ["Skikda", "Azzaba", "Ain Kechra", "El Harrouch", "Ramdane Djamel", "Collo", "El Hadaiek", "Salah Bouchaour", "Zitouna"],
      23: ["Annaba", "El Bouni", "El Hadjar", "Berrahal", "Ain El Berda", "Seraidi", "Chetaibi", "Oued El Aneb"],
      25: ["Constantine", "El Khroub", "Ain Smara", "Hamma Bouziane", "Didouche Mourad", "Zighoud Youcef", "Ain Abid", "Ibn Ziad"],
      27: ["Mostaganem", "Ain Tedles", "Sidi Ali", "Ain Nouissy", "Hassi Maameche", "Bouguirat", "Kheir Eddine", "Mazagran"],
      29: ["Mascara", "Sig", "Ain Fares", "Tighennif", "Mohammadia", "Bou Hanifia", "El Bordj", "Oued Taria"],
      31: ["Oran", "Bir El Djir", "Es Senia", "Ain Turk", "Arzew", "Bethioua", "Hassi Bounif", "Oued Tlelat", "Ain El Kerma", "Mers El Kébir", "Bousfer", "El Braya", "Hassi Mefsoukh"],
      34: ["Bordj Bou Arréridj", "Ras El Oued", "Bir Kasdali", "Mansourah", "El Achir", "Djaâfra", "Medjana", "El Hamadia"],
      35: ["Boumerdès", "Boudouaou", "Dellys", "Khemis El Khechna", "Bordj Menaiel", "Naciria", "Tidjelabine", "Hammadi", "Ouled Moussa", "Bouzegza Keddara", "Corso", "Isser"],
      36: ["El Tarf", "El Kala", "Bouhadjar", "Ben M'Hidi", "Besbes", "Dréan", "Ain El Assel", "Bouteldja", "Zerizer"],
      39: ["El Oued", "Guemar", "Robbah", "Debila", "Hassani Abdelkrim", "Kouinine", "Magrane", "Oum Touyour", "Bayadha"],
      42: ["Tipaza", "Koléa", "Hadjout", "Cherchell", "Bou Ismaïl", "Sidi Amar", "Fouka", "Ahmer El Ain", "Gouraya", "Chaïba", "Damous", "Larhat"],
      43: ["Mila", "Ferdjioua", "Chelghoum Laïd", "Grarem Gouga", "Oued Athmenia", "Rouached", "Ain Beida Harriche", "Teleghma", "Tassadane Haddada"],
      44: ["Ain Defla", "Khemis Miliana", "Miliana", "El Attaf", "Djelida", "Hammam Righa", "Rouina", "Bourached", "El Abadia", "Ain Lechiakh"],
      47: ["Ghardaïa", "Metlili", "El Guerrara", "Berriane", "Dhayet Bendhahoua", "Zelfana", "Bounoura", "El Atteuf", "Mansoura"],
      48: ["Relizane", "Oued Rhiou", "Mazouna", "Yellel", "Ain Tarek", "Mendes", "Djidiouia", "Ramka", "Sidi M'Hamed Ben Ali", "Ammi Moussa"],
    };

    for (const [code, communeNames] of Object.entries(COMMUNES_BY_WILAYA)) {
      const wilaya = await db.wilaya.findFirst({ where: { code: parseInt(code) } });
      if (wilaya) {
        const flatNames = communeNames.flat() as string[];
        for (let idx = 0; idx < flatNames.length; idx++) {
          const cName = flatNames[idx];
          await db.commune.upsert({
            where: { id: `${wilaya.id}-${idx}` },
            update: { name: cName },
            create: {
              id: `${wilaya.id}-${idx}`,
              code: idx + 1,
              name: cName,
              wilayaId: wilaya.id,
            },
          });
        }
      }
    }

    // 5. Create products
    const createdProducts = [];
    for (let i = 0; i < 30; i++) {
      const reference = `RK-${String(i + 1).padStart(3, "0")}`;
      const name = PRODUCT_NAMES[i];
      const price = randomPrice();
      const fabric = FABRICS[randomInt(0, FABRICS.length - 1)];
      const description = getDescription(i);
      const isFeatured = i < 8; // first 8 are featured

      const product = await db.product.upsert({
        where: { reference },
        update: {},
        create: {
          reference,
          name,
          description,
          price,
          fabric,
          featured: isFeatured,
          active: true,
        },
      });

      // Create images (2-4 per product)
      const imageCount = randomInt(2, 4);
      for (let j = 0; j < imageCount; j++) {
        await db.productImage.create({
          data: {
            url: `https://picsum.photos/seed/kabyle-dress-${i + 1}-${j + 1}/600/800`,
            alt: `${name} - Image ${j + 1}`,
            sortOrder: j,
            productId: product.id,
          },
        });
      }

      // Create variants (all size/color combos, but randomly set stock)
      const selectedColors = COLORS.slice(0, randomInt(2, COLORS.length));
      const selectedSizes = SIZES.slice(0, randomInt(3, SIZES.length));

      for (const size of selectedSizes) {
        for (const color of selectedColors) {
          const stock = randomInt(0, 15);
          try {
            await db.productVariant.create({
              data: {
                productId: product.id,
                size,
                color,
                stock,
              },
            });
          } catch {
            // Variant might already exist (unique constraint)
          }
        }
      }

      createdProducts.push(product);
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        admin: { email: admin.email, name: admin.name },
        productsCreated: createdProducts.length,
        wilayasCreated: ALGERIAN_WILAYAS.length,
        ecotrackConfigured: true,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error seeding database",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
