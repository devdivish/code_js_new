
from fastapi import FastAPI, Query, HTTPException,Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, AsyncGenerator,Dict, Any,Tuple
from starlette.responses import StreamingResponse
import httpx
import logging
import os
from dotenv import load_dotenv
import json 
from datetime import datetime,timezone,time,timedelta
import re


app = FastAPI()



# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change this when you run on production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],)



# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/app.log"),         # Write to logs/app.log
        logging.StreamHandler()                      # Also print to console
    ]
)

logger = logging.getLogger(__name__)








# Elasticsearch configuration
ES_HOST = "http://localhost:9200/"
ES_INDEX = "document_index"



idx_url="http://localhost:9200/documents_index"

def to_epoch_millis(date_str):
    dt_naive=datetime.strptime(date_str,"%Y-%m-%d")
    dt_aware_utc=datetime.combine(dt_naive.date(),time.min,tzinfo=timezone.utc)
    return int(dt_aware_utc.timestamp())





@app.post("/handle-attachment-link")
async def handle_attachment_link(payload: Dict[str, Any] = Body(...)):
    print("hello")
    PropId = payload.get("app_id")
    ParentPropId = payload.get("parent_app_id")
    is_attachment = payload.get("is_attachment")


    # check once with sir
    MAX_ATTACHMENT_RESULTS=1000
    
    print(f"{PropId}, {ParentPropId}re, {is_attachment}")
    if is_attachment=="False":
        is_attachment=0

    if PropId is None and ParentPropId is None:
        raise HTTPException(status_code=400, detail="Required fields missing: app_id, parent_app_id, is_attachment")

    if is_attachment:
        print(f"{ParentPropId} hello")
        # If it is an attachment, find parent where AppId == ParentAppId
        

        query={ "query": {
            "bool": {
              "must": [
                {
                  "term": {
                    "PropId.keyword": ParentPropId
                  }
                }
              ],
              "must_not": [],
              "should": []
            }
          },
          "highlight":{
          "fields":{
           "Text": {}
          }
          },
          "sort": [
            {"DocumentDate": "desc"},
            {"_id": "asc"}
              ],
          "size": 1  }

        
    else:
        # If it is a main doc, find all attachments where ParentAppId == AppId
        query={ "query": {
            "bool": {
              "must": [
                {
                  "term": {
                    "ParentPropId.keyword": PropId
                  }
                }
              ],
              "must_not": [],
              "should": []
            }
          },
          "highlight":{
          "fields":{
           "Text": {}
          }
          },
          "size": MAX_ATTACHMENT_RESULTS,
          "sort": [
            {"DocumentDate": "desc"},
            {"_id": "asc"}
                     ]  }

        

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{idx_url}/_search"
            response = await client.post(url, json=query)

            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Elasticsearch error: {response.status_code} - {response.text}"
                )

        data = response.json()
        raw_hits = data.get("hits", {}).get("hits", [])

        # Process highlights
        processed_hits = []
        for hit in raw_hits:
            source = hit["_source"]
            highlight = hit.get("highlight", {}).get("Text", [])
            if highlight:
                source["highlighted_text"] = highlight[0]
            else:
                source["highlighted_text"] = source.get("Text", "")
            
            processed_hit = {
                **hit,
                "_source": source
            }
            processed_hits.append(processed_hit)

        documents = [hit["_source"] for hit in processed_hits]
        
        # handle the case where there might be 100 attactcments
        return JSONResponse(content={
            "documents": documents,
            "next_search_after": None
        })
    except httpx.RequestError as e:
        logger.error(f"Elasticsearch connection error: {str(e)}")
        raise HTTPException(status_code=503, detail="Elasticsearch unavailable")
    except Exception as e:
        logger.exception("Unexpected server error")
        raise HTTPException(status_code=500, detail="Internal Server Error")






# ---------------------------------------
async def search_elasticsearch(
    queries: List[str],
    size: int,
    search_type: str = "any",
    search_after: Optional[List] = None,
    filters: Optional[Dict[str, List[str]]] = None,
    date_range: Optional[Dict[str, str]] = None
) -> Tuple[List[dict], Optional[List]]:
    """
    Performs a search against Elasticsearch with pagination using search_after.
    """
    if not queries:
        raise HTTPException(status_code=400, detail="Query list cannot be empty")

    must_clauses = []
    should_clauses = []
    print(queries)
    search_fields_keywords=["OriginalName.keyword","PropId.keyword","ParentPropId.keyword"]
    # Query clauses
    if search_type == "all":

        for q in queries:
            sub_clauses=[]
            sub_clauses.append({"match_phrase": {"Text": q}} )

            for field in search_fields_keywords:
                sub_clauses.append({"term": {field:q}})

            must_clauses.append({"bool": {"should": sub_clauses,"minimum_should_match":1}})
    elif search_type == "any":
        for q in queries:
            sub_clauses = []

            sub_clauses.append({"match_phrase": {"Text": q}})

            for field in search_fields_keywords:
                sub_clauses.append({"term": {field: q}})

            should_clauses.append({"bool": {"should": sub_clauses, "minimum_should_match": 1}})
    else:
        raise HTTPException(status_code=400, detail="Invalid search_type. Use 'any' or 'all'.")

    # Filter clauses
    if filters:
        for field, values in filters.items():
            if values:  # only if list is non-empty
                keyword_field=f"{field}.keyword" if not field.endswith(".keyword") else field
                must_clauses.append({
                    "terms": {keyword_field: values}
                })

    # Date range clause
    
    if date_range:
        range_filter = {}
        if date_range.get("from"):
            range_filter["gte"] = to_epoch_millis(date_range["from"])
        if date_range.get("to"):
            to_dt_naive=datetime.strptime(date_range["to"],"%Y-%m-%d")
            next_day_date_obj=to_dt_naive.date()+timedelta(days=1)
            next_day_start_dt_aware_utc=datetime.combine(next_day_date_obj,time.min,tzinfo=timezone.utc)
            range_filter["lt"] = int(next_day_start_dt_aware_utc.timestamp())

        if range_filter["gte"]:
            print(f" 2nd {datetime.fromtimestamp(range_filter["gte"],tz=timezone.utc)}")
        if range_filter["lt"]:
            print(f" 3nd {datetime.fromtimestamp(range_filter["lt"],tz=timezone.utc)}")
        
        if range_filter:
            must_clauses.append({
                "range": {
                    "DocumentDate": range_filter
                }
            })
        elif range_filter:
            print(f"4th {range_filter}")

    # Final query
    query_body = {
        "bool": {
            "must": must_clauses,
            "should": should_clauses,
            "minimum_should_match": 1 if should_clauses else 0
        }
    }

    search_body = {
        "size": size,
        "sort": [
            {"DocumentDate": "desc"},
            {"_id": "asc"}
        ],
        "track_total_hits": True,
        "query": query_body,
        "highlight": {
            "fields": {
                "Text": {
                "fragment_size":500,

                "number_of_fragments":10,
                "boundary_scanner":"sentence"
                }
            },
            "pre_tags": ["<mark>"],
            "post_tags": ["</mark>"]
        }
        }

    print(search_body)

    if search_after:
        search_body["search_after"] = search_after

# add agrregation for doc
    
    search_body["aggs"]={
        "doctype_counts":{
            "terms":{
                "field": "DocType.keyword",
                "size":100
            }
        },
        #  added for branch type
         "branchtype_counts":{
            "terms":{
                "field": "Branch.keyword",
                "size":100
            }
        },

          "extensiontype_counts":{
            "terms":{
                "field": "FileExtension.keyword",
                "size":100
            }  }


    }

    

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            print("before sending to es")
            url = f"{idx_url}/_search"
            print("after sending to es")
            response = await client.post(url, json=search_body)

            if response.status_code != 200:
                logger.error(f"Elasticsearch error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Elasticsearch responded with status code {response.status_code}: {response.text}"
                )

        data = response.json()
        raw_hits = data.get("hits", {}).get("hits", [])
        total_hits=0
        hits_total=data.get("hits", {}).get("total", [])
        if isinstance(hits_total,dict):
            total_hits=hits_total.get("value",0)


        # Process highlights
        processed_hits = []
        for hit in raw_hits:
            source = hit["_source"]
            
            
            highlight = hit.get("highlight", {}).get("Text", [])
            source["Text"]=source["Text"][:100]
            # print(source)
            if highlight:
                source["highlighted_text"] = highlight[0]
            else:
                source["highlighted_text"] = source.get("Text", "")

                
            if source["IsAttachment"]=="False":
                attachment_path=source.get("Attachments","")
                if attachment_path:
                    # Use a tuple of delimiters to split the string
                    split_result = re.split(r',|@@@@',attachment_path)
                    # Filter out any empty strings and count the non-empty parts
                    a_count = len([x.strip() for x in split_result if x.strip()])
                    
                    print(a_count)
                else:
                    a_count=0
                source["a_count"]=a_count
            
            processed_hit = {
                **hit,
                "_source": source
            }
            processed_hits.append(processed_hit)

        last_sort_value = raw_hits[-1]["sort"] if raw_hits else None



        # extracting and formatting aggrefgation results
        doc_type_counts={}
        branch_type_counts={}
        extension_type_counts={}
        # Check if 'aggregations' key exists in the response
        if "aggregations" in data:
            # Extract the bucket results from the 'doctype_counts' aggregation
            doctype_counts = data["aggregations"]["doctype_counts"]
            branchtype_counts=data["aggregations"]["branchtype_counts"]
            extensiontype_counts=data["aggregations"]["extensiontype_counts"]
            # Iterate over each bucket and store the counts in doc_type_counts
            for bucket in doctype_counts.get("buckets", []):
                key = bucket.get("key")
                doc_count = bucket.get("doc_count")
                
                if key is not None and doc_count is not None:
                    doc_type_counts[key] = doc_count

            for bucket in branchtype_counts.get("buckets",[]):
                key = bucket.get("key")
                branch_count=bucket.get("doc_count")

                if key is not None and branch_count is not None:
                    branch_type_counts[key]=branch_count

            for bucket in extensiontype_counts.get("buckets",[]):
                key = bucket.get("key")
                extension_count=bucket.get("doc_count")

                if key is not None and extension_count is not None:
                    extension_type_counts[key]=extension_count



        # Print the resulting doc_type_counts dictionary
        print(doc_type_counts)


        return processed_hits, last_sort_value,doc_type_counts,branch_type_counts,extension_type_counts,total_hits

    except httpx.RequestError as e:
        logger.error(f"Elasticsearch connection error: {str(e)}")
        raise HTTPException(status_code=503, detail="Elasticsearch is unavailable")
    except Exception as e:
        logger.exception("Unexpected error during Elasticsearch query")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ---------------------------------------
@app.post("/search")
async def stream_or_paginate_search(
    payload: Dict[str, Any] = Body(...)
):
    """
    Handles search requests: 
    - Streams full results if stream=True 
    - Else paginated fetch (one batch at a time)
    """
    queries = payload.get("queries", [])
    size = payload.get("size", 100)
    search_type = payload.get("search_type", "any")
    filters = payload.get("filters", {})
    date_range = payload.get("date_range", {})
    search_after = payload.get("search_after")  # Optional
    stream = payload.get("stream", False)       # Optional, default False

    if not queries or not isinstance(queries, list):
        raise HTTPException(status_code=400, detail="Missing or invalid 'queries' list.")
    
    if not isinstance(size, int) or size <= 0:
        size = 100  # Fallback safe default

    if stream:
        # Full streaming mode
        async def document_generator() -> AsyncGenerator[str, None]:
            nonlocal search_after
            first = True
            yield "["
            while True:
                hits, search_after = await search_elasticsearch(
                    queries, size, search_type, search_after, filters, date_range
                )
                if not hits:
                    break
                for hit in hits:
                    doc_json = hit["_source"]
                    doc_str = f"{'' if first else ','}{json.dumps(doc_json)}"
                    yield doc_str
                    first = False
                if search_after is None:
                    break
            yield "]"

        return StreamingResponse(document_generator(), media_type="application/json")

    else:
        # Paginated mode
        print("abcd")
        hits, last_sort_value,doctype_counts,branchtype_counts,extensiontype_counts,hits_total = await search_elasticsearch(
            queries, size, search_type, search_after, filters, date_range
        )

        documents = [hit["_source"] for hit in hits]
        
        print(hits_total)
        return JSONResponse(content={
            "documents": documents,
            "next_search_after": last_sort_value,
            "aggregations":{
                "doctype_counts": doctype_counts,
                "branchtype_counts": branchtype_counts,
                "extensiontype_counts":extensiontype_counts
            },
            "total":hits_total

        })


