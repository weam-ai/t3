// Load environment variables from .env file
require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Meta Ads Policy Compliance Checker
 * Uses Anthropic Claude 3.7 Sonnet to extract Meta Ads policies and check compliance
 */
class MetaAdsPolicyChecker {
  constructor(anthropicApiKey) {
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });
    this.metaPoliciesUrl = 'https://transparency.meta.com/policies/ad-standards/';
    this.cachedPolicies = null;
  }

  /**
   * Fetch Meta Ads policies from the official page
   * @returns {Promise<string>} Raw HTML content
   */
  async fetchMetaPolicies() {
    try {
      console.log('Fetching Meta Ads policies...');
      const response = await axios.get(this.metaPoliciesUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept redirects
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Meta policies: ${error.message}`);
    }
  }

  /**
   * Extract and clean text content from HTML
   * @param {string} html - Raw HTML content
   * @returns {string} Clean text content
   */
  extractTextFromHtml(html) {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, nav, header, footer').remove();
    
    // Extract main content
    const mainContent = $('main, .content, article, body').first();
    const text = mainContent.length > 0 ? mainContent.text() : $('body').text();
    
    // Clean up whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Use Claude to extract structured policies from the content
   * @param {string} content - Raw content from Meta's page
   * @returns {Promise<Array>} Structured policies array
   */
  async extractPoliciesWithClaude(content) {
    try {
      console.log('Extracting policies using Claude 3.7 Sonnet...');
      
      const prompt = `You are an expert at analyzing Meta (Facebook) advertising policies. Please carefully read through the following content from Meta's Ad Standards page and extract ALL the specific advertising policies and rules.

For each policy, provide:
1. Policy Category (e.g., "Prohibited Content", "Restricted Content", "Community Standards", etc.)
2. Policy Name/Title
3. Brief Description of what is prohibited or restricted
4. Key details or examples if provided

Format your response as a JSON array where each policy is an object with these fields:
- category: string
- name: string  
- description: string
- details: string (optional)

Content to analyze:
${content}

Please be thorough and extract all policies mentioned, including but not limited to:
- Prohibited content types
- Restricted content requirements
- Community standards violations
- Discriminatory practices
- Misleading/fraudulent content
- Adult content restrictions
- Violence and safety policies
- Any other advertising restrictions

Return only the JSON array, no additional text.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].text;
      
      // Clean the response text by removing control characters and extra whitespace
      const cleanedText = responseText
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/\\n/g, '\n') // Fix escaped newlines
        .replace(/\\t/g, '\t') // Fix escaped tabs
        .replace(/\\r/g, '\r') // Fix escaped carriage returns
        .trim();
      
      try {
        return JSON.parse(cleanedText);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = cleanedText.match(/\[.*\]/s);
        if (jsonMatch) {
          const jsonString = jsonMatch[0]
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove any remaining control characters
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r');
          return JSON.parse(jsonString);
        }
        
        // Log the problematic response for debugging
        console.error('Failed to parse JSON response:', cleanedText.substring(0, 500));
        throw new Error(`Failed to parse policies JSON from Claude response: ${parseError.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to extract policies with Claude: ${error.message}`);
    }
  }

  /**
   * Get or fetch Meta policies (with caching)
   * @returns {Promise<Array>} Array of policy objects
   */
  async getPolicies() {
    if (this.cachedPolicies) {
      return this.cachedPolicies;
    }

    const htmlContent = await this.fetchMetaPolicies();
    const textContent = this.extractTextFromHtml(htmlContent);
    this.cachedPolicies = await this.extractPoliciesWithClaude(textContent);
    
    return this.cachedPolicies;
  }

  /**
   * Check ad summary compliance against Meta policies using Claude
   * @param {string} adSummary - Description of the ad content
   * @returns {Promise<Object>} Compliance check result
   */
  async checkCompliance(adSummary) {
    try {
      if (!adSummary || typeof adSummary !== 'string') {
        throw new Error('Ad summary must be a non-empty string');
      }

      console.log('Checking compliance for ad summary...');
      
      const policies = await this.getPolicies();
      
      const prompt = `You are an expert Meta (Facebook) advertising policy compliance checker. I will provide you with:
1. A comprehensive list of Meta's advertising policies
2. An ad summary describing content intended for Meta ads

Your task is to carefully analyze the ad summary against ALL the provided policies and determine if there are any violations.

META ADVERTISING POLICIES:
${JSON.stringify(policies, null, 2)}

AD SUMMARY TO CHECK:
"${adSummary}"

Please analyze this ad summary against all the policies above and provide your assessment in the following JSON format:

{
  "compliant": boolean,
  "violatedPolicies": [
    {
      "category": "Policy Category",
      "name": "Specific Policy Name",
      "reason": "Explanation of how the ad violates this policy"
    }
  ],
  "details": {
    "description": "Overall assessment and reasoning",
    "riskLevel": "low|medium|high",
    "recommendations": "Suggestions for making the ad compliant (if applicable)"
  }
}

Be thorough in your analysis. If the ad is compliant, set "compliant" to true and "violatedPolicies" to an empty array. If there are violations, be specific about which policies are violated and why.

Return only the JSON response, no additional text.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].text;
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = responseText.match(/\{.*\}/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Failed to parse compliance result JSON from Claude response');
      }
    } catch (error) {
      throw new Error(`Failed to check compliance: ${error.message}`);
    }
  }

  /**
   * Main function to check Meta Ads policy compliance
   * @param {string} adSummary - Description of the ad content
   * @returns {Promise<Object>} Compliance check result
   */
  async checkAdCompliance(adSummary) {
    try {
      const result = await this.checkCompliance(adSummary);
      
      // Ensure the response has the required structure
      return {
        compliant: result.compliant || false,
        violatedPolicies: result.violatedPolicies || [],
        details: result.details || {}
      };
    } catch (error) {
      return {
        compliant: false,
        violatedPolicies: [],
        details: {
          error: error.message,
          description: 'An error occurred while checking compliance'
        }
      };
    }
  }
}

/**
 * Factory function to create a Meta Ads Policy Checker instance
 * @param {string} anthropicApiKey - Anthropic API key
 * @returns {MetaAdsPolicyChecker} Checker instance
 */
function createMetaAdsPolicyChecker(anthropicApiKey) {
  return new MetaAdsPolicyChecker(anthropicApiKey);
}

/**
 * Convenience function for one-time compliance checks
 * @param {string} adSummary - Description of the ad content
 * @param {string} anthropicApiKey - Anthropic API key
 * @returns {Promise<Object>} Compliance check result
 */
async function checkMetaAdsCompliance(adSummary, anthropicApiKey) {
  const checker = createMetaAdsPolicyChecker(anthropicApiKey);
  return await checker.checkAdCompliance(adSummary);
}

module.exports = {
  MetaAdsPolicyChecker,
  createMetaAdsPolicyChecker,
  checkMetaAdsCompliance
};

// Example usage if run directly
if (require.main === module) {
  async function main() {
    // Get ad summary from command line arguments or use default
    const args = process.argv.slice(2);
    let adSummary;
    
    if (args.length > 0) {
      adSummary = args.join(' ');
    } else {
      console.log('🔍 Meta Ads Policy Compliance Checker');
      console.log('=' .repeat(50));
      console.log('\n📋 Usage: node index.js "Your ad summary here"');
      console.log('\n📝 Examples:');
      console.log('  node index.js "Buy our amazing organic coffee with free shipping!"');
      console.log('  node index.js "Revolutionary weight loss supplement - lose 30 pounds fast!"');
      console.log('  node index.js "Professional web development services for businesses"');
      console.log('\n⚙️ Setup:');
      console.log('  1. Get your Anthropic API key from: https://console.anthropic.com/');
      console.log('  2. Set environment variable: export ANTHROPIC_API_KEY="your-key"');
      console.log('\n🧪 For testing: node test.js');
      console.log('📚 For examples: node example.js');
      console.log('\nUsing default example for demonstration...');
      adSummary = "Revolutionary weight loss pill that guarantees you'll lose 50 pounds in 30 days with no diet or exercise required! Doctors hate this one simple trick!";
    }
    
    // You need to set your Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.log('\n⚠️ ANTHROPIC_API_KEY environment variable not set.');
      console.log('\n📋 To use the compliance checker:');
      console.log('1. Get your API key from: https://console.anthropic.com/');
      console.log('2. Set the environment variable:');
      console.log('   export ANTHROPIC_API_KEY="your-api-key-here"');
      console.log('3. Run again with your ad summary:');
      console.log(`   node index.js "${adSummary}"`);
      console.log('\n✅ The function is ready to use once you set up your API key!');
      return;
    }
    
    try {
      console.log('\n🔍 Meta Ads Policy Compliance Checker');
      console.log('=' .repeat(50));
      console.log('Ad Summary:', `"${adSummary}"`);
      console.log('\n⏳ Checking compliance...');
      
      const result = await checkMetaAdsCompliance(adSummary, apiKey);
      
      console.log('\n✅ Compliance Check Result:');
      console.log('=' .repeat(50));
      console.log(`Compliant: ${result.compliant ? '✅ YES' : '❌ NO'}`);
      
      if (result.violatedPolicies && result.violatedPolicies.length > 0) {
        console.log('\n🚫 Violated Policies:');
        result.violatedPolicies.forEach((policy, index) => {
          console.log(`  ${index + 1}. ${policy.category}: ${policy.name}`);
          if (policy.reason) {
            console.log(`     Reason: ${policy.reason}`);
          }
        });
      }
      
      if (result.details) {
        console.log('\n📝 Details:');
        if (result.details.description) {
          console.log(`  Description: ${result.details.description}`);
        }
        if (result.details.riskLevel) {
          console.log(`  Risk Level: ${result.details.riskLevel.toUpperCase()}`);
        }
        if (result.details.recommendations) {
          console.log(`  Recommendations: ${result.details.recommendations}`);
        }
        if (result.details.error) {
          console.log(`  ⚠️ Error: ${result.details.error}`);
        }
      }
      
      console.log('\n' + '='.repeat(50));
      console.log('\n💡 Tip: You can test different ad summaries by passing them as arguments:');
      console.log('node index.js "Your custom ad summary here"');
      
    } catch (error) {
      console.error('\n❌ Error:', error.message);
    }
  }

  main();
}
