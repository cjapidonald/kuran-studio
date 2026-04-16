import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface DescriptionSeed {
  surah: number;
  description: string;
  themes: string[];
}

// Unique English SEO descriptions for all 114 surahs (140-180 chars each)
const DESCRIPTIONS: DescriptionSeed[] = [
  { surah: 1, description: "Surah Al-Fatiha (The Opening) — the first chapter of the Quran, a 7-verse Meccan revelation recited in every prayer. The essence of faith: praise, worship, and guidance.", themes: ["prayer", "guidance", "monotheism"] },
  { surah: 2, description: "Surah Al-Baqarah (The Cow) — the longest chapter of the Quran with 286 verses, a Medinan revelation covering faith, law, the story of Adam, and Ayat al-Kursi.", themes: ["law", "faith", "prophets", "ayat-al-kursi"] },
  { surah: 3, description: "Surah Ali 'Imran (Family of Imran) — a 200-verse Medinan chapter on the lineage of Imran, the birth of Jesus and Mary, and the Battle of Uhud.", themes: ["prophets", "mary", "jesus", "uhud"] },
  { surah: 4, description: "Surah An-Nisa (The Women) — a 176-verse Medinan chapter establishing laws on marriage, inheritance, women's rights, orphans, and social justice.", themes: ["women", "family", "inheritance", "justice"] },
  { surah: 5, description: "Surah Al-Ma'idah (The Table Spread) — a 120-verse Medinan chapter covering dietary laws, the covenant with Christians, and the disciples of Jesus.", themes: ["dietary-law", "covenants", "christians"] },
  { surah: 6, description: "Surah Al-An'am (The Cattle) — a 165-verse Meccan chapter refuting polytheism and establishing Allah's oneness through signs in creation.", themes: ["monotheism", "creation", "prophets"] },
  { surah: 7, description: "Surah Al-A'raf (The Heights) — a 206-verse Meccan chapter recounting stories of Adam, Noah, Hud, Salih, Lot, Shu'ayb, and Moses.", themes: ["prophets", "moses", "adam", "judgment"] },
  { surah: 8, description: "Surah Al-Anfal (The Spoils of War) — a 75-verse Medinan chapter about the Battle of Badr, rules of warfare, and distribution of war gains.", themes: ["battle-of-badr", "war", "trust"] },
  { surah: 9, description: "Surah At-Tawbah (The Repentance) — a 129-verse Medinan chapter on treaties, the hypocrites, and the call to struggle for truth. The only surah without Bismillah.", themes: ["repentance", "hypocrites", "treaties"] },
  { surah: 10, description: "Surah Yunus (Jonah) — a 109-verse Meccan chapter about Prophet Jonah, divine mercy, the Quran's truth, and warnings against denial.", themes: ["jonah", "prophets", "mercy"] },
  { surah: 11, description: "Surah Hud — a 123-verse Meccan chapter recounting the stories of Noah, Hud, Salih, Abraham, Lot, Shu'ayb, and Moses as warnings to disbelievers.", themes: ["prophets", "noah", "destruction"] },
  { surah: 12, description: "Surah Yusuf (Joseph) — the most beautiful story in the Quran, a 111-verse Meccan chapter narrating the complete life of Prophet Joseph.", themes: ["joseph", "patience", "dreams", "forgiveness"] },
  { surah: 13, description: "Surah Ar-Ra'd (The Thunder) — a 43-verse chapter glorifying Allah through signs in nature: thunder, lightning, mountains, and rivers.", themes: ["signs", "nature", "monotheism"] },
  { surah: 14, description: "Surah Ibrahim (Abraham) — a 52-verse Meccan chapter honoring Prophet Abraham, his supplications, and his dedication of Mecca and his offspring.", themes: ["abraham", "prayer", "gratitude"] },
  { surah: 15, description: "Surah Al-Hijr (The Rocky Tract) — a 99-verse Meccan chapter on the people of Al-Hijr, the creation of Adam, and Iblis' refusal to prostrate.", themes: ["iblis", "creation", "destruction"] },
  { surah: 16, description: "Surah An-Nahl (The Bee) — a 128-verse Meccan chapter of divine blessings in creation — bees, cattle, rivers, fruit — and the mission of prophets.", themes: ["blessings", "creation", "bees", "honey"] },
  { surah: 17, description: "Surah Al-Isra (The Night Journey) — a 111-verse Meccan chapter commemorating the Prophet Muhammad's night journey from Mecca to Jerusalem.", themes: ["night-journey", "prophets", "ethics"] },
  { surah: 18, description: "Surah Al-Kahf (The Cave) — a 110-verse Meccan chapter with four stories: the sleepers of the cave, the two gardens, Moses and Khidr, and Dhul-Qarnayn.", themes: ["cave", "moses", "khidr", "trials"] },
  { surah: 19, description: "Surah Maryam (Mary) — a 98-verse Meccan chapter dedicated to Mary and the miraculous birth of Jesus, plus stories of Zachariah, John, Abraham, Moses.", themes: ["mary", "jesus", "zachariah", "prophets"] },
  { surah: 20, description: "Surah Ta-Ha — a 135-verse Meccan chapter recounting the full story of Moses: his call at the Mount, confrontation with Pharaoh, and the Exodus.", themes: ["moses", "pharaoh", "exodus"] },
  { surah: 21, description: "Surah Al-Anbiya (The Prophets) — a 112-verse Meccan chapter surveying the lives and missions of 16 prophets and their shared message of monotheism.", themes: ["prophets", "monotheism", "mercy"] },
  { surah: 22, description: "Surah Al-Hajj (The Pilgrimage) — a 78-verse chapter on the rites of Hajj, the sanctity of Mecca, and reflections on the Day of Judgment.", themes: ["hajj", "pilgrimage", "mecca", "judgment"] },
  { surah: 23, description: "Surah Al-Mu'minun (The Believers) — a 118-verse Meccan chapter opening with the qualities of successful believers and seven stages of human creation.", themes: ["believers", "success", "creation"] },
  { surah: 24, description: "Surah An-Nur (The Light) — a 64-verse Medinan chapter on modesty, marital relations, the 'Verse of Light', and Allah as the light of heavens and earth.", themes: ["modesty", "light", "marriage"] },
  { surah: 25, description: "Surah Al-Furqan (The Criterion) — a 77-verse Meccan chapter on the Quran as the criterion between truth and falsehood, plus traits of the Merciful's servants.", themes: ["criterion", "servants", "truth"] },
  { surah: 26, description: "Surah Ash-Shu'ara (The Poets) — a 227-verse Meccan chapter narrating seven prophetic stories: Moses, Abraham, Noah, Hud, Salih, Lot, and Shu'ayb.", themes: ["prophets", "poets", "warnings"] },
  { surah: 27, description: "Surah An-Naml (The Ant) — a 93-verse Meccan chapter featuring Prophet Solomon, the ant, the hoopoe, and the Queen of Sheba (Bilqis).", themes: ["solomon", "sheba", "ants", "jinn"] },
  { surah: 28, description: "Surah Al-Qasas (The Stories) — an 88-verse Meccan chapter detailing Moses' early life in Egypt, his exile in Madyan, and return to confront Pharaoh.", themes: ["moses", "pharaoh", "madyan"] },
  { surah: 29, description: "Surah Al-'Ankabut (The Spider) — a 69-verse chapter using the spider's web as a metaphor for false deities, plus trials of believers and stories of prophets.", themes: ["trials", "faith", "prophets"] },
  { surah: 30, description: "Surah Ar-Rum (The Romans) — a 60-verse Meccan chapter prophesying the Byzantine victory over Persia, and signs of Allah in creation and love.", themes: ["byzantines", "prophecy", "signs"] },
  { surah: 31, description: "Surah Luqman — a 34-verse Meccan chapter containing Luqman the Wise's timeless advice to his son on faith, humility, and good character.", themes: ["wisdom", "luqman", "advice", "parenting"] },
  { surah: 32, description: "Surah As-Sajdah (The Prostration) — a 30-verse Meccan chapter on creation, resurrection, and the Quran's divine origin. Recited in Friday Fajr prayer.", themes: ["prostration", "resurrection", "quran"] },
  { surah: 33, description: "Surah Al-Ahzab (The Combined Forces) — a 73-verse Medinan chapter about the Battle of the Trench, family laws, and the Prophet's wives.", themes: ["trench", "battle", "family-law"] },
  { surah: 34, description: "Surah Saba — a 54-verse Meccan chapter featuring David, Solomon, and the lost civilization of Sheba, warning against ingratitude.", themes: ["david", "solomon", "sheba", "gratitude"] },
  { surah: 35, description: "Surah Fatir (The Originator) — a 45-verse Meccan chapter celebrating Allah as the Creator of the heavens and earth with angels of two, three, and four wings.", themes: ["creation", "angels", "originator"] },
  { surah: 36, description: "Surah Ya-Sin — the 'heart of the Quran', an 83-verse Meccan chapter on prophethood, resurrection, and divine signs. Traditionally recited for the deceased.", themes: ["prophets", "resurrection", "heart-of-quran"] },
  { surah: 37, description: "Surah As-Saffat (Those Ranged in Ranks) — a 182-verse Meccan chapter on angels in rows, prophets Noah, Abraham, Moses, Elijah, Lot, and Jonah.", themes: ["angels", "prophets", "sacrifice"] },
  { surah: 38, description: "Surah Sad — an 88-verse Meccan chapter featuring Prophets David and Solomon, Job's patience, and Iblis' refusal to prostrate to Adam.", themes: ["david", "solomon", "job", "iblis"] },
  { surah: 39, description: "Surah Az-Zumar (The Groups) — a 75-verse Meccan chapter on sincere monotheism, divine mercy, and the two groups entering Paradise and Hell.", themes: ["monotheism", "mercy", "groups"] },
  { surah: 40, description: "Surah Ghafir (The Forgiver) — an 85-verse Meccan chapter on Allah's forgiveness, the believer of Pharaoh's family, and the inevitability of truth.", themes: ["forgiveness", "believer", "pharaoh"] },
  { surah: 41, description: "Surah Fussilat (Explained in Detail) — a 54-verse Meccan chapter on the clarity of the Quran, the six days of creation, and divine signs in all horizons.", themes: ["quran", "creation", "signs"] },
  { surah: 42, description: "Surah Ash-Shura (The Consultation) — a 53-verse Meccan chapter on divine revelation, consultation (shura) as a principle, and Allah's oneness across prophets.", themes: ["consultation", "revelation", "unity"] },
  { surah: 43, description: "Surah Az-Zukhruf (The Gold Adornments) — an 89-verse Meccan chapter refuting wealth as a measure of virtue, with stories of Abraham, Moses, and Jesus.", themes: ["wealth", "abraham", "jesus"] },
  { surah: 44, description: "Surah Ad-Dukhan (The Smoke) — a 59-verse Meccan chapter on the Night of Decree (Laylat al-Qadr), the smoke as a sign, and the story of Moses versus Pharaoh.", themes: ["night-of-decree", "moses", "signs"] },
  { surah: 45, description: "Surah Al-Jathiyah (The Kneeling) — a 37-verse Meccan chapter on Allah's signs in creation and the kneeling of nations before Him on Judgment Day.", themes: ["judgment", "signs", "kneeling"] },
  { surah: 46, description: "Surah Al-Ahqaf (The Wind-Curved Sandhills) — a 35-verse Meccan chapter on the people of 'Ad, their destruction, and the jinn's encounter with the Quran.", themes: ["ad", "destruction", "jinn"] },
  { surah: 47, description: "Surah Muhammad — a 38-verse Medinan chapter named for Prophet Muhammad, addressing faith versus rejection, warfare, and hypocrites.", themes: ["muhammad", "faith", "hypocrites"] },
  { surah: 48, description: "Surah Al-Fath (The Victory) — a 29-verse Medinan chapter revealed after the Treaty of Hudaybiyyah, proclaiming a clear victory for the Muslims.", themes: ["victory", "hudaybiyyah", "treaty"] },
  { surah: 49, description: "Surah Al-Hujurat (The Rooms) — an 18-verse Medinan chapter on manners with the Prophet, avoiding assumption and backbiting, and human brotherhood.", themes: ["manners", "brotherhood", "ethics"] },
  { surah: 50, description: "Surah Qaf — a 45-verse Meccan chapter on resurrection, the creation of humans, and the two angels recording every word spoken.", themes: ["resurrection", "angels", "creation"] },
  { surah: 51, description: "Surah Adh-Dhariyat (The Scattering Winds) — a 60-verse Meccan chapter on winds, rain, creation, Abraham's guests, and the destruction of past nations.", themes: ["winds", "abraham", "destruction"] },
  { surah: 52, description: "Surah At-Tur (The Mount) — a 49-verse Meccan chapter swearing by Mount Sinai, affirming the certainty of Judgment Day and Paradise for the righteous.", themes: ["mount-sinai", "judgment", "paradise"] },
  { surah: 53, description: "Surah An-Najm (The Star) — a 62-verse Meccan chapter describing the Prophet's ascension and meeting with angel Gabriel. First surah publicly recited.", themes: ["star", "ascension", "gabriel"] },
  { surah: 54, description: "Surah Al-Qamar (The Moon) — a 55-verse Meccan chapter opening with the miracle of the moon's splitting, warning through past nations' destruction.", themes: ["moon", "splitting", "destruction"] },
  { surah: 55, description: "Surah Ar-Rahman (The Most Merciful) — a 78-verse chapter, a love song to divine mercy, repeating 'Which of your Lord's favors will you deny?' 31 times.", themes: ["mercy", "blessings", "paradise"] },
  { surah: 56, description: "Surah Al-Waqi'ah (The Event) — a 96-verse Meccan chapter dividing humanity into three groups at the Event (Judgment): foremost, right-hand, and left-hand people.", themes: ["judgment", "groups", "event"] },
  { surah: 57, description: "Surah Al-Hadid (The Iron) — a 29-verse Medinan chapter on Allah's omnipotence, the sending down of iron, and the spiritual power of charity.", themes: ["iron", "charity", "power"] },
  { surah: 58, description: "Surah Al-Mujadilah (The Pleading Woman) — a 22-verse Medinan chapter about Khawlah bint Tha'labah's case, establishing new family law.", themes: ["family-law", "women", "dispute"] },
  { surah: 59, description: "Surah Al-Hashr (The Gathering) — a 24-verse Medinan chapter about the Banu Nadir tribe's exile, concluding with Allah's most beautiful names.", themes: ["banu-nadir", "names-of-allah", "exile"] },
  { surah: 60, description: "Surah Al-Mumtahanah (The Woman Examined) — a 13-verse Medinan chapter on loyalty, migrant women's rights, and proper relations with non-hostile non-Muslims.", themes: ["loyalty", "migration", "relations"] },
  { surah: 61, description: "Surah As-Saff (The Row) — a 14-verse Medinan chapter praising those who fight in ranks for Allah, mentioning Moses and Jesus' prophecy of Muhammad.", themes: ["ranks", "jesus", "prophecy"] },
  { surah: 62, description: "Surah Al-Jumu'ah (Friday) — an 11-verse Medinan chapter on Friday prayer, the obligation to rush to it, and a parable for the people of the Book.", themes: ["friday", "prayer", "congregation"] },
  { surah: 63, description: "Surah Al-Munafiqun (The Hypocrites) — an 11-verse Medinan chapter exposing the hypocrites' deception and warning believers against their schemes.", themes: ["hypocrites", "faith", "warning"] },
  { surah: 64, description: "Surah At-Taghabun (The Mutual Disillusion) — an 18-verse chapter on the Day of Mutual Loss and Gain, faith over wealth, and trials as tests.", themes: ["judgment", "trials", "wealth"] },
  { surah: 65, description: "Surah At-Talaq (The Divorce) — a 12-verse Medinan chapter on divorce laws, the waiting period ('iddah), and the importance of mutual respect.", themes: ["divorce", "family-law", "waiting-period"] },
  { surah: 66, description: "Surah At-Tahrim (The Prohibition) — a 12-verse Medinan chapter on household matters of the Prophet, with examples of the wives of Noah, Lot, Pharaoh, and Mary.", themes: ["prophet-household", "examples", "mary"] },
  { surah: 67, description: "Surah Al-Mulk (The Sovereignty) — a 30-verse Meccan chapter on Allah's dominion; recited nightly, it is said to intercede for its reciter in the grave.", themes: ["sovereignty", "grave", "nightly-reading"] },
  { surah: 68, description: "Surah Al-Qalam (The Pen) — a 52-verse Meccan chapter opening with an oath by the pen, defending the Prophet's character against slander.", themes: ["pen", "prophet-character", "slander"] },
  { surah: 69, description: "Surah Al-Haqqah (The Inevitable) — a 52-verse Meccan chapter on the inevitable Day of Judgment, with graphic descriptions of Paradise and Hell.", themes: ["judgment", "paradise", "hell"] },
  { surah: 70, description: "Surah Al-Ma'arij (The Ascending Stairways) — a 44-verse Meccan chapter on the day angels ascend to Allah in 50,000 years, and the traits of true believers.", themes: ["ascent", "angels", "believers"] },
  { surah: 71, description: "Surah Nuh (Noah) — a 28-verse Meccan chapter entirely about Prophet Noah's 950-year mission and the people's persistent denial, ending in the flood.", themes: ["noah", "flood", "mission"] },
  { surah: 72, description: "Surah Al-Jinn — a 28-verse Meccan chapter on a group of jinn who heard and accepted the Quran, correcting human misconceptions about these beings.", themes: ["jinn", "quran", "creation"] },
  { surah: 73, description: "Surah Al-Muzzammil (The Enshrouded One) — a 20-verse Meccan chapter commanding the Prophet to night prayer, revealed early in his mission.", themes: ["night-prayer", "prophet", "devotion"] },
  { surah: 74, description: "Surah Al-Muddaththir (The Cloaked One) — a 56-verse Meccan chapter, among the first revealed, calling the Prophet to rise and warn the people.", themes: ["first-revelation", "warning", "prophethood"] },
  { surah: 75, description: "Surah Al-Qiyamah (The Resurrection) — a 40-verse Meccan chapter on the reality of resurrection, the moment of death, and Allah's oath by the Judgment Day.", themes: ["resurrection", "death", "judgment"] },
  { surah: 76, description: "Surah Al-Insan (Man) — a 31-verse chapter on human creation, moral choice, and the rewards of the righteous: Paradise and its delights.", themes: ["creation", "choice", "paradise"] },
  { surah: 77, description: "Surah Al-Mursalat (Those Sent Forth) — a 50-verse Meccan chapter with the repeated warning 'Woe that day to the deniers!' across its verses.", themes: ["warning", "deniers", "judgment"] },
  { surah: 78, description: "Surah An-Naba (The Tidings) — a 40-verse Meccan chapter on the Great News — the Day of Judgment — with proofs from creation and vivid scenes of the afterlife.", themes: ["great-news", "judgment", "afterlife"] },
  { surah: 79, description: "Surah An-Nazi'at (Those Who Drag Forth) — a 46-verse Meccan chapter on angels extracting souls, the trumpet blast, and the story of Moses vs. Pharaoh.", themes: ["angels", "soul", "moses"] },
  { surah: 80, description: "Surah 'Abasa (He Frowned) — a 42-verse Meccan chapter that gently reminds the Prophet after he turned from a blind companion seeking guidance.", themes: ["humility", "blind-man", "lessons"] },
  { surah: 81, description: "Surah At-Takwir (The Overthrowing) — a 29-verse Meccan chapter describing cosmic upheaval at the end of the world: the sun darkened, stars falling.", themes: ["apocalypse", "end-times", "sun"] },
  { surah: 82, description: "Surah Al-Infitar (The Cleaving) — a 19-verse Meccan chapter on the sky splitting open, and the record of deeds preserved for Judgment Day.", themes: ["cleaving", "deeds", "judgment"] },
  { surah: 83, description: "Surah Al-Mutaffifin (The Defrauders) — a 36-verse chapter condemning fraud in measurement and trade, and the eternal record of the pious and wicked.", themes: ["fraud", "trade", "justice"] },
  { surah: 84, description: "Surah Al-Inshiqaq (The Splitting Open) — a 25-verse Meccan chapter on the sky's splitting on Judgment Day and the two groups receiving their books.", themes: ["judgment", "splitting", "books"] },
  { surah: 85, description: "Surah Al-Buruj (The Great Stars) — a 22-verse Meccan chapter about the Companions of the Trench, honoring believers who died for their faith.", themes: ["martyrdom", "trench", "faith"] },
  { surah: 86, description: "Surah At-Tariq (The Night Comer) — a 17-verse Meccan chapter swearing by the piercing star, affirming every soul has a protecting angel.", themes: ["night-star", "angels", "protection"] },
  { surah: 87, description: "Surah Al-A'la (The Most High) — a 19-verse Meccan chapter glorifying Allah's name, promising ease, and urging remembrance and purification.", themes: ["glorification", "purification", "remembrance"] },
  { surah: 88, description: "Surah Al-Ghashiyah (The Overwhelming) — a 26-verse Meccan chapter contrasting the fates of the wretched and the blessed on the Overwhelming Day.", themes: ["judgment", "fates", "paradise-hell"] },
  { surah: 89, description: "Surah Al-Fajr (The Dawn) — a 30-verse Meccan chapter swearing by the dawn, recounting the destruction of 'Ad, Thamud, and Pharaoh, and calling the soul to peace.", themes: ["dawn", "soul", "destruction"] },
  { surah: 90, description: "Surah Al-Balad (The City) — a 20-verse Meccan chapter swearing by Mecca, describing humanity's struggle and the steep path of good deeds.", themes: ["city", "mecca", "struggle"] },
  { surah: 91, description: "Surah Ash-Shams (The Sun) — a 15-verse Meccan chapter with 11 oaths by creation, teaching that the soul is successful when it purifies itself.", themes: ["sun", "soul", "purification"] },
  { surah: 92, description: "Surah Al-Layl (The Night) — a 21-verse Meccan chapter swearing by night and day, contrasting the generous and greedy paths of human life.", themes: ["night", "charity", "paths"] },
  { surah: 93, description: "Surah Ad-Duha (The Morning Hours) — an 11-verse Meccan chapter of divine reassurance to the Prophet during a pause in revelation, promising Allah's care.", themes: ["reassurance", "orphan", "revelation"] },
  { surah: 94, description: "Surah Ash-Sharh (The Relief) — an 8-verse Meccan chapter of comfort to the Prophet: 'With hardship comes ease' — twice repeated for emphasis.", themes: ["relief", "comfort", "ease"] },
  { surah: 95, description: "Surah At-Tin (The Fig) — an 8-verse Meccan chapter swearing by fig, olive, Mount Sinai, and Mecca, affirming humanity's noble original creation.", themes: ["fig", "creation", "sinai"] },
  { surah: 96, description: "Surah Al-'Alaq (The Clot) — a 19-verse Meccan chapter whose first five verses were the very first revelation: 'Read! In the name of your Lord who created.'", themes: ["first-revelation", "knowledge", "creation"] },
  { surah: 97, description: "Surah Al-Qadr (The Power) — a 5-verse chapter on the Night of Power (Laylat al-Qadr), better than a thousand months, when the Quran was revealed.", themes: ["night-of-power", "ramadan", "revelation"] },
  { surah: 98, description: "Surah Al-Bayyinah (The Clear Proof) — an 8-verse chapter about the People of the Book and polytheists, contrasting believers with worshippers of creation.", themes: ["proof", "faith", "people-of-book"] },
  { surah: 99, description: "Surah Az-Zalzalah (The Earthquake) — an 8-verse Medinan chapter describing Earth's final quake and its testimony of every atom of good and evil done.", themes: ["earthquake", "judgment", "deeds"] },
  { surah: 100, description: "Surah Al-'Adiyat (The Chargers) — an 11-verse Meccan chapter swearing by galloping war horses, condemning human ingratitude toward the Creator.", themes: ["horses", "ingratitude", "oath"] },
  { surah: 101, description: "Surah Al-Qari'ah (The Striking Calamity) — an 11-verse Meccan chapter depicting the Day of Judgment: scattered moths, wool-like mountains, the scale of deeds.", themes: ["calamity", "judgment", "scales"] },
  { surah: 102, description: "Surah At-Takathur (The Rivalry in Worldly Increase) — an 8-verse Meccan chapter warning against obsession with worldly accumulation until the grave.", themes: ["worldliness", "grave", "accountability"] },
  { surah: 103, description: "Surah Al-'Asr (The Declining Day) — a 3-verse Meccan chapter, one of the shortest; summarizes the path to success: faith, righteousness, truth, patience.", themes: ["time", "success", "patience"] },
  { surah: 104, description: "Surah Al-Humazah (The Gossipmonger) — a 9-verse Meccan chapter condemning slanderers and misers, describing their fate in the crushing Hellfire.", themes: ["slander", "wealth", "hell"] },
  { surah: 105, description: "Surah Al-Fil (The Elephant) — a 5-verse Meccan chapter recounting Allah's destruction of Abraha's army of elephants that came to demolish the Ka'bah.", themes: ["elephant", "kaaba", "miracle"] },
  { surah: 106, description: "Surah Quraysh — a 4-verse Meccan chapter reminding the Quraysh tribe of Allah's protection and provision, calling them to worship the Lord of the Ka'bah.", themes: ["quraysh", "kaaba", "provision"] },
  { surah: 107, description: "Surah Al-Ma'un (The Small Kindnesses) — a 7-verse Meccan chapter defining true worship as caring for orphans and the needy, not mere ritual.", themes: ["charity", "orphans", "worship"] },
  { surah: 108, description: "Surah Al-Kawthar (The Abundance) — the shortest chapter at 3 verses; promises the Prophet al-Kawthar (abundance), commanding prayer and sacrifice.", themes: ["abundance", "prayer", "sacrifice"] },
  { surah: 109, description: "Surah Al-Kafirun (The Disbelievers) — a 6-verse Meccan chapter declaring the distinction between true worship and disbelief: 'For you is your way; for me, mine.'", themes: ["disbelief", "faith", "distinction"] },
  { surah: 110, description: "Surah An-Nasr (The Divine Support) — a 3-verse Medinan chapter announcing the victory of Islam and the mass acceptance of faith, near the Prophet's death.", themes: ["victory", "islam", "completion"] },
  { surah: 111, description: "Surah Al-Masad (The Palm Fiber) — a 5-verse Meccan chapter condemning Abu Lahab, the Prophet's uncle who bitterly opposed his mission.", themes: ["abu-lahab", "opposition", "fate"] },
  { surah: 112, description: "Surah Al-Ikhlas (The Sincerity) — a 4-verse Meccan chapter, pure monotheism distilled: Allah is One, Eternal, uncreated, unmatched. Equals 1/3 of the Quran in reward.", themes: ["monotheism", "oneness", "essence"] },
  { surah: 113, description: "Surah Al-Falaq (The Daybreak) — a 5-verse chapter of protection: seeking refuge in the Lord of the Daybreak from all forms of evil and envy.", themes: ["protection", "dawn", "refuge"] },
  { surah: 114, description: "Surah An-Nas (Mankind) — the final 6-verse chapter of the Quran, seeking refuge with the Lord of Mankind from the whispering devil within hearts.", themes: ["protection", "mankind", "whisperer"] },
];

async function main() {
  console.log(`Seeding ${DESCRIPTIONS.length} surah descriptions (en)...`);

  const rows = DESCRIPTIONS.map((d) => ({
    surah: d.surah,
    lang: "en",
    description: d.description,
    themes: d.themes,
  }));

  // Batch upsert in chunks of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from("surah_descriptions").upsert(batch, {
      onConflict: "lang,surah",
    });
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
  }

  // Verify
  const { count } = await supabase
    .from("surah_descriptions")
    .select("*", { count: "exact", head: true });
  console.log(`✓ Total rows in surah_descriptions: ${count}`);

  // Length audit
  const lengths = DESCRIPTIONS.map((d) => d.description.length);
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  console.log(`Description lengths: min=${min}, max=${max}, avg=${avg}`);
}

main().catch(console.error);
