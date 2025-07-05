"use client";

import React, { useEffect, useState, useCallback,useMemo ,FormEvent} from "react";
import { useSearchParams } from "next/navigation";
import { DocumentButton } from "./../components/DocumentButton"; // Assuming this component exists
import DateFormatter from './../components/DateFormatter'; // adjust path as needed
import FiltersSidebar from "../components/FiltersSidebar";
import SearchResultsArea from "../components/SearchResultsArea";


// --- Configuration ---
import {API_BASE_URL, PAGE_SIZE, DOCTYPES_MAP, ES_DOCTYPE_FIELD, BRANCHES_MAP, ES_BRANCH_FIELD,SEARCH_TYPES} from '../constant'; // Assuming constants are in ../constants.ts


// --- Interface
import { Document, BackendResponse } from '../types'; // Assuming types are in ../types.ts


// --- Component ---
const DocumentList = () => {
  const searchParams = useSearchParams();

//   chaged 
  const initialSearchTypeFromUrl = searchParams.get("type") as "any" | "all" | null;
  const rawQueryFromUrl = searchParams.get("query") || ""; // Query as a JSON string or simple string
//   const searchQuery = searchParams.get("query") || "";

  
  const docIdFromUrl=searchParams.get("propId") 
  const parentIdFromUrl=searchParams.get("ParentpropId") || ""
  const IsAttachmentFromUrl=searchParams.get("isAttachment")==="true" ;   // the case has to be handled where this might be string

  


  // State  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchAfter, setSearchAfter] = useState<any[] | null>(null); // For pagination
  const [currentViewTitle, setCurrentViewTitle] = useState<string | null>(null);

  // Filter State
  const [yearFilter, setYearFilter] = useState<string>(""); // Use string to easily match select value
  const [selectedDocTypes, setSelectedDocTypes] = useState<boolean[]>(
    new Array(DOCTYPES_MAP.length).fill(false)
  );
  const [selectedBranchTypes, setSelectedBranchTypes] = useState<boolean[]>(
    new Array(BRANCHES_MAP.length).fill(false)
  );


  // --- BEGIN CHANGED SECTION ---
  // Initialize searchType from URL parameter, default to "any" (or "all" if preferred)
  const [searchType, setSearchType] = useState<"any" | "all">(initialSearchTypeFromUrl || "any");
//   const [searchType, setSearchType] = useState<"any" | "all">("any"); // Radio buttons recommended
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");


  // --- ADDED: Helper to parse query string from URL ---
  const getParsedQueries = useCallback((queryStr: string): string[] => {
    if (!queryStr) return [];
    try {
        const parsed = JSON.parse(queryStr);
        if (Array.isArray(parsed) && parsed.every(q => typeof q === 'string')) {
            return parsed.filter(q => q.trim() !== ""); // Filter out empty strings again just in case
        }
        // If not a JSON array of strings, treat the original string as a single query.
        // This handles cases where q is not a JSON array (e.g. q=term1 or q="term1,term2" from old system/manual URL)
        console.warn("Query parameter 'q' is not a valid JSON array of strings. Treating as a single query term:", queryStr);
        return queryStr.trim() ? [queryStr] : [];
    } catch (e) {
        // If JSON.parse fails, it means it's not a JSON string. Treat as a single query.
        console.warn("Failed to parse query parameter 'q' as JSON. Treating as a single query term:", queryStr, e);
        return queryStr.trim() ? [queryStr] : []; // Fallback: treat as a single query string if not empty
    }
  }, []);

  const parsedApiQueries = useMemo(() => getParsedQueries(rawQueryFromUrl), [rawQueryFromUrl, getParsedQueries]);


  //data adaptation helper function
  const adaptDocs=(docs: Document[]): Document[]=>{
      if (!Array.isArray(docs)){
        console.error("adaptdocs functione error", docs);
        return [];  // empty array if input not valid
      }

  



      return docs.map((Doc)=>{

        const bool=Doc.IsAttachment===true|| String(Doc.IsAttachment).toLowerCase()==="true"
        return{
          DocType: Doc.DocType || Doc.DocumentType || Doc.Branch,
        Text: Doc.Text || "No text found",       
        From: Doc.From || Doc.Branch,
        To: Doc.To,
        ReportNumber: Doc.ReportNumber,
        IngestionDate: Doc.IngestionDate, // Rename 'doc_date' to 'document_date'
        DocumentDate: Doc.DocumentDate,
        FileName: Doc.FileName,
        IsAttachment: bool,
        ...Doc, // Spread any other properties the backend sends
        }
      });


      
  }



  const fetchDocuments = useCallback(async (isLoadMore = false,attachmentQuery?: {propId: string,ParentpropId: string, isAttachment: boolean}) => {
    // ... (previous checks for searchQuery remain the same) ...

    setLoading(true);
    if (!isLoadMore) {
      setError(null);
    }

    const currentSearchAfter = isLoadMore ? searchAfter : null;
    let endpoint="/search"
    let body2={}

    // --- Prepare Payload Data (intermediate steps) ---
    // 1. Filters
    const activeFilters: { [key: string]: string[] } = {}; // Renamed for clarity
    const activeDocTypes = DOCTYPES_MAP
      .filter((_, index) => selectedDocTypes[index])
      .map(dt => dt.value);
    if (activeDocTypes.length > 0) {
      activeFilters[ES_DOCTYPE_FIELD] = activeDocTypes;
    }

    const activeBranches = BRANCHES_MAP
      .filter((_, index) => selectedBranchTypes[index])
      .map(b => b.value);
    if (activeBranches.length > 0) {
      activeFilters[ES_BRANCH_FIELD] = activeBranches;
    }

    // 2. Date Range
    const activeDateRange: { from?: string; to?: string } = {}; // Renamed for clarity
    const tempRange: { gte?: string; lte?: string } = {};
     if (yearFilter) {
        tempRange.gte = `${yearFilter}-01-01`;
        tempRange.lte = `${yearFilter}-12-31`;
    } else {
        if (fromDate) tempRange.gte = fromDate;
        if (toDate) tempRange.lte = toDate;
    }
    // Map to 'from'/'to' if they exist
    if (tempRange.gte) activeDateRange.from = tempRange.gte;
    if (tempRange.lte) activeDateRange.to = tempRange.lte;


    // --- Define Payload Type Explicitly ---
    type PayloadToSend = {
      queries: string[];
      size: number;
      search_type: "any" | "all";
      filters?: { [key: string]: string[] }; // Optional
      date_range?: { from?: string; to?: string }; // Optional
      search_after?: any[] | null; // Optional (null is valid for backend)
      stream: boolean;
    };

    // --- Construct the Payload Object ---
    // Include properties conditionally to avoid undefined where possible
    const payload: PayloadToSend = {
      queries: parsedApiQueries,
      size: PAGE_SIZE,
      search_type: searchType,
      stream: false, // Explicitly false
      ...(Object.keys(activeFilters).length > 0 && { filters: activeFilters }), // Add filters only if they exist
      ...(Object.keys(activeDateRange).length > 0 && { date_range: activeDateRange }), // Add date_range only if it exists
      ...(currentSearchAfter !== null && { search_after: currentSearchAfter }), // Add search_after only if not null
    };
    if(attachmentQuery){
      endpoint='/handle-attachment-link'
       body2={
        app_id: attachmentQuery?.propId,
        parent_app_id: attachmentQuery?.ParentpropId,
        is_attachment: attachmentQuery?.isAttachment
      }
      console.log("ih")
    }
    
    const body1=attachmentQuery?  body2: payload
    console.log("hi")

    // --- Fetch ---
    try {
      console.log(body1)
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the cleanly constructed pay
        body: JSON.stringify(body1),
      });

      

       // ... (rest of the response handling remains the same) ...
       if (!response.ok) {
         // ... (error handling) ...
         throw new Error(`API Error: ${response.status} - ${response.statusText}.`);
       }
       const data: BackendResponse = await response.json();
           // --- Adapt the backend data ---
      
      if (data && Array.isArray(data.documents)){
        
        const adaptedDocuments=adaptDocs(data.documents)
        // setDocuments((prevDocs) =>
        //   isLoadMore ? [...prevDocs, ...adaptedDocuments] : adaptedDocuments
        // );

        setDocuments(isLoadMore && !attachmentQuery ? [...documents,...adaptedDocuments]: adaptedDocuments )

        setSearchAfter(attachmentQuery? null : data.next_search_after);

      }
      else{
        console.error("unexpexte resposne structure",data)
        setError( "Failed to fetch documents.");
        setDocuments([])
      }
      

    } catch (err: any) {
       // ... (catch block remains the same) ...
       setError(err.message || "Failed to fetch documents.");
       setDocuments([])
    } finally {
      setLoading(false);
    }
  }, [
      // ... (dependencies remain the same) ...
      parsedApiQueries, searchAfter, yearFilter, selectedDocTypes, selectedBranchTypes, searchType, fromDate, toDate,documents,adaptDocs
    ]
  );






  // handle attachment/parenyt link



  const handleAttachmentLinkClick = useCallback(async (clickedDoc: Document) => {
    const propId=clickedDoc.propId || ""
    const is_attachment=clickedDoc.IsAttachment === true || String(clickedDoc.IsAttachment).toLowerCase() === "true";
    const ParentpropId=clickedDoc.ParentpropId || ""
    
    const newUrl=`${window.location.origin}${window.location.pathname}?propId=${encodeURIComponent(propId)}&ParentpropId=${encodeURIComponent(ParentpropId)}&isAttachment=${encodeURIComponent(is_attachment)}`
    console.log(newUrl)
  
  window.open(newUrl,'_blank');
  },[]);

  // effect for handling attachment or parents
  useEffect(() => {
    if(docIdFromUrl){
    setDocuments([]);
    setSearchAfter(null);
    fetchDocuments(false,{propId: docIdFromUrl,ParentpropId: parentIdFromUrl,isAttachment: IsAttachmentFromUrl}); // false indicates it's not a "Load More" action
    }
    
  }, [docIdFromUrl,parentIdFromUrl,IsAttachmentFromUrl ]);

  // --- Effects ---
  // Effect for initial load and changes in search query or filters
  useEffect(() => {

    if (docIdFromUrl) return; // Don't run if we are in attachment/parent view

    
    // Reset pagination and fetch first page when query or filters change
    if(parsedApiQueries.length > 0){
    setDocuments([]);
    setSearchAfter(null);
    fetchDocuments(false); // false indicates it's not a "Load More" action

    }
    else if (rawQueryFromUrl && parsedApiQueries.length === 0) {
        // This case means rawQueryFromUrl was present but resulted in no valid queries (e.g. "[]" or malformed)
        setDocuments([]);
        setSearchAfter(null);
        setError("Invalid or empty search query provided. Please use double quotes for phrases.");
        
    }
    else if (!rawQueryFromUrl) {
        // No query was provided in the URL at all (e.g. direct navigation to /SearchResults).
        setDocuments([]);
        setSearchAfter(null);
        setError(null); // Or "Please enter a search query."
     
    }
  }, [
      parsedApiQueries, // Re-fetch if query in URL changes
      yearFilter,
      rawQueryFromUrl,
      selectedDocTypes,
      selectedBranchTypes,
      searchType,
      fromDate,
      toDate,
      docIdFromUrl
  ]);

  // --- Event Handlers ---
  const handleDocTypeChange = (index: number) => {
    setSelectedDocTypes((prev) => {
      const newTypes = [...prev];
      newTypes[index] = !newTypes[index];
      return newTypes;
    });
  };

  const handleBranchTypeChange = (index: number) => {
    setSelectedBranchTypes((prev) => {
      const newTypes = [...prev];
      newTypes[index] = !newTypes[index];
      return newTypes;
    });
  };

  // Consider using Radio buttons for Search Type for single selection
  const handleSearchTypeChange = (type: "any" | "all") => {
      setSearchType(type);
  }

  
  // --- Render ---
  return (
    <div className="flex">
       {/* Sidebar for Filters */}
       <FiltersSidebar
        // Pass all filter states and handlers
        yearFilter={yearFilter} setYearFilter={setYearFilter}
        fromDate={fromDate} setFromDate={setFromDate}
        toDate={toDate} setToDate={setToDate}
        searchType={searchType} handleSearchTypeChange={handleSearchTypeChange}
        selectedDocTypes={selectedDocTypes} handleDocTypeChange={handleDocTypeChange}
        selectedBranchTypes={selectedBranchTypes} handleBranchTypeChange={handleBranchTypeChange}
        // Pass constants
        DOCTYPES_MAP={DOCTYPES_MAP}
        BRANCHES_MAP={BRANCHES_MAP}
        SEARCH_TYPES={SEARCH_TYPES}
      />

      {/* Document List Section */}
      <SearchResultsArea
        // Pass data, loading/error states, and action handlers
        loading={loading}
        error={error}
        documents={documents}
        searchQuery={parsedApiQueries}
        searchAfter={searchAfter}
        fetchDocuments={fetchDocuments} // For Load More button
        handleAttachmentLinkClick={handleAttachmentLinkClick} // For DocumentCard
        currentViewTitle={currentViewTitle} // Pass context title
        // Pass down components if needed by DocumentCard through SearchResultsArea
        // DateFormatter={DateFormatter}
        // DocumentButton={DocumentButton}
      />
    </div>
  );
};

export default DocumentList;