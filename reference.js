// Mirrors supabase/functions/_shared/reference.ts — keep both in sync.

const BRANCHES = ["CORPORATE", "COIMBATORE", "CHENNAI", "COCHIN", "BANGALORE", "HYDERABAD", "VIZAG"];

const PRODUCTS = [
  "TPLINK SMB", "MOLEX", "SONICWALL", "NETFOX RACK", "NETRACK", "SOPHOS",
  "DLINK", "DIGISOL", "TPLINK SOHO", "TPLINK VIGI", "QNAP", "AIRPRO",
];

const VENDORS = [
  "RASHI", "TECHNOBIND", "SATCOM", "REDINGTON", "INFLOW", "SUPERTRON",
  "INGRAM", "MOLEX", "DIGISOL", "INFLOW, REDINGTON, INGRAM", "MODULAR",
  "RASHI / SUPERTRON", "PV LUMENS", "XANTHUS", "GALLANT", "SMC ENTERPRISES",
];

const SPLIT_UPS = ["SINGLE", "MULTIPLE"];
const PO_PURPOSES = ["STOCKING", "B2B"];

// Branch contact directory — the "Prepared for" dropdown per branch.
const BRANCH_PEOPLE = {
  CORPORATE: [
    { name: "Rajaram V (Branch Head)", email: "rajaram@caps.in", whatsapp: "919842273010" },
    { name: "Krishna Kumar", email: "krishna@caps.in", whatsapp: "919942922997" },
    { name: "Gnanaprakasam", email: "gps@caps.in", whatsapp: "919942922668" },
    { name: "Anitha", email: "info@caps.in", whatsapp: "916369141027" },
  ],
  COIMBATORE: [
    { name: "Rajaram V (Branch Head)", email: "rajaram@caps.in", whatsapp: "919842273010" },
    { name: "Krishna Kumar", email: "krishna@caps.in", whatsapp: "919942922997" },
    { name: "Gnanaprakasam", email: "gps@caps.in", whatsapp: "919942922668" },
  ],
  CHENNAI: [
    { name: "Rajaram V (Branch Head)", email: "rajaram@caps.in", whatsapp: "919842273010" },
    { name: "Paul Daniel", email: "saleschn1@caps.in", whatsapp: "919942922174" },
    { name: "Anbuchelvan", email: "anbuchn@caps.in", whatsapp: "919942922194" },
    { name: "Anoop", email: "lkanoop@caps.in", whatsapp: "919942922151" },
    { name: "Senthil Kumar", email: "saleschn2@caps.in", whatsapp: "919942922192" },
    { name: "Meena", email: "supportchn@caps.in", whatsapp: "919942922900" },
  ],
  COCHIN: [
    { name: "Rajaram V (Branch Head)", email: "rajaram@caps.in", whatsapp: "919842273010" },
    { name: "Abhinand", email: "salesekm1@caps.in", whatsapp: "919961993671" },
    { name: "Shiva", email: "salesekm@caps.in", whatsapp: "919961992624" },
    { name: "Sabu", email: "sabuck@caps.in", whatsapp: "918156821100" },
    { name: "Gijo", email: "cochin@caps.in", whatsapp: "919961495523" },
  ],
  BANGALORE: [
    { name: "Vinod R (Branch Head)", email: "vinod@caps.in", whatsapp: "919845499971" },
    { name: "Hemadri", email: "hemadri@caps.in", whatsapp: "919844009870" },
    { name: "Sarala", email: "sarala@caps.in", whatsapp: "919844919333" },
    { name: "Jayshree", email: "salescoblr@caps.in", whatsapp: "919844499971" },
    { name: "Santhosh", email: "channel@caps.in", whatsapp: "919844246657" },
    { name: "Krishnamurthy", email: "kmurthy@caps.in", whatsapp: "919845752409" },
  ],
  HYDERABAD: [
    { name: "Balaji V V (Branch Head)", email: "balaji@caps.in", whatsapp: "919052004363" },
    { name: "Srinivas K", email: "srinivas@caps.in", whatsapp: "919052177795" },
    { name: "Sandeep", email: "sandeep@caps.in", whatsapp: "919052106061" },
    { name: "Srinivas G", email: "saleshyd@caps.in", whatsapp: "919052100063" },
    { name: "Naveen", email: "naveen@caps.in", whatsapp: "918978222517" },
    { name: "Prince", email: "princept@caps.in", whatsapp: "918008911044" },
  ],
  VIZAG: [
    { name: "Balaji V V (Branch Head)", email: "balaji@caps.in", whatsapp: "919052004363" },
    { name: "Vijay K V", email: "vijaykv@caps.in", whatsapp: "918886000459" },
  ],
};

const AGING_BUCKETS = {
  "TPLINK SMB":   ["< 45 DAYS", "45 - 70 DAYS", "70 - 90 DAYS", "> 90 DAYS"],
  "TPLINK SOHO":  ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "TPLINK VIGI":  ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "MOLEX":        ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "SONICWALL":    ["< 90 DAYS", "90 - 120 DAYS", "120 - 150 DAYS", "> 150 DAYS"],
  "NETFOX RACK":  ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "NETRACK":      ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "SOPHOS":       ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "DLINK":        ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "DIGISOL":      ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "QNAP":         ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
  "AIRPRO":       ["< 30 DAYS", "30 - 60 DAYS", "60 - 90 DAYS", "> 90 DAYS"],
};

function approvedPercents(product) {
  if (product === "MOLEX") return [0.50, 0.20, 0.15, 0.15];
  return [0.60, 0.20, 0.15, 0.05];
}

// Mirrors Branch!D10 exactly.
function computeAutoStatus({ overallStock, bucket1, bucket2, bucket3, bucket4, product, poPurpose }) {
  const pct = approvedPercents(product);
  const approved = [overallStock * pct[0], overallStock * pct[1], overallStock * pct[2], overallStock * pct[3]];
  const [a1, a2, a3, a4] = approved;

  let status = "Not Approved";
  if (bucket4 <= a4) status = "Approved";
  else if (bucket2 <= a2 && bucket3 <= a3) status = "Approved";
  else if (bucket2 <= a2 && bucket4 <= a4) status = "Approved";
  else if (bucket3 <= a3 && bucket4 <= a4) status = "Approved";
  else if (poPurpose === "B2B") status = "Approved";

  return { approved, status };
}
