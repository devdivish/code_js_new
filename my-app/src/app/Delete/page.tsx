"use client";

import React, { useEffect, useState, useCallback,useMemo ,FormEvent} from "react";
import { useSearchParams } from "next/navigation";

import DateFormatter from './../components/DateFormatter'; // adjust path as needed
import FiltersSidebar from "../components/FiltersSidebar";
import SearchResultsArea from "../components/SearchResultsArea";
import Header from "../components/Header";


import GridView1 from "../components/GridView1";

// --- Configuration ---
import { FaList, FaTh } from 'react-icons/fa';


// --- Configuration ---
import {API_BASE_URL, PAGE_SIZE, DOCTYPES_MAP, ES_DOCTYPE_FIELD, BRANCHES_MAP, ES_BRANCH_FIELD,SEARCH_TYPES,ES_EXTENSION_FIELD,EXTENSIONS_MAP} from '../constant'; // Assuming constants are in ../constants.ts


// --- Interface
import { Document, BackendResponse } from '../types'; // Assuming types are in ../types.ts

// --- Component ---
const DocumentList = () => {
  const searchParams = useSearchParams();


  const initialSearchTypeFromUrl = searchParams.get("type") as "any" | "all" | null;
  const rawQueryFromUrl = searchParams.get("q") || ""; // Query as a JSON string or simple string

  
  const docIdFromUrl=searchParams.get("PropId");
  const parentIdFromUrl=searchParams.get("ParentPropId") || "";
  const IsAttachmentFromUrl=searchParams.get("isAttachment")==="true" ;   // the case has to be handled where this might be string

  


  // State  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchAfter, setSearchAfter] = useState<any[] | null>(null); // For pagination
  const [currentViewTitle, setCurrentViewTitle] = useState<string | null>(null);
  const [view, setView] = useState('reader'); // Add this line
  const [gridPageSize, setGridPageSize] = useState(100);


  // Filter State
  const [yearFilter, setYearFilter] = useState<string>(""); // Use string to easily match select value

  // changed
  const [selectedDocTypeValues, setSelectedDocTypeValues] = useState<Set<string>>(new Set());
  const [selectedBranchTypeValues, setSelectedBranchTypeValues] = useState<Set<string>>(new Set());
  const [selectedExtensionTypeValues, setSelectedExtensionTypeValues] = useState<Set<string>>(new Set());
     // *** NEW ***: State for DocType Counts received from backend
  const [docTypeCounts, setDocTypeCounts] = useState<{ [key: string]: number } | null>(null);
  const [branchTypeCounts, setBranchTypeCounts] = useState<{ [key: string]: number } | null>(null);
   

  const [extensionTypeCounts, setExtensionTypeCounts] = useState<{ [key: string]: number } | null>(null);
   
   

 
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
        // If JSON.parse fails, it's not a JSON string. Treat as a single query.
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



  const fetchDocuments = useCallback(async (isLoadMore = false,attachmentQuery?: {PropId: string,ParentPropId: string, isAttachment: boolean}) => {
    // ... (previous checks for searchQuery remain the same) ...

    if ((fromDate && !toDate) || (!fromDate && toDate)) {
        setError("Please provide a complete date range (both start and end dates).");
        return;
    }

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

    // new
    const activeDocTypes = Array.from(selectedDocTypeValues); // Convert Set to Array
    if (activeDocTypes.length > 0) {
        activeFilters[ES_DOCTYPE_FIELD] = activeDocTypes;
    }

    const activeBranchTypes = Array.from(selectedBranchTypeValues); // Convert Set to Array
    if (activeBranchTypes.length > 0) {
        activeFilters[ES_BRANCH_FIELD] = activeBranchTypes;
    }

    const activeExtensionTypes = Array.from(selectedExtensionTypeValues); // Convert Set to Array
    if (activeExtensionTypes.length > 0) {
        activeFilters[ES_EXTENSION_FIELD] = activeExtensionTypes;
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
      size: view === 'grid' ? gridPageSize : PAGE_SIZE,
      search_type: searchType,
      stream: false, // Explicitly false
      ...(Object.keys(activeFilters).length > 0 && { filters: activeFilters }), // Add filters only if they exist
      ...(Object.keys(activeDateRange).length > 0 && { date_range: activeDateRange }), // Add date_range only if it exists
      ...(currentSearchAfter !== null && { search_after: currentSearchAfter }), // Add search_after only if not null
    };
    if(attachmentQuery){
      endpoint='/handle-attachment-link'
       body2={
        app_id: attachmentQuery?.PropId,
        parent_app_id: attachmentQuery?.ParentPropId,
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

        setSearchAfter(attachmentQuery? null : (data.next_search_after || null));

        // *** NEW *** Store the aggregation counts if available
        if(!attachmentQuery){
          if(data.aggregations?.doctype_counts){
            setDocTypeCounts(data.aggregations.doctype_counts)
          }
          else if(!isLoadMore){
            setDocTypeCounts({})
          }

          // for branch
          if(data.aggregations?.branchtype_counts){
            setBranchTypeCounts(data.aggregations.branchtype_counts)
          } else if(!isLoadMore){
            setBranchTypeCounts({})
          }

          // for branch
          if(data.aggregations?.extensiontype_counts){
            setExtensionTypeCounts(data.aggregations.extensiontype_counts)
          } else if(!isLoadMore){
            setExtensionTypeCounts({})
          }
        }
      // Do not update counts if it was an attachment view or load more action without new counts

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
      parsedApiQueries, searchAfter, yearFilter, selectedDocTypeValues, selectedBranchTypeValues,selectedExtensionTypeValues, searchType, fromDate, toDate,documents,adaptDocs, view, gridPageSize
    ]
  );





  // handle attachment/parenyt link



  const handleAttachmentLinkClick = useCallback(async (clickedDoc: Document) => {
    const PropId = clickedDoc.PropId || ""
    const is_attachment = clickedDoc.IsAttachment === true || String(clickedDoc.IsAttachment).toLowerCase() === "true";
    const parentPropId = clickedDoc.ParentPropId || ""
    
    const newUrl = `${window.location.origin}${window.location.pathname}?PropId=${encodeURIComponent(PropId)}&ParentPropId=${encodeURIComponent(parentPropId)}&isAttachment=${encodeURIComponent(is_attachment)}`
    console.log(newUrl)
  
  window.open(newUrl,'_blank');
  },[]);

  // effect for handling attachment or parents
  useEffect(() => {
    if(docIdFromUrl){
    setDocuments([]);
    setSearchAfter(null);
    fetchDocuments(false,{PropId: docIdFromUrl,ParentPropId: parentIdFromUrl,isAttachment: IsAttachmentFromUrl}); // false indicates it's not a "Load More" action
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
      selectedDocTypeValues,
      selectedBranchTypeValues,
      selectedExtensionTypeValues,
      searchType,
      fromDate,
      toDate,
      docIdFromUrl,
      gridPageSize,
      view
  ]);


  // --- Event Handlers ---
  // --- Filter Change Handlers ---
    // *** CHANGED ***: Handler now accepts the DocType 'value' (string)
    const handleDocTypeChange = useCallback((docTypeValue: string) => {
      setSelectedDocTypeValues(prev => {
          const newSet = new Set(prev);
          if (newSet.has(docTypeValue)) {
              newSet.delete(docTypeValue); // Uncheck
          } else {
              newSet.add(docTypeValue);    // Check
          }
          return newSet;
      });
      // Search is triggered by useEffect dependency change
  }, []);

  const handleBranchTypeChange = useCallback((branchTypeValue: string) => {
    setSelectedBranchTypeValues(prev => {
        const newSet = new Set(prev);
        if (newSet.has(branchTypeValue)) {
            newSet.delete(branchTypeValue); // Uncheck
        } else {
            newSet.add(branchTypeValue);    // Check
        }
        return newSet;
    });
    // Search is triggered by useEffect dependency change
}, []);

const handleExtensionTypeChange = useCallback((extensionTypeValue: string) => {
  setSelectedExtensionTypeValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(extensionTypeValue)) {
          newSet.delete(extensionTypeValue); // Uncheck
      } else {
          newSet.add(extensionTypeValue);    // Check
      }
      return newSet;
  });
  // Search is triggered by useEffect dependency change
}, []);

  // Consider using Radio buttons for Search Type for single selection
  const handleSearchTypeChange = (type: "any" | "all") => {
      setSearchType(type);
  }

  const handleClearAllFilters = () => {
    setYearFilter('');
    setFromDate('');
    setToDate('');
    setSearchType('any'); // Reset to default
    setSelectedDocTypeValues(new Set());
    setSelectedBranchTypeValues(new Set());
    // setSearchQueries([]); // Decide if you want to clear search terms too
    // You might also want to trigger a new search with cleared filters here
    // or reset pagination, etc.
    console.log("All filters cleared!");
  };

  
  // --- Render ---
  return (
    <div className="bg-white text-black">
      <Header />
      <div className="flex">
        {view === 'reader' && (
          <FiltersSidebar
            // Pass all filter states and handlers
            searchQueries={parsedApiQueries}
            handleClearAllFilters={handleClearAllFilters}
            yearFilter={yearFilter} setYearFilter={setYearFilter}
            fromDate={fromDate} setFromDate={setFromDate}
            toDate={toDate} setToDate={setToDate}
            searchType={searchType} handleSearchTypeChange={handleSearchTypeChange}
            selectedDocTypeValues={selectedDocTypeValues} handleDocTypeChange={handleDocTypeChange}
            docTypeCounts={docTypeCounts}
            selectedBranchTypeValues={selectedBranchTypeValues} handleBranchTypeChange={handleBranchTypeChange}
            branchTypeCounts={branchTypeCounts}
            selectedExtensionTypeValues={selectedExtensionTypeValues} handleExtensionTypeChange={handleExtensionTypeChange}
            extensionTypeCounts={extensionTypeCounts} 
            // Pass constants
            DOCTYPES_MAP={DOCTYPES_MAP}
            BRANCHES_MAP={BRANCHES_MAP}
            EXTENSIONS_MAP={EXTENSIONS_MAP}
            SEARCH_TYPES={SEARCH_TYPES}
            isLoading={loading}
          />
        )}

        {/* Document List Section */}
        <div className={view === 'reader' ? "w-5/6 p-4" : "w-full p-4"}>
          <div className="flex justify-end mb-4">
            <button onClick={() => setView('reader')} className={`p-2 ${view === 'reader' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} title="Reader View"><FaList /></button>
            <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} title="Grid View"><FaTh /></button>
          </div>
          {view === 'reader' ? (
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
            />
          ) : (
            <GridView1 
              documents={documents} 
              pageSize={gridPageSize} 
              onPageSizeChange={setGridPageSize} 
              isLoading={loading} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentList;
