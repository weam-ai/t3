# Meta Ads Policy Dynamic Checker

A Node.js module that dynamically fetches Meta's advertising policies from their official transparency page and checks content compliance using Anthropic Claude 3.7 Sonnet AI model.

## Features

- **Dynamic Policy Fetching**: Automatically retrieves the latest Meta Ads policies from the official Meta transparency page
- **AI-Powered Analysis**: Uses Anthropic Claude 3.7 Sonnet for intelligent policy extraction and compliance checking
- **Real-time Compliance**: Checks ad content against the most current Meta advertising standards
- **Structured Results**: Returns detailed compliance reports with specific policy violations
- **Caching**: Implements intelligent caching to avoid repeated API calls for the same policies

## Installation

```bash
npm install
```

## Setup

1. Get your Anthropic API key from [Anthropic Console](https://console.anthropic.com/)
2. Set the environment variable:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

## Usage

### Basic Usage

```javascript
const { checkMetaAdsCompliance } = require('./meta-ads-policy-dynamic-checker');

async function checkAd() {
  const result = await checkMetaAdsCompliance(
    "Buy our amazing organic coffee with free shipping!",
    process.env.ANTHROPIC_API_KEY
  );
  
  console.log('Compliant:', result.compliant);
  console.log('Violations:', result.violatedPolicies);
}
```

### Advanced Usage

```javascript
const { MetaAdsPolicyChecker } = require('./meta-ads-policy-dynamic-checker');

const checker = new MetaAdsPolicyChecker(process.env.ANTHROPIC_API_KEY);

// Check compliance
const result = await checker.checkAdCompliance("Your ad content here");

// Get cached policies
const policies = await checker.getPolicies();
```

### Command Line Usage

```bash
# Run with default example
node meta-ads-policy-dynamic-checker.js

# Run with custom ad summary
node meta-ads-policy-dynamic-checker.js "Your ad summary here"
```

## API Reference

### `MetaAdsPolicyChecker`

Main class for checking Meta Ads policy compliance.

#### Constructor
- `new MetaAdsPolicyChecker(anthropicApiKey)` - Creates a new checker instance

#### Methods
- `checkAdCompliance(adSummary)` - Checks ad content against Meta policies
- `getPolicies()` - Returns cached or fetches Meta policies
- `fetchMetaPolicies()` - Fetches policies from Meta's official page
- `extractPoliciesWithClaude(content)` - Extracts structured policies using Claude
- `checkCompliance(adSummary)` - Internal compliance checking method

### Response Format

```javascript
{
  "compliant": boolean,
  "violatedPolicies": [
    {
      "category": "Policy Category",
      "name": "Specific Policy Name", 
      "reason": "Explanation of violation"
    }
  ],
  "details": {
    "description": "Overall assessment",
    "riskLevel": "low|medium|high",
    "recommendations": "Suggestions for compliance"
  }
}
```

## Examples

### Compliant Ad
```javascript
const result = await checkMetaAdsCompliance(
  "Professional web development services for businesses",
  apiKey
);
// Result: { compliant: true, violatedPolicies: [], ... }
```

### Non-Compliant Ad
```javascript
const result = await checkMetaAdsCompliance(
  "Revolutionary weight loss pill - lose 50 pounds in 30 days!",
  apiKey
);
// Result: { compliant: false, violatedPolicies: [...], ... }
```

## Error Handling

The module includes comprehensive error handling:
- Network errors when fetching policies
- API errors from Anthropic
- JSON parsing errors
- Invalid input validation

## Dependencies

- `@anthropic-ai/sdk` - Anthropic Claude API client
- `axios` - HTTP client for fetching policies
- `cheerio` - HTML parsing and text extraction
- `dotenv` - Environment variable management

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please open an issue on the GitHub repository.
