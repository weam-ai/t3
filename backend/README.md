# Video/Image Upload API with Gemini AI Analysis & Meta Ads Policy Checking

A Node.js backend API built with Express.js that handles video and image file uploads with AI-powered analysis using Google's Gemini API and Meta Ads policy violation checking. Clean, minimal, and working implementation that automatically analyzes uploaded content and checks for policy violations.

## 🚀 Features

- **File Upload**: Upload video or image files via POST form data
- **AI Analysis**: Automatic analysis using Google Gemini AI
- **Meta Ads Policy Checking**: Automatic policy violation detection
- **Dual Support**: Supports both videos and images
- **Smart Summarization**: Extracts key points and provides detailed summaries
- **Policy Compliance**: Checks content against Meta Ads policies
- **File Validation**: Validates file types and sizes
- **Security**: Basic security with rate limiting, CORS, and security headers
- **Error Handling**: Comprehensive error handling and logging
- **Single File**: One file per request (no multiple file support)

## 📋 Prerequisites

- Node.js (version 16.0.0 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000` by default.

## 📚 API Endpoints

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Upload Video/Image
```http
POST /summarize
Content-Type: multipart/form-data

Parameters:
- file (file, required): Video or image file to upload
- title (string, optional): Title for the file
- description (string, optional): Description for the file
```

**Example using curl:**
```bash
# Upload a video
curl -X POST http://localhost:3000/summarize \
  -F "file=@/path/to/your/video.mp4" \
  -F "title=My Video" \
  -F "description=This is a test video"

# Upload an image
curl -X POST http://localhost:3000/summarize \
  -F "file=@/path/to/your/image.jpg" \
  -F "title=My Image"
```

**Response:**
```json
{
  "success": true,
  "message": "Video analyzed and policy-checked successfully",
  "fileInfo": {
    "originalName": "video.mp4",
    "filename": "file-1234567890-123456789.mp4",
    "fileSize": 1048576,
    "fileType": "video",
    "uploadDate": "2024-01-01T12:00:00.000Z"
  },
  "analysis": {
    "summary": "This video shows a comprehensive tutorial on web development...",
    "keyPoints": [
      "Introduction to modern web frameworks",
      "Step-by-step coding demonstration",
      "Best practices and tips shared"
    ],
    "fileMetadata": {
      "fileName": "file-1234567890-123456789.mp4",
      "fileSize": 1048576,
      "mimeType": "video/mp4",
      "mediaType": "video",
      "analyzedAt": "2024-01-01T12:00:05.000Z"
    }
  },
  "policyCheck": {
    "violated": false,
    "violations": [],
    "reasoning": "The content appears to be educational and does not violate any Meta Ads policies.",
    "checkedAt": "2024-01-01T12:00:10.000Z"
  },
  "timestamp": "2024-01-01T12:00:10.000Z"
}
```

#### 2. Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.456
}
```

#### 3. API Documentation
```http
GET /
```

**Response:**
```json
{
  "success": true,
  "message": "Video/Image Upload API",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "upload": "POST /summarize"
  },
  "supportedFormats": {
    "videos": ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"],
    "images": ["jpg", "jpeg", "png", "gif", "bmp", "webp"]
  },
  "maxFileSize": "100MB"
}
```

## 🔧 Configuration

### Supported File Formats

**Videos:**
- MP4, AVI, MOV, WMV, FLV, WebM, MKV

**Images:**
- JPG, JPEG, PNG, GIF, BMP, WebP

### File Size Limits

- Maximum file size: 100MB
- Maximum files per request: 1 (single file only)

## 🏗️ Project Structure

```
backend/
├── uploads/               # Uploaded files directory (auto-created)
├── package.json           # Dependencies and scripts
├── server.js              # Main server file (everything in one file)
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Cross-origin resource sharing enabled
- **Helmet**: Security headers protection
- **File Validation**: Type and size validation
- **Error Handling**: Secure error responses

## 🚨 Error Handling

The API provides simple error handling with consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Common Error Codes

- `NO_FILE_PROVIDED`: No file in request
- `FILE_TOO_LARGE`: File exceeds 100MB limit
- `INVALID_FILE_TYPE`: Unsupported file format
- `TOO_MANY_FILES`: Multiple files in request
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `ROUTE_NOT_FOUND`: Invalid endpoint

## 🧪 Testing

### Using curl

1. **Upload a video:**
   ```bash
   curl -X POST http://localhost:3000/summarize \
     -F "file=@test-video.mp4" \
     -F "title=Test Video"
   ```

2. **Upload an image:**
   ```bash
   curl -X POST http://localhost:3000/summarize \
     -F "file=@test-image.jpg" \
     -F "title=Test Image"
   ```

3. **Check API health:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Get API documentation:**
   ```bash
   curl http://localhost:3000/
   ```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set PORT environment variable
2. **File Storage**: Consider using cloud storage for production
3. **Process Management**: Use PM2 or similar for process management
4. **Reverse Proxy**: Use Nginx for load balancing
5. **SSL/TLS**: Enable HTTPS in production

### Environment Variables

```bash
PORT=3000  # Server port (optional, defaults to 3000)
GEMINI_API_KEY=your-gemini-api-key  # Google Gemini API key (optional, has default)
```

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/` endpoint
- Review the server logs for debugging
- Test with the health check endpoint

## 🔄 What's Different

This integrated version:
- ✅ **No MVC structure** - Everything in one `server.js` file
- ✅ **No video retrieval routes** - Only upload functionality
- ✅ **Supports both videos and images** - Single endpoint for both
- ✅ **Single file upload only** - No multiple file support
- ✅ **AI-powered analysis** - Automatic Gemini AI analysis
- ✅ **Smart summarization** - Extracts key points and summaries
- ✅ **Simple and working** - Minimal dependencies and complexity
- ✅ **Clean code** - Well-commented and easy to understand

## 🤖 AI Analysis Process

1. **Upload**: User uploads video or image file
2. **Save**: File is saved to `media/` folder
3. **Analyze**: Gemini AI analyzes the content
4. **Summarize**: AI extracts key points and creates summary
5. **Policy Check**: Meta Ads policy checker analyzes the summary for violations
6. **Return**: JSON response with analysis results and policy compliance status

## 🔍 Policy Check Features

The Meta Ads policy checker analyzes content against:
- **Prohibited Content**: Illegal products, deceptive practices, violence, adult content
- **Restricted Content**: Alcohol, gambling, political issues, financial products
- **Health & Safety**: Health misinformation, unapproved supplements, vaccine misinformation
- **Discrimination**: Hate speech, discriminatory practices
- **Intellectual Property**: Copyright violations, privacy issues

### Policy Check Response Format

```json
{
  "policyCheck": {
    "violated": true/false,
    "violations": [
      {
        "category": "Policy category name",
        "description": "Specific violation description", 
        "severity": "high/medium/low"
      }
    ],
    "reasoning": "Brief explanation of the analysis",
    "checkedAt": "2024-01-01T12:00:10.000Z"
  }
}
```