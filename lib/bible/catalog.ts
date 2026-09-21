export type Testament = "old" | "new";

export type BibleBook = {
  slug: string;
  name: string;
  abbreviation: string;
  chapters: number;
  testament: Testament;
  aliases: string[];
};

export const BIBLE_BOOKS: BibleBook[] = [
  { slug: "genesis", name: "Gênesis", abbreviation: "Gn", chapters: 50, testament: "old", aliases: ["gen", "genesis"] },
  { slug: "exodus", name: "Êxodo", abbreviation: "Êx", chapters: 40, testament: "old", aliases: ["ex", "exo", "exodo"] },
  { slug: "leviticus", name: "Levítico", abbreviation: "Lv", chapters: 27, testament: "old", aliases: ["lev", "levitico"] },
  { slug: "numbers", name: "Números", abbreviation: "Nm", chapters: 36, testament: "old", aliases: ["num", "numeros"] },
  { slug: "deuteronomy", name: "Deuteronômio", abbreviation: "Dt", chapters: 34, testament: "old", aliases: ["deut", "deuteronomio"] },
  { slug: "joshua", name: "Josué", abbreviation: "Js", chapters: 24, testament: "old", aliases: ["jos", "josue"] },
  { slug: "judges", name: "Juízes", abbreviation: "Jz", chapters: 21, testament: "old", aliases: ["juizes"] },
  { slug: "ruth", name: "Rute", abbreviation: "Rt", chapters: 4, testament: "old", aliases: ["ruth"] },
  { slug: "1-samuel", name: "1 Samuel", abbreviation: "1Sm", chapters: 31, testament: "old", aliases: ["1 sam", "1samuel", "i samuel"] },
  { slug: "2-samuel", name: "2 Samuel", abbreviation: "2Sm", chapters: 24, testament: "old", aliases: ["2 sam", "2samuel", "ii samuel"] },
  { slug: "1-kings", name: "1 Reis", abbreviation: "1Rs", chapters: 22, testament: "old", aliases: ["1 reis", "1reis", "i reis"] },
  { slug: "2-kings", name: "2 Reis", abbreviation: "2Rs", chapters: 25, testament: "old", aliases: ["2 reis", "2reis", "ii reis"] },
  { slug: "1-chronicles", name: "1 Crônicas", abbreviation: "1Cr", chapters: 29, testament: "old", aliases: ["1 cronicas", "1cronicas", "i cronicas"] },
  { slug: "2-chronicles", name: "2 Crônicas", abbreviation: "2Cr", chapters: 36, testament: "old", aliases: ["2 cronicas", "2cronicas", "ii cronicas"] },
  { slug: "ezra", name: "Esdras", abbreviation: "Ed", chapters: 10, testament: "old", aliases: ["ezra"] },
  { slug: "nehemiah", name: "Neemias", abbreviation: "Ne", chapters: 13, testament: "old", aliases: ["neh", "neemias"] },
  { slug: "esther", name: "Ester", abbreviation: "Et", chapters: 10, testament: "old", aliases: ["esther"] },
  { slug: "job", name: "Jó", abbreviation: "Jó", chapters: 42, testament: "old", aliases: ["job"] },
  { slug: "psalms", name: "Salmos", abbreviation: "Sl", chapters: 150, testament: "old", aliases: ["salmo", "salmos", "ps", "psalm", "psalms"] },
  { slug: "proverbs", name: "Provérbios", abbreviation: "Pv", chapters: 31, testament: "old", aliases: ["prov", "proverbios"] },
  { slug: "ecclesiastes", name: "Eclesiastes", abbreviation: "Ec", chapters: 12, testament: "old", aliases: ["ecl", "ecclesiastes"] },
  { slug: "song-of-solomon", name: "Cantares", abbreviation: "Ct", chapters: 8, testament: "old", aliases: ["cant", "cantares", "canticos", "cântico dos cânticos", "cantico dos canticos"] },
  { slug: "isaiah", name: "Isaías", abbreviation: "Is", chapters: 66, testament: "old", aliases: ["isa", "isaias"] },
  { slug: "jeremiah", name: "Jeremias", abbreviation: "Jr", chapters: 52, testament: "old", aliases: ["jer", "jeremias"] },
  { slug: "lamentations", name: "Lamentações", abbreviation: "Lm", chapters: 5, testament: "old", aliases: ["lam", "lamentacoes"] },
  { slug: "ezekiel", name: "Ezequiel", abbreviation: "Ez", chapters: 48, testament: "old", aliases: ["eze", "ezequiel"] },
  { slug: "daniel", name: "Daniel", abbreviation: "Dn", chapters: 12, testament: "old", aliases: ["dan"] },
  { slug: "hosea", name: "Oseias", abbreviation: "Os", chapters: 14, testament: "old", aliases: ["oseias", "hosea"] },
  { slug: "joel", name: "Joel", abbreviation: "Jl", chapters: 3, testament: "old", aliases: [] },
  { slug: "amos", name: "Amós", abbreviation: "Am", chapters: 9, testament: "old", aliases: ["amos"] },
  { slug: "obadiah", name: "Obadias", abbreviation: "Ob", chapters: 1, testament: "old", aliases: ["obadiah"] },
  { slug: "jonah", name: "Jonas", abbreviation: "Jn", chapters: 4, testament: "old", aliases: ["jonah"] },
  { slug: "micah", name: "Miqueias", abbreviation: "Mq", chapters: 7, testament: "old", aliases: ["mic", "miqueias"] },
  { slug: "nahum", name: "Naum", abbreviation: "Na", chapters: 3, testament: "old", aliases: ["nah"] },
  { slug: "habakkuk", name: "Habacuque", abbreviation: "Hc", chapters: 3, testament: "old", aliases: ["hab"] },
  { slug: "zephaniah", name: "Sofonias", abbreviation: "Sf", chapters: 3, testament: "old", aliases: ["sof", "sofonias", "zephaniah"] },
  { slug: "haggai", name: "Ageu", abbreviation: "Ag", chapters: 2, testament: "old", aliases: ["hag", "haggai"] },
  { slug: "zechariah", name: "Zacarias", abbreviation: "Zc", chapters: 14, testament: "old", aliases: ["zec", "zacarias"] },
  { slug: "malachi", name: "Malaquias", abbreviation: "Ml", chapters: 4, testament: "old", aliases: ["mal", "malaquias"] },
  { slug: "matthew", name: "Mateus", abbreviation: "Mt", chapters: 28, testament: "new", aliases: ["mat", "mateus"] },
  { slug: "mark", name: "Marcos", abbreviation: "Mc", chapters: 16, testament: "new", aliases: ["mar", "marcos"] },
  { slug: "luke", name: "Lucas", abbreviation: "Lc", chapters: 24, testament: "new", aliases: ["luk"] },
  { slug: "john", name: "João", abbreviation: "Jo", chapters: 21, testament: "new", aliases: ["joao", "john"] },
  { slug: "acts", name: "Atos", abbreviation: "At", chapters: 28, testament: "new", aliases: ["atos dos apostolos", "acts"] },
  { slug: "romans", name: "Romanos", abbreviation: "Rm", chapters: 16, testament: "new", aliases: ["rom", "romanos"] },
  { slug: "1-corinthians", name: "1 Coríntios", abbreviation: "1Co", chapters: 16, testament: "new", aliases: ["1 corintios", "1corintios", "i corintios"] },
  { slug: "2-corinthians", name: "2 Coríntios", abbreviation: "2Co", chapters: 13, testament: "new", aliases: ["2 corintios", "2corintios", "ii corintios"] },
  { slug: "galatians", name: "Gálatas", abbreviation: "Gl", chapters: 6, testament: "new", aliases: ["gal", "galatas"] },
  { slug: "ephesians", name: "Efésios", abbreviation: "Ef", chapters: 6, testament: "new", aliases: ["efe", "efesios"] },
  { slug: "philippians", name: "Filipenses", abbreviation: "Fp", chapters: 4, testament: "new", aliases: ["fil", "filipenses"] },
  { slug: "colossians", name: "Colossenses", abbreviation: "Cl", chapters: 4, testament: "new", aliases: ["col"] },
  { slug: "1-thessalonians", name: "1 Tessalonicenses", abbreviation: "1Ts", chapters: 5, testament: "new", aliases: ["1 tessalonicenses", "1tes", "1 ts"] },
  { slug: "2-thessalonians", name: "2 Tessalonicenses", abbreviation: "2Ts", chapters: 3, testament: "new", aliases: ["2 tessalonicenses", "2tes", "2 ts"] },
  { slug: "1-timothy", name: "1 Timóteo", abbreviation: "1Tm", chapters: 6, testament: "new", aliases: ["1 timoteo", "1tm"] },
  { slug: "2-timothy", name: "2 Timóteo", abbreviation: "2Tm", chapters: 4, testament: "new", aliases: ["2 timoteo", "2tm"] },
  { slug: "titus", name: "Tito", abbreviation: "Tt", chapters: 3, testament: "new", aliases: ["tit"] },
  { slug: "philemon", name: "Filemom", abbreviation: "Fm", chapters: 1, testament: "new", aliases: ["filemon", "philemon"] },
  { slug: "hebrews", name: "Hebreus", abbreviation: "Hb", chapters: 13, testament: "new", aliases: ["heb"] },
  { slug: "james", name: "Tiago", abbreviation: "Tg", chapters: 5, testament: "new", aliases: ["tia", "james"] },
  { slug: "1-peter", name: "1 Pedro", abbreviation: "1Pe", chapters: 5, testament: "new", aliases: ["1 pedro", "1pe"] },
  { slug: "2-peter", name: "2 Pedro", abbreviation: "2Pe", chapters: 3, testament: "new", aliases: ["2 pedro", "2pe"] },
  { slug: "1-john", name: "1 João", abbreviation: "1Jo", chapters: 5, testament: "new", aliases: ["1 joao", "1jo"] },
  { slug: "2-john", name: "2 João", abbreviation: "2Jo", chapters: 1, testament: "new", aliases: ["2 joao", "2jo"] },
  { slug: "3-john", name: "3 João", abbreviation: "3Jo", chapters: 1, testament: "new", aliases: ["3 joao", "3jo"] },
  { slug: "jude", name: "Judas", abbreviation: "Jd", chapters: 1, testament: "new", aliases: ["jude"] },
  { slug: "revelation", name: "Apocalipse", abbreviation: "Ap", chapters: 22, testament: "new", aliases: ["apo", "apocalipse", "revelacao", "revelation"] },
];

export function normalizeBibleQuery(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findBibleBook(value: string) {
  const normalized = normalizeBibleQuery(value);
  return BIBLE_BOOKS.find((book) => {
    const names = [book.name, book.abbreviation, book.slug, ...book.aliases].map(normalizeBibleQuery);
    return names.includes(normalized);
  });
}

export function getBibleBook(slug: string) {
  return BIBLE_BOOKS.find((book) => book.slug === slug);
}

export function getAdjacentChapter(bookSlug: string, chapter: number, direction: -1 | 1) {
  const index = BIBLE_BOOKS.findIndex((book) => book.slug === bookSlug);
  if (index < 0) return null;

  const book = BIBLE_BOOKS[index];
  const target = chapter + direction;

  if (target >= 1 && target <= book.chapters) {
    return { book, chapter: target };
  }

  const adjacentBook = BIBLE_BOOKS[index + direction];
  if (!adjacentBook) return null;

  return {
    book: adjacentBook,
    chapter: direction === 1 ? 1 : adjacentBook.chapters,
  };
}
