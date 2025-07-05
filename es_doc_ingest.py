from elasticsearch import Elasticsearch, helpers

es = Elasticsearch("http://localhost:9200")

INDEX_NAME = "document_index"

documents = [
  {
    "ProphecyId": "PROP001",
    "ParentProphecyId": "",
    "Text": "Main document about financial markets and trends.",
    "IsAttachment": "False",
    "DocumentDate": 1719792000000,
    "DocType": "Report",
    "Branch": "New York",
    "FileExtension": "pdf"
  },
  {
    "ProphecyId": "PROP002",
    "ParentProphecyId": "PROP001",
    "Text": "Attachment with detailed financial tables.",
    "IsAttachment": "True",
    "DocumentDate": 1719878400000,
    "DocType": "Attachment",
    "Branch": "New York",
    "FileExtension": "xlsx"
  },
  {
    "ProphecyId": "PROP003",
    "ParentProphecyId": "",
    "Text": "Quarterly market analysis overview.",
    "IsAttachment": "False",
    "DocumentDate": 1719964800000,
    "DocType": "Analysis",
    "Branch": "London",
    "FileExtension": "docx"
  },
  {
    "ProphecyId": "PROP004",
    "ParentProphecyId": "PROP003",
    "Text": "Supporting charts and graphs for analysis.",
    "IsAttachment": "True",
    "DocumentDate": 1720051200000,
    "DocType": "Attachment",
    "Branch": "London",
    "FileExtension": "pptx"
  },
  {
    "ProphecyId": "PROP005",
    "ParentProphecyId": "",
    "Text": "Annual report summary.",
    "IsAttachment": "False",
    "DocumentDate": 1720137600000,
    "DocType": "Summary",
    "Branch": "Tokyo",
    "FileExtension": "pdf"
  },
  {
    "ProphecyId": "PROP006",
    "ParentProphecyId": "PROP005",
    "Text": "Detailed appendix for annual report.",
    "IsAttachment": "True",
    "DocumentDate": 1720224000000,
    "DocType": "Attachment",
    "Branch": "Tokyo",
    "FileExtension": "pdf"
  },
  {
    "ProphecyId": "PROP007",
    "ParentProphecyId": "",
    "Text": "Special financial forecast document.",
    "IsAttachment": "False",
    "DocumentDate": 1720310400000,
    "DocType": "Forecast",
    "Branch": "New York",
    "FileExtension": "xlsx"
  },
  {
    "ProphecyId": "PROP008",
    "ParentProphecyId": "PROP007",
    "Text": "Spreadsheet with forecast data.",
    "IsAttachment": "True",
    "DocumentDate": 1720396800000,
    "DocType": "Attachment",
    "Branch": "New York",
    "FileExtension": "xlsx"
  },
  {
    "ProphecyId": "PROP009",
    "ParentProphecyId": "",
    "Text": "Internal memo regarding market risks.",
    "IsAttachment": "False",
    "DocumentDate": 1720483200000,
    "DocType": "Memo",
    "Branch": "London",
    "FileExtension": "docx"
  },
  {
    "ProphecyId": "PROP010",
    "ParentProphecyId": "PROP009",
    "Text": "Risk assessment charts.",
    "IsAttachment": "True",
    "DocumentDate": 1720569600000,
    "DocType": "Attachment",
    "Branch": "London",
    "FileExtension": "pdf"
  },
  {
    "ProphecyId": "PROP011",
    "ParentProphecyId": "",
    "Text": "Marketing strategy document.",
    "IsAttachment": "False",
    "DocumentDate": 1720656000000,
    "DocType": "Strategy",
    "Branch": "Tokyo",
    "FileExtension": "pptx"
  },
  {
    "ProphecyId": "PROP012",
    "ParentProphecyId": "PROP011",
    "Text": "Presentation slides for marketing.",
    "IsAttachment": "True",
    "DocumentDate": 1720742400000,
    "DocType": "Attachment",
    "Branch": "Tokyo",
    "FileExtension": "pptx"
  },
  {
    "ProphecyId": "PROP013",
    "ParentProphecyId": "",
    "Text": "Compliance guidelines document.",
    "IsAttachment": "False",
    "DocumentDate": 1720828800000,
    "DocType": "Guideline",
    "Branch": "New York",
    "FileExtension": "pdf"
  },
  {
    "ProphecyId": "PROP014",
    "ParentProphecyId": "PROP013",
    "Text": "Checklist attachment for compliance.",
    "IsAttachment": "True",
    "DocumentDate": 1720915200000,
    "DocType": "Attachment",
    "Branch": "New York",
    "FileExtension": "docx"
  },
  {
    "ProphecyId": "PROP015",
    "ParentProphecyId": "",
    "Text": "Research paper on market trends.",
    "IsAttachment": "False",
    "DocumentDate": 1721001600000,
    "DocType": "Research",
    "Branch": "London",
    "FileExtension": "pdf"
  },
  {
    "ProphecyId": "PROP016",
    "ParentProphecyId": "PROP015",
    "Text": "Data sets attachment for research.",
    "IsAttachment": "True",
    "DocumentDate": 1721088000000,
    "DocType": "Attachment",
    "Branch": "London",
    "FileExtension": "csv"
  },
  {
    "ProphecyId": "PROP017",
    "ParentProphecyId": "",
    "Text": "Executive summary document.",
    "IsAttachment": "False",
    "DocumentDate": 1721174400000,
    "DocType": "Summary",
    "Branch": "Tokyo",
    "FileExtension": "pdf"
  },
  {
    "ProphecyId": "PROP018",
    "ParentProphecyId": "PROP017",
    "Text": "Supporting notes attachment.",
    "IsAttachment": "True",
    "DocumentDate": 1721260800000,
    "DocType": "Attachment",
    "Branch": "Tokyo",
    "FileExtension": "txt"
  },
  {
    "ProphecyId": "PROP019",
    "ParentProphecyId": "",
    "Text": "Budget planning document.",
    "IsAttachment": "False",
    "DocumentDate": 1721347200000,
    "DocType": "Plan",
    "Branch": "New York",
    "FileExtension": "xlsx"
  },
  {
    "ProphecyId": "PROP020",
    "ParentProphecyId": "PROP019",
    "Text": "Budget spreadsheets attachment.",
    "IsAttachment": "True",
    "DocumentDate": 1721433600000,
    "DocType": "Attachment",
    "Branch": "New York",
    "FileExtension": "xlsx"
  }
]

# For brevity, here's how to wrap each dict from above into bulk action:
bulk_docs = [
  {
        "_index": INDEX_NAME,
        "_source": {
            "PropId": "abcd1",
            "ParentPropId": "xyz",
            "IsAttachment": "True",
            "SystemPath": r"C:\Users\Admin\Desktop\try\llm-applications-meta.jpg",
            "Branch": "telecom",
            "DocType": "analysis",
            "Text": "",
            "DocumentDate": 1751615191,
            "DocumentFrom": "Manager",
            "DocumentTo": "emp1",
            "Attachments": ""
        }
    },
    {
        "_index": INDEX_NAME,
        "_source": {
            "PropId": "xyz",
            "ParentPropId": "",
            "IsAttachment": "False",
            "SystemPath": r"C:\Users\Admin\Desktop\try\micro.pdf",
            "Branch": "telecom",
            "DocType": "analysis",
            "Text": (
                "Think of any society. People in the society need many goods and "
                "services in their everyday life including food, clothing, shelter, "
                "transport facilities like roads and railways, postal services and "
                "various other services like that of teachers and doctors."
            ),
            "DocumentDate": 1751615010,
            "DocumentFrom": "Manager",
            "DocumentTo": "emp1",
            "Attachments": r"C:\Users\Admin\Desktop\try\llm-applications-meta.jpg"
        }
    },
      {
        "_index": INDEX_NAME,
        "_source": {
            "PropId": "xyz2",
            "ParentPropId": "",
            "IsAttachment": "False",
            "SystemPath": r"C:\Users\Admin\Desktop\try\leec101.pdf",
            "Branch": "telecom",
            "DocType": "analysis",
            "Text": (
                " You must have already been introduced to a study of basic "
                "this is market society"
            ),
            "DocumentDate": 1751615000,
            "DocumentFrom": "Manager",
            "DocumentTo": "emp1",
            "Attachments": ""
        }
    },

    
]



# Bulk upload
response = helpers.bulk(es, bulk_docs)
print("Bulk ingestion response:", response)
