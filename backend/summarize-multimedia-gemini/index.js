/**
 * Summarize MultiMedia Module using Google Gemini API
 * 
 * This module provides video and image analysis and summarization capabilities
 * using Google's Gemini AI model. It processes video and image files and returns
 * structured JSON responses based on custom prompts.
 * 
 * @author Nisheet Patel & Vibe Coder
 * @version 1.1.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs-extra';
import path from 'path';
import mime from 'mime-types';
import Joi from 'joi';

/**
 * Summarize MultiMedia Class
 * Handles video and image processing and analysis using Gemini API
 */
class SummarizeMultiMedia {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Google Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Supported video formats
    this.supportedVideoFormats = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv'
    ];
    
    // Supported image formats
    this.supportedImageFormats = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/svg+xml'
    ];
    
    // All supported formats
    this.supportedFormats = [...this.supportedVideoFormats, ...this.supportedImageFormats];
    
    // Maximum file size (100MB)
    this.maxFileSize = 100 * 1024 * 1024;
  }

  /**
   * Validates input parameters
   * @param {string} filePath - Path to the video or image file
   * @param {string} prompt - Analysis prompt
   * @returns {Object} Validation result
   */
  validateInput(filePath, prompt) {
    const schema = Joi.object({
      filePath: Joi.string().required().min(1),
      prompt: Joi.string().required().min(1).max(1000)
    });

    return schema.validate({ filePath, prompt });
  }

  /**
   * Validates multimedia file (video or image)
   * @param {string} filePath - Path to the video or image file
   * @returns {Object} Validation result
   */
  async validateMultimediaFile(filePath) {
    try {
      // Check if file exists
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Check file stats
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      // Check file size
      if (stats.size > this.maxFileSize) {
        throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
      }

      // Check file extension and MIME type
      const mimeType = mime.lookup(filePath);
      if (!mimeType || !this.supportedFormats.includes(mimeType)) {
        throw new Error(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
      }

      // Determine if it's a video or image
      const isVideo = this.supportedVideoFormats.includes(mimeType);
      const isImage = this.supportedImageFormats.includes(mimeType);
      const mediaType = isVideo ? 'video' : isImage ? 'image' : 'unknown';

      return { valid: true, mimeType, size: stats.size, mediaType };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Converts multimedia file to base64 for API transmission
   * @param {string} filePath - Path to the video or image file
   * @returns {string} Base64 encoded multimedia data
   */
  async fileToBase64(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return fileBuffer.toString('base64');
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Analyzes multimedia content (video or image) using Gemini API
   * @param {string} filePath - Path to the video or image file
   * @param {string} prompt - Analysis prompt
   * @returns {Object} Analysis result in JSON format
   */
  async analyzeMultimedia(filePath, prompt) {
    try {
      // Validate inputs
      const inputValidation = this.validateInput(filePath, prompt);
      if (inputValidation.error) {
        throw new Error(`Input validation failed: ${inputValidation.error.details[0].message}`);
      }

      // Validate multimedia file
      const fileValidation = await this.validateMultimediaFile(filePath);
      if (!fileValidation.valid) {
        throw new Error(`File validation failed: ${fileValidation.error}`);
      }

      // Convert file to base64
      const base64Data = await this.fileToBase64(filePath);
      const mimeType = fileValidation.mimeType;
      const mediaType = fileValidation.mediaType;

      // Prepare the prompt for Gemini
      const mediaTypeText = mediaType === 'video' ? 'video' : 'image';
      const enhancedPrompt = `
        Please analyze the following ${mediaTypeText} and provide a comprehensive response based on this prompt: "${prompt}"
        
        IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:
        {
          "summary": "Your detailed analysis here",
          "keyPoints": ["point1", "point2", "point3"]
        }
        
        Do not include any text before or after the JSON. Do not use markdown formatting. Return only the JSON object.
      `;

      // Generate content using Gemini
      const result = await this.model.generateContent([
        enhancedPrompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Debug: Log the raw response (remove this in production)
      // console.log('🔍 Raw Gemini response:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));

      // Try to parse the JSON response
      let analysisResult;
      try {
        // First try to parse the response directly
        analysisResult = JSON.parse(text);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the response
        try {
          // Look for JSON object in the response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (secondParseError) {
          // If all parsing fails, use the raw text as summary
          analysisResult = {
            summary: text.trim(),
            keyPoints: ["Raw analysis response provided"],
            note: "Response was not in expected JSON format, using raw text"
          };
        }
      }

      // Add file metadata
      analysisResult.fileMetadata = {
        fileName: path.basename(filePath),
        fileSize: fileValidation.size,
        mimeType: mimeType,
        mediaType: mediaType,
        analyzedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: analysisResult,
        error: null
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          message: error.message,
          timestamp: new Date().toISOString(),
          type: error.constructor.name
        }
      };
    }
  }
}

// Export the class
export { SummarizeMultiMedia };

// Default export
export default SummarizeMultiMedia;
