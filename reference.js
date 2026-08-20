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
