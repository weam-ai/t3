/**
 * Meta Ads Policy Checker Module
 * 
 * This module compares content summaries against Meta's advertising policies
 * using Google's Gemini Pro AI model to detect policy violations.
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

class MetaAdsPolicyChecker {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Google AI API key is required');
        }
        
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        this.policyContent = null;
    }

    /**
     * Load Meta Ads policy content from file
     * @param {string} policyFilePath - Path to the policy file
     * @returns {Promise<void>}
     */
    async loadPolicyFile(policyFilePath = './meta-ads-policy.txt') {
        try {
            const fullPath = path.resolve(policyFilePath);
            this.policyContent = await fs.readFile(fullPath, 'utf8');
            
            if (!this.policyContent.trim()) {
                throw new Error('Policy file is empty or invalid');
            }
        } catch (error) {
            throw new Error(`Failed to load policy file: ${error.message}`);
        }
    }

    /**
     * Validate input summary
     * @param {string} summary - Content summary to check
     * @returns {boolean}
     */
    validateInput(summary) {
        if (!summary || typeof summary !== 'string') {
            throw new Error('Summary must be a non-empty string');
        }
        
        if (summary.trim().length === 0) {
            throw new Error('Summary cannot be empty');
        }
        
        if (summary.length > 10000) {
            throw new Error('Summary is too long (max 10,000 characters)');
        }
        
        return true;
    }

    /**
     * Create the prompt for Gemini Pro
     * @param {string} summary - Content summary to analyze
     * @returns {string}
     */
    createPrompt(summary) {
        return `
You are a Meta Ads policy compliance expert. Analyze the following content summary against Meta's advertising policies and determine if any policies are violated.

META ADS POLICY RULES:
${this.policyContent}

CONTENT SUMMARY TO ANALYZE:
"${summary}"

INSTRUCTIONS:
1. Carefully review the content summary against each policy category
2. Identify any specific policy violations
3. Return your analysis in the following JSON format:
{
  "violated": true/false,
  "violations": [
    {
      "category": "Policy category name",
      "description": "Specific violation description",
      "severity": "high/medium/low"
    }
  ],
  "reasoning": "Brief explanation of the analysis"
}

IMPORTANT:
- Be thorough but fair in your analysis
- Only flag actual policy violations
- Provide specific policy categories that are violated
- If no violations are found, set "violated" to false and "violations" to an empty array
- Ensure the response is valid JSON format only
`;
    }

    /**
     * Check content summary against Meta Ads policies
     * @param {string} summary - Content summary to analyze
     * @param {string} policyFilePath - Optional custom policy file path
     * @returns {Promise<Object>} Analysis result with violations
     */
    async checkPolicy(summary, policyFilePath = null) {
        try {
            // Validate input
            this.validateInput(summary);
            
            // Load policy file if not already loaded or if custom path provided
            if (!this.policyContent || policyFilePath) {
                await this.loadPolicyFile(policyFilePath);
            }
            
            // Create prompt for Gemini Pro
            const prompt = this.createPrompt(summary);
            
            // Generate content using Gemini Pro
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Parse JSON response
            let analysisResult;
            try {
                // Clean the response text to extract JSON
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('No valid JSON found in response');
                }
                
                analysisResult = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
            }
            
            // Validate response structure
            this.validateResponse(analysisResult);
            
            return {
                success: true,
                data: analysisResult,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Validate the AI response structure
     * @param {Object} response - AI response to validate
     * @throws {Error} If response structure is invalid
     */
    validateResponse(response) {
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid response format');
        }
        
        if (typeof response.violated !== 'boolean') {
            throw new Error('Response must include "violated" boolean field');
        }
        
        if (!Array.isArray(response.violations)) {
            throw new Error('Response must include "violations" array field');
        }
        
        // Validate violation objects if any exist
        response.violations.forEach((violation, index) => {
            if (!violation.category || !violation.description) {
                throw new Error(`Violation at index ${index} missing required fields`);
            }
            
            if (!['high', 'medium', 'low'].includes(violation.severity)) {
                throw new Error(`Invalid severity level in violation at index ${index}`);
            }
        });
    }

    /**
     * Get policy content (for debugging/inspection)
     * @returns {string|null}
     */
    getPolicyContent() {
        return this.policyContent;
    }
}

/**
 * Convenience function to create and use the policy checker
 * @param {string} apiKey - Google AI API key
 * @param {string} summary - Content summary to check
 * @param {string} policyFilePath - Optional custom policy file path
 * @returns {Promise<Object>} Analysis result
 */
async function checkMetaAdsPolicy(apiKey, summary, policyFilePath = null) {
    const checker = new MetaAdsPolicyChecker(apiKey);
    return await checker.checkPolicy(summary, policyFilePath);
}

module.exports = {
    MetaAdsPolicyChecker,
    checkMetaAdsPolicy
};
