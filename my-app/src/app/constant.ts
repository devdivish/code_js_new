// --- Configuration ---
export const API_BASE_URL = "http://localhost:8000"; // ADJUST TO YOUR BACKEND URL (FastAPI default is 8000)
export const PAGE_SIZE = 10; // How many documents to fetch per page

// --- Filter Mappings (Adjust values and ES field names as needed) ---


export const DOCTYPES_MAP = [
  {label:"WAN",value:"WAN"},
  { label: "Cipher", value: "Cipher" },
  { label: "SR", value: "SR" },
  { label: "SPR", value: "SPR" },
  { label: "Collation", value: "Collation" },
  { label: "Kavach", value: "Kavach" },
  { label: "UO", value: "UO" },
  { label: "EIS", value: "EIS" },
  { label: "DSI", value: "DSI" },
  { label: "WR", value: "WR" },
  { label: "WhatsApp contact", value: "WhatsApp contact" },
  { label: "DOTR", value: "DOTR" },
  { label: "FR", value: "FR" },
  { label: "Profiles", value: "Profiles" },
  { label: "Notes", value: "Notes" },
  { label: "MR", value: "MR" },
  { label: "MAC", value: "MAC" },
  { label: "Media", value: "Media" },
  { label: "SSI", value: "SSI" },
  { label: "SecyBrief", value: "SecyBrief" },
  { label: "WSI", value: "WSI" },
  { label: "MISC", value: "MISC" },
  { label: "NSA Notes", value: "NSA Notes" },
  { label: "SPRtest", value: "SPRtest" },
  { label: "CIPHER", value: "CIPHER" },
  { label: "SPPtest", value: "SPPtest" },
  { label: "DocTypeSPRTest", value: "DocTypeSPRTest" }
];
export const ES_DOCTYPE_FIELD = "DocType"; // <<< REPLACE with your actual ES field name for document type

export const BRANCHES_MAP = [
  {label:"WAN",value:"WAN"},
  { label: "Cipher", value: "Cipher" },
  { label: "SR", value: "SR" },
  { label: "SPR", value: "SPR" },
  { label: "Collation", value: "Collation" },
  { label: "Kavach", value: "Kavach" },
  { label: "UO", value: "UO" },
  { label: "EIS", value: "EIS" },
  { label: "DSI", value: "DSI" },
  { label: "WR", value: "WR" },
  { label: "WhatsApp contact", value: "WhatsApp contact" },
  { label: "DOTR", value: "DOTR" },
  { label: "FR", value: "FR" },
  { label: "Profiles", value: "Profiles" },
  { label: "Notes", value: "Notes" },
  { label: "MR", value: "MR" },
  { label: "MAC", value: "MAC" },
  { label: "Media", value: "Media" },
  { label: "SSI", value: "SSI" },
  { label: "SecyBrief", value: "SecyBrief" },
  { label: "WSI", value: "WSI" },
  { label: "MISC", value: "MISC" },
  { label: "NSA Notes", value: "NSA Notes" },
  { label: "SPRtest", value: "SPRtest" },
  { label: "CIPHER", value: "CIPHER" },
  { label: "SPPtest", value: "SPPtest" },
  { label: "DocTypeSPRTest", value: "DocTypeSPRTest" }
];

export const EXTENSIONS_MAP = [
  { label: "Finance", value: "Finance" },
  { label: "HR", value: "HR" },
  { label: "Engineering", value: "Engineering" },
  { label: "Marketing", value: "Marketing" },
  { label: "Legal", value: "Legal" },
];
export const ES_BRANCH_FIELD = "Branch"; // <<< REPLACE with your actual ES field name for branch type
export const ES_EXTENSION_FIELD = "FileExtension"; 
 export const SEARCH_TYPES = ["any", "all"];

