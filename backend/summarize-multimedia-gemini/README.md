# Summarize MultiMedia Module with Gemini API

A Node.js module for video and image analysis using Google's Gemini AI. Analyze multimedia content and extract insights through natural language prompts.

## 🚀 Features

- **Video & Image Analysis**: Analyze both videos and images
- **Custom Prompts**: Use any analysis prompt you need
- **JSON Output**: Structured responses for easy integration
- **Multiple Formats**: Supports MP4, AVI, MOV, JPEG, PNG, GIF, WebP, and more

## 🛠️ Installation

```bash
npm install
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 📖 Usage

```javascript
import { SummarizeMultiMedia } from './index.js';

const analyzer = new SummarizeMultiMedia('your-gemini-api-key');

// Analyze video
const result = await analyzer.analyzeMultimedia(
  './video.mp4',
  'Summarize the main content of this video'
);

// Analyze image
const result = await analyzer.analyzeMultimedia(
  './image.jpg',
  'Describe what you see in this image'
);

console.log(result.data.summary);
```

### Express.js Integration

```javascript
import express from 'express';
import { SummarizeMultiMedia } from './index.js';

const app = express();
const analyzer = new SummarizeMultiMedia(process.env.GEMINI_API_KEY);

app.post('/analyze', async (req, res) => {
  const { filePath, prompt } = req.body;
  const result = await analyzer.analyzeMultimedia(filePath, prompt);
  res.json(result);
});
```

## 📊 Response Format

```json
{
  "success": true,
  "data": {
    "summary": "Analysis summary",
    "keyPoints": ["point1", "point2", "point3"],
    "fileMetadata": {
      "fileName": "video.mp4",
      "mediaType": "video",
      "analyzedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 📝 Example Prompts

```javascript
// Video summarization
"Summarize the main content of this video in 3-5 bullet points"

// Image description
"Describe what you see in this image in detail"

// Meta Ads policy analysis
"Analyze this content for potential Meta Ads policy violations"

// Object detection
"Identify all objects, people, and activities visible in this content"
```

## 🧪 Testing

```bash
npm test
```

## 📁 Supported Formats

**Videos**: MP4, AVI, MOV, WMV, FLV, WebM, MKV  
**Images**: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG

---

**Author**: Nisheet Patel & Vibe Coder  
**License**: MIT
