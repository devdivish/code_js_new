
// src/components/FiltersSidebar.tsx
import React, { useState, useMemo, useEffect } from 'react';

// Assuming these constants are defined elsewhere and imported
// import { DOCTYPES_MAP, BRANCHES_MAP, SEARCH_TYPES } from './constants';

// Define props needed by the sidebar
interface FiltersSidebarProps {
  handleClearAllFilters: () => void; // *** NEW ***
  searchQueries: string[]; // *** NEW ***

  yearFilter: string;
  setYearFilter: (value: string) => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
  searchType: 'any' | 'all';
  handleSearchTypeChange: (value: 'any' | 'all') => void;


  // *** CHANGED *** Props for dynamic DocType filtering
  selectedDocTypeValues: Set<string>;             // Use Set for selected values
  handleDocTypeChange: (value: string) => void;  // Handler accepts the value (string)
  docTypeCounts: { [key: string]: number } | null; // Counts object or null

  selectedBranchTypeValues: Set<string>;             // Use Set for selected values
  handleBranchTypeChange: (value: string) => void;  // Handler accepts the value (string)
  branchTypeCounts: { [key: string]: number } | null; // Counts object or null

  selectedExtensionTypeValues: Set<string>;             // Use Set for selected values
  handleExtensionTypeChange: (value: string) => void;  // Handler accepts the value (string)
  extensionTypeCounts: { [key: string]: number } | null; // Counts object or null



  // Pass constants as props or import them directly if they are in a shared location
  DOCTYPES_MAP: { label: string; value: string }[];
  BRANCHES_MAP: { label: string; value: string }[];
  EXTENSIONS_MAP: { label: string; value: string }[];
  SEARCH_TYPES: string[];

    // *** NEW *** Optional isLoading prop
    isLoading?: boolean;
}

// *** NEW *** Helper function to get label from value
const getLabelFromValue = (value: string, map: {label: string; value: string}[]): string => {
  const found = map.find(item => item.value === value);
  // Example handling for potential empty string key from aggregations
  if (value.trim() === "") return "Empty Key";
  return found ? found.label : value; // Fallback to showing the raw value if no label defined
};

const INITIAL_VISIBLE_ITEMS = 5;

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  handleClearAllFilters, // *** NEW *** Destructure
  searchQueries, // *** NEW *** Destructure
  yearFilter, setYearFilter,
  fromDate, setFromDate,
  toDate, setToDate,
  searchType, handleSearchTypeChange,
  selectedBranchTypeValues, handleBranchTypeChange, branchTypeCounts,
  // *** CHANGED *** Destructure new/updated DocType props
  selectedDocTypeValues, handleDocTypeChange, docTypeCounts,
  DOCTYPES_MAP, BRANCHES_MAP, EXTENSIONS_MAP, SEARCH_TYPES,

  selectedExtensionTypeValues,handleExtensionTypeChange,extensionTypeCounts,

  
  // *** NEW *** Destructure isLoading
  isLoading
  
}) => {

  const [localFromDate, setLocalFromDate] = useState(fromDate);
  const [localToDate, setLocalToDate] = useState(toDate);

  useEffect(() => {
    setLocalFromDate(fromDate);
    setLocalToDate(toDate);
  }, [fromDate, toDate]);


  const [showAllDocTypes, setShowAllDocTypes] = useState(false);
  const [showAllBranchTypes, setShowAllBranchTypes] = useState(false);
  const[showAllExtensionTypes,setShowAllExtensionTypes]=useState(false);
      // *** NEW *** Prepare the list of DocTypes to render based on received counts
      const availableDocTypes = React.useMemo(() => {
        if (docTypeCounts === null || docTypeCounts === undefined) {
            // If counts are null/undefined (loading, error, or not applicable), show nothing yet
            return [];
        }

        return Object.entries(docTypeCounts)
             // Optional: Filter out types with 0 count if desired
             // .filter(([value, count]) => count > 0)
             // Optional: Filter out specific unwanted keys (like empty strings if they are invalid)
             .filter(([value, count]) => value.trim() !== "")
             .map(([value, count]) => ({
                value: value,
                label: getLabelFromValue(value, DOCTYPES_MAP), // Get display label
                count: count
            }))
            // Sort alphabetically by label
            .sort((a, b) => a.label.localeCompare(b.label));

    }, [docTypeCounts, DOCTYPES_MAP]); // Recalculate only when counts or the base map changes

    const visibleDocTypes = useMemo(() => {
      return showAllDocTypes ? availableDocTypes : availableDocTypes.slice(0, INITIAL_VISIBLE_ITEMS);
    }, [availableDocTypes, showAllDocTypes]);


    
  
  

    const availableBranchTypes = useMemo(() => {
      if (branchTypeCounts === null || branchTypeCounts === undefined) return [];
      return Object.entries(branchTypeCounts)
           .filter(([value]) => value.trim() !== "")
           .map(([value, count]) => ({
              value: value,
              label: getLabelFromValue(value, BRANCHES_MAP),
              count: count
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
    }, [branchTypeCounts, BRANCHES_MAP]);
  
    const visibleBranchTypes = useMemo(() => {
      return showAllBranchTypes ? availableBranchTypes : availableBranchTypes.slice(0, INITIAL_VISIBLE_ITEMS);
    }, [availableBranchTypes, showAllBranchTypes]);


    const availableExtensionTypes = useMemo(() => {
      if (extensionTypeCounts === null || extensionTypeCounts === undefined) return [];
      return Object.entries(extensionTypeCounts)
           .filter(([value]) => value.trim() !== "")
           .map(([value, count]) => ({
              value: value,
              label: getLabelFromValue(value, EXTENSIONS_MAP),
              count: count
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
    }, [extensionTypeCounts, EXTENSIONS_MAP]);
  
    const visibleExtensionTypes = useMemo(() => {
      return showAllExtensionTypes ? availableExtensionTypes : availableExtensionTypes.slice(0, INITIAL_VISIBLE_ITEMS);
    }, [availableExtensionTypes, showAllExtensionTypes]);

    const totalDocTypeCount = useMemo(() => {
      return availableDocTypes.reduce((sum, type) => sum + type.count, 0);
    }, [availableDocTypes]);
  
    const totalBranchTypeCount = useMemo(() => {
      return availableBranchTypes.reduce((sum, type) => sum + type.count, 0);
    }, [availableBranchTypes]);
  
    const totalExtensionTypeCount = useMemo(() => {
      return availableExtensionTypes.reduce((sum, type) => sum + type.count, 0);
    }, [availableExtensionTypes]);

    const handleApplyDateFilter = () => {
        if (localFromDate && !localToDate) {
          alert('Please select an end date.');
          return;
        }
        if (!localFromDate && localToDate) {
          alert('Please select a start date.');
          return;
        }
        if (localFromDate && localToDate && new Date(localFromDate) > new Date(localToDate)) {
            alert('The "From" date cannot be after the "To" date.');
            return;
        }
        setFromDate(localFromDate);
        setToDate(localToDate);
      };

 // *** NEW *** Handler for clearing just the date range
 const handleClearDateRange = () => {
    setLocalFromDate('');
    setLocalToDate('');
    setFromDate('');
    setToDate('');
  // Optionally, if year filter should also be enabled when dates are cleared:
  // setYearFilter(''); // Or set to a default if you have one
};

// Determine if any filter is active (excluding search queries themselves for this check)
// This is for enabling/disabling the "Clear All Filters" button
const isAnyFilterActive = useMemo(() => {
  return (
    yearFilter !== '' ||
    fromDate !== '' ||
    toDate !== '' ||
    searchType !== 'any' || // Assuming 'any' is the default search type
    selectedDocTypeValues.size > 0 ||
    selectedBranchTypeValues.size > 0
  );
}, [yearFilter, fromDate, toDate, searchType, selectedDocTypeValues, selectedBranchTypeValues]);

    

  return (
    <div className="w-1/6 p-4 bg-gray-100 border-r border-gray-300 min-h-screen">
      <h2 className="text-lg font-bold mb-4">Filters</h2>

      {/* Year Filter */}
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Select Year</h3>
        <select
          value={yearFilter}
          // Clear specific dates when year is selected
          onChange={(e) => { setYearFilter(e.target.value); setFromDate(''); setToDate(''); }}
          className="border rounded-md p-2 w-full"
          disabled={!!fromDate || !!toDate}
        >
          <option value="">Any Year</option>
          {/* Make year generation dynamic relative to current year */}
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
               <option key={year} value={year}>{year}</option>
          ))}
        </select>
        {(!!fromDate || !!toDate) && <p className="text-xs text-gray-500 mt-1">Clear dates to use year.</p>}
      </div>


      {/* Search Type Filter (UPDATED) */}
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-1">Searched Terms</h3> {/* Changed title slightly */}
        
        {/* *** NEW *** Displaying the search queries */}
        {searchQueries && searchQueries.length > 0 ? (
          <div className="mb-3 p-2 bg-gray-200 rounded text-sm">
            {searchQueries.map((query, index) => (
              <div key={index} className="truncate" title={query}>
                • {query}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-2 italic">No search terms entered.</p>
        )}

        <h4 className="text-sm font-semibold mb-1 mt-2">Match:</h4> {/* Sub-heading for radio buttons */}
        <div className="flex flex-col gap-1"> {/* Reduced gap */}
          {/* Hardcoding "any" and "all" options directly */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="any"
              checked={searchType === 'any'}
              onChange={() => handleSearchTypeChange('any')}
              className="h-4 w-4"
              disabled={isLoading || !searchQueries || searchQueries.length === 0} // Disable if no queries
            />
            <span>Any word</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="all"
              checked={searchType === 'all'}
              onChange={() => handleSearchTypeChange('all')}
              className="h-4 w-4"
              disabled={isLoading || !searchQueries || searchQueries.length === 0} // Disable if no queries
            />
            <span>All words</span>
          </label>
        </div>
      </div>




      {/* Date Range Filter */}
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Select Date Range</h3>
        <div className="flex flex-col gap-2">
          <label className="text-sm">From:</label>
          <input
            type="date"
            value={localFromDate}
            onChange={(e) => { setLocalFromDate(e.target.value); setYearFilter(""); }} // Clear year
            className="border rounded-md p-2 w-full"
          />
          <label className="text-sm">To:</label>
          <input
            type="date"
            value={localToDate}
            onChange={(e) => { setLocalToDate(e.target.value); setYearFilter(""); }} // Clear year
            className="border rounded-md p-2 w-full"
          />
        </div>
        <button
          onClick={handleApplyDateFilter}
          className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          disabled={isLoading || (fromDate === localFromDate && toDate === localToDate)}
        >
          Apply Date Filter
        </button>
        {yearFilter && <p className="text-xs text-gray-500 mt-1">Year filter is active.</p>}
      
      {/* *** NEW *** Clear Date Range Button */}
      {(localFromDate || localToDate) && (
            <button
              onClick={handleClearDateRange}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 focus:outline-none"
              disabled={isLoading}
            >
              Clear Date Range
            </button>
          )}
        </div>

      

    {/* Document Type Filter */}
      {/* ... (Document Type filter code with See More/Less remains the same) ... */}
      <div className="mb-4">
          <h3 className="text-md font-semibold mb-2 flex items-center">
            <span>Document Type</span>
            {docTypeCounts && totalDocTypeCount > 0 && (
                <span className="ml-2 text-gray-500 font-normal text-sm">
                    ({totalDocTypeCount})
                </span>
            )}
          </h3>
          {isLoading && docTypeCounts === null && (
              <div className="text-sm text-gray-500">Loading counts...</div>
          )}
          {!isLoading && docTypeCounts !== null && availableDocTypes.length === 0 && (
                <div className="text-sm text-gray-500">No types found.</div>
          )}
          {docTypeCounts !== null && availableDocTypes.length > 0 && (
              <div className="flex flex-col gap-1">
                  {visibleDocTypes.map((type) => (
                      <label key={type.value} className="flex items-center space-x-2 cursor-pointer text-sm py-0.5">
                          <input
                              type="checkbox"
                              checked={selectedDocTypeValues.has(type.value)}
                              onChange={() => handleDocTypeChange(type.value)}
                              className="h-3.5 w-3.5"
                              disabled={isLoading}
                          />
                          <span className="truncate" title={type.label}>{type.label}</span>
                          <span className="ml-auto text-gray-500 text-xs">({type.count})</span>
                      </label>
                  ))}
                  {availableDocTypes.length > INITIAL_VISIBLE_ITEMS && (
                      <button
                          onClick={() => setShowAllDocTypes(!showAllDocTypes)}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-1 text-left focus:outline-none"
                          disabled={isLoading}
                      >
                          {showAllDocTypes ? 'See less' : `See more (${availableDocTypes.length - INITIAL_VISIBLE_ITEMS} more)`}
                      </button>
                  )}
              </div>
          )}
      </div>



     {/* Branch Type Filter */}
      {/* ... (Branch Type filter code with See More/Less remains the same) ... */}
      <div className="mb-4">
          <h3 className="text-md font-semibold mb-2 flex items-center">
            <span>Branch Type</span>
            {branchTypeCounts && totalBranchTypeCount > 0 && (
                <span className="ml-2 text-gray-500 font-normal text-sm">
                    ({totalBranchTypeCount})
                </span>
            )}
          </h3>
          {isLoading && branchTypeCounts === null && (
              <div className="text-sm text-gray-500">Loading counts...</div>
          )}
          {!isLoading && branchTypeCounts !== null && availableBranchTypes.length === 0 && (
                <div className="text-sm text-gray-500">No types found.</div>
          )}
          {branchTypeCounts !== null && availableBranchTypes.length > 0 && (
              <div className="flex flex-col gap-1">
                  {visibleBranchTypes.map((type) => (
                      <label key={type.value} className="flex items-center space-x-2 cursor-pointer text-sm py-0.5">
                          <input
                              type="checkbox"
                              checked={selectedBranchTypeValues.has(type.value)}
                              onChange={() => handleBranchTypeChange(type.value)}
                              className="h-3.5 w-3.5"
                              disabled={isLoading}
                          />
                          <span className="truncate" title={type.label}>{type.label}</span>
                          <span className="ml-auto text-gray-500 text-xs">({type.count})</span>
                      </label>
                  ))}
                  {availableBranchTypes.length > INITIAL_VISIBLE_ITEMS && (
                      <button
                          onClick={() => setShowAllBranchTypes(!showAllBranchTypes)}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-1 text-left focus:outline-none"
                          disabled={isLoading}
                      >
                          {showAllBranchTypes ? 'See less' : `See more (${availableBranchTypes.length - INITIAL_VISIBLE_ITEMS} more)`}
                      </button>
                  )}
              </div>
          )}
      </div>


      {/*--- EXTENSION TYPE */}
      <div className="mb-4">
          <h3 className="text-md font-semibold mb-2 flex items-center">
            <span>Extension Type</span>
            {extensionTypeCounts && totalExtensionTypeCount > 0 && (
                <span className="ml-2 text-gray-500 font-normal text-sm">
                    ({totalExtensionTypeCount})
                </span>
            )}
          </h3>
          {/* Handle Loading/Empty States */}
          {isLoading && extensionTypeCounts === null && (
              <div className="text-sm text-gray-500">Loading counts...</div>
          )}
          {!isLoading && extensionTypeCounts !== null && availableExtensionTypes.length === 0 && (
                <div className="text-sm text-gray-500">No types found for current results.</div>
          )}
          {/* Render checkboxes only if counts are loaded and non-empty */}
          {extensionTypeCounts !== null && availableExtensionTypes.length > 0 && (
              <div className="flex flex-col gap-2">
                  {/* Map over the dynamically prepared list */}
                  {availableExtensionTypes.map((type) => (
                      <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                              type="checkbox"
                              // *** CHANGED *** Use the Set to determine checked state
                              checked={selectedExtensionTypeValues.has(type.value)}
                              // *** CHANGED *** Pass the type's value to the handler
                              onChange={() => handleExtensionTypeChange(type.value)}
                              className="h-4 w-4"
                              disabled={isLoading} // Disable if loading
                          />
                          {/* Display the label and the count */}
                          <span>{type.label}</span>
                          {/* *** NEW *** Display count */}
                          <span className="ml-1 text-gray-500 text-sm">({type.count})</span>
                      </label>
                  ))}
              </div>
          )}
      </div>

          {/* --- Clear All Filters Button (STICKY BOTTOM) --- */}
      {/* *** NEW *** */}
      <div className="mt-auto pt-4 border-t border-gray-300"> {/* mt-auto pushes to bottom, pt-4 for spacing */}
        <button
          onClick={handleClearAllFilters}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !isAnyFilterActive} // Disable if loading or no filters are active
        >
          Clear All Filters
        </button>
      </div>



    </div>
  );
};

export default FiltersSidebar;
