// Make this a Client Component because we need state and event handlers
'use client';

import React, { useState, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

// Define the search type options
type SearchType = 'all' | 'any';


export default function HomePage() {
    const [query, setQuery] = useState<string>('');
    const [searchType, setSearchType] = useState<SearchType>('all'); // Default to 'all'
    const router = useRouter();

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); 

        if (!query.trim()) {
            console.log('Search query is empty');
            return;
        }

        const phraseMatches = query.matchAll(/"([^"]*)"/g);
        let extractedPhrases = Array.from(phraseMatches, match => match[1])
                                     .filter(phrase => phrase.trim() !== "");

            // ⬅ ADDED: if no quoted phrases but user typed something, treat whole query as one phrase
        if (extractedPhrases.length === 0 && query.trim() !== "") {
            extractedPhrases = [query.trim()];
        }

        if (extractedPhrases.length === 0) {
             console.log('No valid phrases found in query:', query);
             // Optionally show an error message to the user
             alert('Please enter search terms enclosed in double quotes, e.g., "term one" "term two".');
             return;
        }

        const params = new URLSearchParams({
            q: JSON.stringify(extractedPhrases), 
            type: searchType,
        });
        router.push(`/SearchTest?${params.toString()}`);
    };

    return (
        // --- BEGIN CHANGED SECTION ---
        <main className="flex min-h-screen flex-col items-center justify-start bg-white p-4 pt-36"> {/* CHANGED: justify-center to justify-start, added pt-20 */}
            <div className="w-full max-w-2xl flex flex-col items-center">
                {/* 1. Logo */}
                <div className="mb-6"> {/* CHANGED: mb-8 to mb-6 */}
                    <Image
                        src="/1736320308928_final2.jpg" // Replace with your logo path in /public
                        alt="Your App Logo"
                        width={600} 
                        height={220} 
                        priority 
                    />
                </div>
                {/* --- END CHANGED SECTION --- */}

                {/* 2. Search Form */}
                <form onSubmit={handleSearch} className="w-full flex flex-col items-center">
                    {/* Search Input */}
                    <div className="relative w-full max-w-xl mb-6">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='e.g., "machine learning" "data science trends"'
                            className="w-full px-5 py-3 border border-gray-200 rounded-full shadow-sm text-gray-900 placeholder-gray-400
 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:shadow-md transition-shadow"
                            aria-label="Search documents"
                        />
                        <button
                            type="submit"
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1"
                            aria-label="Submit search"
                        >
                            <svg
                                className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* 3. Search Options & Submit Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        {/* Radio Buttons for Search Type */}
                        <fieldset className="flex space-x-6">
                            <legend className="sr-only">Search Type</legend>
                            <div>
                                <input
                                    type="radio"
                                    id="searchAll"
                                    name="searchType"
                                    value="all"
                                    checked={searchType === 'all'}
                                    onChange={() => setSearchType('all')}
                                    className="mr-1.5 accent-blue-600"
                                />
                                <label htmlFor="searchAll" className="text-sm text-gray-700 cursor-pointer">
                                    All of these phrases
                                </label>
                            </div>
                            <div>
                                <input
                                    type="radio"
                                    id="searchAny"
                                    name="searchType"
                                    value="any"
                                    checked={searchType === 'any'}
                                    onChange={() => setSearchType('any')}
                                    className="mr-1.5 accent-blue-600"
                                />
                                <label htmlFor="searchAny" className="text-sm text-gray-700 cursor-pointer">
                                    Any of these phrases
                                </label>
                            </div>
                        </fieldset>

                        {/* Submit Button */}
                        {/* --- BEGIN CHANGED SECTION --- */}
                        <button
                            type="submit"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 px-4 rounded-md border border-gray-200 transition-colors" /* CHANGED: rounded to rounded-md */
                        >
                            Search Documents
                        </button>
                        {/* --- END CHANGED SECTION --- */}
                    </div>
                </form>
                <p className="mt-6 text-xs text-gray-500">
                   Enter phrases enclosed in double quotes. e.g., "term one" "another term"
                </p>
            </div>
        </main>
    );
}