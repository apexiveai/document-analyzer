# Multi-Region Audit Engine

The Multi-Region Audit Engine is an advanced document analysis system that provides specialized compliance checking for international business documents.

## Features

### 🏪 Logistics Module
- **Commercial Invoice Analysis**: Validates documents against Canadian Border Services Agency (CBSA) and Global HS Code standards
- **HS Code Detection**: Automatically identifies and validates Harmonized System codes
- **Compliance Scoring**: Provides detailed compliance scores and recommendations

### ⚖️ Legal Module
- **Service Agreement Review**: Scans contracts for high-risk clauses based on North American and UK legal standards
- **Risk Assessment**: Evaluates Indemnity, Liability, and Termination clauses
- **Standards Compliance**: Checks alignment with regional legal requirements

## How to Use

### 1. Upload Mode Selection
When uploading documents, choose between:
- **Document Analysis**: Standard document processing and summarization
- **Multi-Region Audit**: Specialized compliance checking

### 2. Document Type Selection
For audit mode, specify the document type:
- **Commercial Invoice**: For logistics and customs compliance
- **Service Agreement**: For legal risk assessment

### 3. Review Results
Audit results include:
- **Compliance Status**: Compliant, Non-compliant, or Requires Review
- **Compliance Score**: 0-100 rating
- **Detailed Issues**: Specific problems identified
- **Recommendations**: Actionable improvement suggestions

## Technical Implementation

### Services
- `services/audit.ts`: Core audit logic using AI for specialized analysis
- `services/ai.ts`: AI integration for document processing
- `services/parser.ts`: Text extraction from various file formats

### API Endpoints
- `POST /api/upload`: Standard document processing
- `POST /api/audit`: Specialized audit analysis

### Database Schema
Audit results are stored in the `documents` table with:
- `audit_result`: JSON object containing full audit analysis
- `document_type`: Type of document audited
- `compliance_status`: Generated compliance status

### Components
- `AuditResults.tsx`: Comprehensive audit results display
- `FileUploader.tsx`: Enhanced with audit mode selection

## Compliance Standards

### Logistics (CBSA & Global HS Codes)
- Validates HS code format and structure
- Checks against current CBSA regulations
- Compares with World Customs Organization standards

### Legal (North American & UK Standards)
- **Indemnity Clauses**: Assesses liability transfer risks
- **Liability Clauses**: Reviews limitation of liability provisions
- **Termination Clauses**: Evaluates termination conditions
- **Standards Alignment**: Ensures compliance with regional legal frameworks

## Scoring Methodology

Compliance scores are calculated based on:
- **Logistics**: HS code validity (30%), global compliance (20%), issue severity (varies)
- **Legal**: High-risk clause presence (25% each for Indemnity/Liability/Termination), standards compliance (15% each for North American/UK)

## Supported File Types
- PDF documents
- Microsoft Word (.docx, .doc)
- Plain text files
- CSV files

## Security & Privacy
- All document processing occurs server-side
- Audit results are stored securely in user-specific database records
- AI analysis uses enterprise-grade language models
- No document content is shared externally