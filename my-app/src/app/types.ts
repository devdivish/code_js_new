export interface Document{
  AadhaarNumbers?: string;
  AllDates?: string;
  Attachments?: string;
  Author?: string;
  Branch?: string;
  BranchName?: string;
  CaseId?: string;
  CaseName?: string;
  Classification?: string;
  ConnectionType?: string;
  CreationDate?: number;
  DataSource?: string;
  DataType?: string;
  Date?: number;
  DlNumbers?: string;
  DocType?: string;
  DocumentDate?: number;
  DocumentType?: string;
  Domains?: string;
  EmailBcc?: string;
  EmailCc?: string;
  EmailFrom?: string;
  EmailIds?: string;
  EmailTo?: string;
  FRSCategoryId?: string;
  FaceRecognised?: number;
  FileExtension?: string;
  FileName?: string;
  FileNumber?: string;
  FileSize?: number;
  From?: string;
  From_Date?: number;
  Hash?: string;
  HomeCircle?: string;
  Imei?: string;
  Imsi?: string;
  IngestionDate?: number;
  IpAddresses?: string;
  IsAttachment?: boolean;
  IsCorrupted?: string;
  IsImageProcessingStatus?: string;
  IsProtected?: boolean;
  KeywordSentiment?: string;
  Keywords?: string;
  LastSeenDate?: number;
  Latitude?: number;
  Locations?: string;
  Longitude?: number;
  MessageFile?: string;
  ModifiedDate?: number;
  NDP?: string;
  NLP?: string;
  NationalIds?: string;
  Operation?: string;
  OrgNumber?: string;
  OrganizationName?: string;
  Organizations?: string;
  OriginalName?: string;
  OriginalPath?: string;
  PanNumbers?: string;
  ParentOriginalName?: string;
  ParentOriginalPath?: string;
  ParentPropId?: string;
  ParentSystemName?: string;
  ParentSystemPath?: string;
  PassportNumbers?: string;
  Persons?: string;
  PhoneNumbers?: string;
  ProcessingStatus?: number;
  PropId?: string;
  Remarks?: string;
  ReportNumber?: string;
  ReportType?: string;
  ServiceStartDate?: number;
  StationName?: string;
  Status?: string;
  SubCategory?: string;
  Subject?: string;
  Summary?: string;
  SystemName?: string;
  SystemPath?: string;
  TO?: string;
  TargetPartyNumber?: string;
  TempLocation?: string;
  Text?: string;
  To?: string;
  To_Date?: number;
  TransliteratedText?: string;
  VehicleNumbers?: string;
  coordinates?: string;
  from?: string;
  text?: string;
  to?: string;
  [key: string]: any; // Allow other unknown properties
}



interface SearchAggregations {
  doctype_counts?: { [key: string]: number };
  branchtype_counts?: { [key: string]: number };
  extensiontype_counts?: { [key: string]: number };
  // Add other aggregations here if needed
}


export interface BackendResponse {
  documents: Document[];
  next_search_after?: any[] | null;
  aggregations?: SearchAggregations; // *** NEW *** Added aggregations field
  total?: number;
}
