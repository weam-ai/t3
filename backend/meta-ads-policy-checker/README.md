# Meta Ads Policy Checker

A Node.js module that automatically compares content summaries against Meta's advertising policies using Google's Gemini Pro AI model. This tool helps ensure your content complies with Meta's advertising guidelines before submission.

## Features

- ✅ **AI-Powered Analysis**: Uses Google's Gemini Pro for intelligent policy violation detection
- ✅ **Comprehensive Coverage**: Checks against all Meta Ads policy categories
- ✅ **Detailed Results**: Returns specific violations with severity levels
- ✅ **Easy Integration**: Simple API for existing applications
- ✅ **Error Handling**: Robust validation and error management
- ✅ **Security**: Input validation and safe API usage

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get Google AI API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Keep it secure and never commit it to version control

3. **Set up environment variables:**
   ```bash
   # Create .env file
   echo "GOOGLE_AI_API_KEY=your_api_key_here" > .env
   ```

## Quick Start

### Basic Usage

```javascript
const { MetaAdsPolicyChecker } = require('./meta-ads-policy-checker');

// Initialize with your API key
const checker = new MetaAdsPolicyChecker('your-google-ai-api-key');

// Check content against policies
const result = await checker.checkPolicy('Your content summary here');

console.log(result);
```

### Using the Convenience Function

```javascript
const { checkMetaAdsPolicy } = require('./meta-ads-policy-checker');

const result = await checkMetaAdsPolicy(
    'your-google-ai-api-key',
    'Your content summary here'
);

console.log(result);
```

## API Reference

### MetaAdsPolicyChecker Class

#### Constructor
```javascript
new MetaAdsPolicyChecker(apiKey)
```
- `apiKey` (string, required): Your Google AI API key

#### Methods

##### `checkPolicy(summary, policyFilePath?)`
Analyzes content against Meta Ads policies.

**Parameters:**
- `summary` (string, required): Content summary to analyze
- `policyFilePath` (string, optional): Custom path to policy file

**Returns:** Promise resolving to analysis result object

**Example:**
```javascript
const result = await checker.checkPolicy('Promote our new weight loss supplement with guaranteed results!');
```

##### `loadPolicyFile(policyFilePath?)`
Loads policy content from file.

**Parameters:**
- `policyFilePath` (string, optional): Path to policy file (default: './meta-ads-policy.txt')

##### `getPolicyContent()`
Returns the loaded policy content for inspection.

## Response Format

### Success Response
```javascript
{
  "success": true,
  "data": {
    "violated": true,
    "violations": [
      {
        "category": "Health Misinformation",
        "description": "Claims about guaranteed weight loss results without scientific backing",
        "severity": "high"
      },
      {
        "category": "Unacceptable Supplements",
        "description": "Promoting unapproved or misleading supplement claims",
        "severity": "medium"
      }
    ],
    "reasoning": "The content contains health claims that violate Meta's policies on health misinformation and supplement advertising."
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```javascript
{
  "success": false,
  "error": "Summary must be a non-empty string",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Policy Categories Checked

The module checks content against these Meta Ads policy categories:

### Prohibited Content
- Illegal Products and Services
- Deceptive Practices
- Violence and Dangerous Organizations
- Adult Content
- Weapons, Ammunition, Explosives
- Human Exploitation
- Unacceptable Supplements
- Vaccine Discouragement and Misinformation
- Discriminatory Practices and Hate Speech
- Profanity, Bullying, and Harassment

### Restricted Content
- Alcohol
- Gambling and Betting
- Political and Social Issues
- Cryptocurrency, Financial, and Insurance Products
- Dating Services
- Online Pharmacies and Health Products
- Commercial Exploitation of Crises
- Tobacco, Vaping, Cessation Products
- Endangered Species or Body Parts

### Additional Checks
- Intellectual Property Violations
- Privacy and Data Issues

## Examples

### Example 1: Compliant Content
```javascript
const summary = "Our eco-friendly cleaning products are made from natural ingredients and help reduce environmental impact.";

const result = await checker.checkPolicy(summary);
// Result: { violated: false, violations: [] }
```

### Example 2: Policy Violations
```javascript
const summary = "Get rich quick with our investment scheme! Guaranteed 500% returns in 30 days! No risk involved!";

const result = await checker.checkPolicy(summary);
// Result: Contains violations for deceptive practices and financial misinformation
```

### Example 3: Health Product Claims
```javascript
const summary = "Our miracle supplement cures diabetes and cancer! FDA approved and doctor recommended!";

const result = await checker.checkPolicy(summary);
// Result: Contains violations for health misinformation and unapproved supplements
```

## Integration Examples

### Express.js Integration
```javascript
const express = require('express');
const { MetaAdsPolicyChecker } = require('./meta-ads-policy-checker');

const app = express();
const checker = new MetaAdsPolicyChecker(process.env.GOOGLE_AI_API_KEY);

app.post('/check-policy', async (req, res) => {
  try {
    const { summary } = req.body;
    const result = await checker.checkPolicy(summary);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Batch Processing
```javascript
async function checkMultipleSummaries(summaries) {
  const results = [];
  
  for (const summary of summaries) {
    const result = await checker.checkPolicy(summary);
    results.push({ summary, result });
    
    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
```

## Error Handling

The module includes comprehensive error handling:

- **Input Validation**: Ensures summary is a valid non-empty string
- **API Errors**: Handles Google AI API failures gracefully
- **File System Errors**: Manages policy file loading issues
- **JSON Parsing**: Validates AI response format

## Security Considerations

- **API Key Protection**: Never expose your Google AI API key in client-side code
- **Input Sanitization**: All inputs are validated before processing
- **Rate Limiting**: Consider implementing rate limiting for production use
- **Error Messages**: Avoid exposing sensitive information in error responses

## Rate Limits and Costs

- **Google AI API**: Check current rate limits and pricing at [Google AI Pricing](https://ai.google.dev/pricing)
- **Recommendations**: 
  - Implement caching for repeated checks
  - Add delays between requests for batch processing
  - Monitor API usage and costs

## Troubleshooting

### Common Issues

1. **"Google AI API key is required"**
   - Ensure you've provided a valid API key
   - Check that the key has proper permissions

2. **"Failed to load policy file"**
   - Verify `meta-ads-policy.txt` exists in the project directory
   - Check file permissions

3. **"No valid JSON found in response"**
   - The AI response format may have changed
   - Check your API key and model access

4. **Rate limit exceeded**
   - Implement delays between requests
   - Consider upgrading your API plan

### Debug Mode
```javascript
// Enable detailed logging
const checker = new MetaAdsPolicyChecker(apiKey);
console.log('Policy content loaded:', checker.getPolicyContent());
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review Meta's official advertising policies

## Changelog

### Version 1.0.0
- Initial release
- Gemini Pro integration
- Comprehensive policy checking
- Error handling and validation
- Documentation and examples
