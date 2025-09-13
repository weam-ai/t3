/**
 * Simple Video/Image Upload API with Gemini AI Analysis
 * Handles file uploads for videos and images with AI-powered summarization
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const SummarizeMultiMedia = require('./lib/SummarizeMultiMedia');
const { MetaAdsPolicyChecker } = require('./meta-ads-policy-checker/meta-ads-policy-checker');

// Configuration
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = 'media'; // Changed to 'media' as per requirements
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-gemini-api-key'; // Default key from test file

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.ensureDir(UPLOAD_DIR);
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};

// File filter for videos and images
const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
  const allAllowedTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES];

  if (allAllowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allAllowedTypes.join(', ')}`), false);
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = `file-${uniqueSuffix}${fileExtension}`;
    cb(null, filename);
  }
});

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only one file at a time
  }
});

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 100MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed per request.',
        error: 'TOO_MANY_FILES'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  next(error);
};

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error occurred:', error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    error: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Video/Image Upload API with Gemini AI Analysis & Meta Ads Policy Checking',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      upload: 'POST /summarize'
    },
    supportedFormats: {
      videos: ALLOWED_VIDEO_TYPES,
      images: ALLOWED_IMAGE_TYPES
    },
    maxFileSize: '100MB',
    features: [
      'File upload with validation',
      'AI-powered analysis using Google Gemini',
      'Automatic summarization for videos and images',
      'Key points extraction',
      'Meta Ads policy violation checking',
      'Comprehensive error handling'
    ],
    process: [
      '1. Upload file to /summarize endpoint',
      '2. File is saved to media folder',
      '3. Gemini AI analyzes the content',
      '4. Meta Ads policy checker analyzes the summary',
      '5. Returns analysis with summary, key points, and policy violations'
    ]
  });
});

// Main upload endpoint with Gemini AI analysis
app.post('/summarize', upload.single('file'), handleUploadError, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please upload a video or image file.',
        error: 'NO_FILE_PROVIDED'
      });
    }

    // Determine file type
    const fileExtension = path.extname(req.file.originalname).toLowerCase().slice(1);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(fileExtension);
    const isImage = ALLOWED_IMAGE_TYPES.includes(fileExtension);
    const fileType = isVideo ? 'video' : isImage ? 'image' : 'unknown';

    // Extract file information
    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileType: fileType,
      uploadDate: new Date(),
      title: req.body.title || '',
      description: req.body.description || ''
    };

    // Log successful upload
    console.log(`File uploaded successfully: ${fileInfo.originalName} (${fileInfo.fileSize} bytes, ${fileType})`);

    // Step 2: Use Gemini AI to analyze the uploaded file
    console.log('🤖 Starting Gemini AI analysis...');

    try {
      // Initialize Gemini analyzer
      const analyzer = new SummarizeMultiMedia(GEMINI_API_KEY);

      // Create analysis prompt based on file type
      const analysisPrompt = "Analyze the provided video or image for potential Meta Ads policy violations and deliver a single-paragraph, 250-word descriptive summary. Detail the main visual content, actions, themes, and any visible text, symbols, logos, audio, and any other content. Clearly highlight any elements likely violating Meta Ads policies, such as prohibited products, misleading claims, violence, nudity, sensitive content, or controversial subjects. Assess the nature and likelihood of any potential violation based on Meta Ads guidelines, keeping the summary factual, objective, and focused on ad intention.";
      // Perform AI analysis
      const analysisResult = await analyzer.analyzeMultimedia(fileInfo.filePath, analysisPrompt);

      if (!analysisResult.success) {
        throw new Error(`Gemini analysis failed: ${analysisResult.error.message}`);
      }

      console.log('✅ Gemini AI analysis completed successfully');

      // Step 3: Use Meta Ads Policy Checker to analyze the summary
      console.log('🔍 Starting Meta Ads policy analysis...');

      try {
        // Initialize policy checker
        const policyChecker = new MetaAdsPolicyChecker(GEMINI_API_KEY);

        // Load policy file from the meta-ads-policy-checker directory
        const policyFilePath = path.join(__dirname, 'meta-ads-policy-checker', 'meta-ads-policy.txt');
        await policyChecker.loadPolicyFile(policyFilePath);

        // Check the summary against Meta Ads policies
        const policyResult = await policyChecker.checkPolicy(analysisResult.data.summary);

        if (!policyResult.success) {
          throw new Error(`Policy analysis failed: ${policyResult.error}`);
        }

        console.log('✅ Meta Ads policy analysis completed successfully');

        // Step 4: Prepare final response with both analysis and policy check
        const responseData = {
          message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} analyzed and policy-checked successfully`,
          fileInfo: {
            originalName: fileInfo.originalName,
            filename: fileInfo.filename,
            fileSize: fileInfo.fileSize,
            fileType: fileInfo.fileType,
            uploadDate: fileInfo.uploadDate
          },
          analysis: {
            summary: analysisResult.data.summary,
            keyPoints: analysisResult.data.keyPoints,
            fileMetadata: analysisResult.data.fileMetadata
          },
          policyCheck: {
            violated: policyResult.data.violated,
            violations: policyResult.data.violations,
            reasoning: policyResult.data.reasoning,
            checkedAt: policyResult.timestamp
          }
        };

        // Return success response with analysis and policy check
        res.status(201).json({
          success: true,
          ...responseData,
          timestamp: new Date().toISOString()
        });

      } catch (policyError) {
        console.error('❌ Meta Ads policy analysis error:', policyError.message);

        // Return response with analysis but policy check failed
        const responseData = {
          message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} analyzed successfully, but policy check failed`,
          fileInfo: {
            originalName: fileInfo.originalName,
            filename: fileInfo.filename,
            fileSize: fileInfo.fileSize,
            fileType: fileInfo.fileType,
            uploadDate: fileInfo.uploadDate
          },
          analysis: {
            summary: analysisResult.data.summary,
            keyPoints: analysisResult.data.keyPoints,
            fileMetadata: analysisResult.data.fileMetadata
          },
          policyCheck: {
            error: 'Policy analysis failed',
            details: policyError.message
          }
        };

        res.status(201).json({
          success: true,
          ...responseData,
          timestamp: new Date().toISOString()
        });
      }

    } catch (analysisError) {
      console.error('❌ Gemini analysis error:', analysisError.message);

      // Return error response but keep the file uploaded
      res.status(500).json({
        success: false,
        message: 'File uploaded successfully but analysis failed',
        error: 'ANALYSIS_FAILED',
        details: analysisError.message,
        fileInfo: {
          originalName: fileInfo.originalName,
          filename: fileInfo.filename,
          fileSize: fileInfo.fileSize,
          fileType: fileInfo.fileType,
          uploadDate: fileInfo.uploadDate
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
        console.log(`Cleaned up file after error: ${req.file.path}`);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    throw error;
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    await ensureUploadDir();
    console.log(`Upload directory ensured: ${UPLOAD_DIR}`);

    app.listen(PORT, () => {
      console.log(`
🚀 Server is running with Gemini AI & Meta Ads Policy Integration!
📍 Port: ${PORT}
📁 Upload Directory: ${UPLOAD_DIR}
🤖 Gemini AI: ${GEMINI_API_KEY ? 'Configured' : 'Not configured - using default key'}
🔍 Meta Ads Policy Checker: Integrated
🔗 API Documentation: http://localhost:${PORT}/
📋 Health Check: http://localhost:${PORT}/health
📤 Upload, Analyze & Policy Check: http://localhost:${PORT}/summarize
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;