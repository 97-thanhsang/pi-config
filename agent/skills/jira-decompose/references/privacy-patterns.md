---
name: privacy-patterns-v4
description: Sensitive data regex patterns for privacy risk detection in Process 4 (match-visuals) and Process 6 (download-assets). Used to detect PII before blur/placeholder processing.
type: reference
version: 4.0.0
---

# Privacy Patterns — jira-decompose-v4

Regex patterns for detecting sensitive data in screenshots. Used by `processes/4-match-visuals.md` (privacy scoring) and `processes/6-download-assets.md` (blur decision).

---

## Pattern Set

Each entry: `{ name, regex, risk, description }`

```javascript
const PRIVACY_PATTERNS = [
  // --- HIGH RISK ---

  // National ID / CMND
  {
    name: "cmnd_citizen_id",
    regex: /\b\d{9,12}\b/,
    risk: "HIGH",
    description: "Vietnamese CMND (9 digits) or CCCD (12 digits)"
  },

  // Phone numbers (Vietnamese mobile)
  {
    name: "phone_vietnam",
    regex: /\b(0[3|5|7|8|9]\d{8}|(\+84)[3|5|7|8|9]\d{8})\b/,
    risk: "HIGH",
    description: "Vietnamese phone numbers (+84 or 0-prefix, 10-11 digits)"
  },

  // Email addresses
  {
    name: "email",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    risk: "HIGH",
    description: "Email address"
  },

  // Password / secret tokens
  {
    name: "password_secret",
    regex: /\b(password|passwd|pwd|secret|token|api_key|apikey|authorization)\s*[:=]\s*\S+/i,
    risk: "HIGH",
    description: "Password or secret credentials in text"
  },

  // Bank account numbers
  {
    name: "bank_account",
    regex: /\b\d{8,20}\b/,
    risk: "HIGH",
    description: "Potential bank account number (8-20 digits)"
  },

  // Credit card numbers
  {
    name: "credit_card",
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    risk: "HIGH",
    description: "Credit card number (16 digits, with or without separator)"
  },

  // --- MEDIUM RISK ---

  // Vietnamese full name patterns (3+ words, capitalized)
  {
    name: "vietnamese_full_name",
    regex: /\b[A-ZÀÁẢẠẦẤẨẬẮẪỊỌỔỚỜỞỢỦỨỪ][a-zàáảạầấậắẫịọổớờởợủứừ]+(\s+[A-ZÀÁẢẠẦẤẨẬẮẪỊỌỔỚỜỞỢỦỨỪ][a-zàáảạầấậắẫịọổớờởợủứừ]+){2,}\b/,
    risk: "MEDIUM",
    description: "Vietnamese full name (3+ capitalized words)"
  },

  // Physical address (heuristic)
  {
    name: "address",
    regex: /\b\d+\s+[A-Za-zÀÁẢẠẦẤẨẬẮẪỊỌỔỚỜỞỢỦỨỪàáảạầấậắẫịọổớờởợủứừ]+\s+(street|đường|phố|quận|huyện|phường|thành phố|tỉnh)\b/gi,
    risk: "MEDIUM",
    description: "Vietnamese address pattern"
  },

  // Date of birth
  {
    name: "date_of_birth",
    regex: /\b(dob|date\s*of\s*birth|ngày\s*sinh|birthday|birth)\s*[:=]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi,
    risk: "MEDIUM",
    description: "Date of birth reference"
  },

  // Salary / financial data
  {
    name: "salary",
    regex: /\b(salary|lương|thu nhập|salary\s*range)\s*[:=]?\s*[\d,.]+\s*(vnđ|VND|đ|million|billion)?/gi,
    risk: "MEDIUM",
    description: "Salary or financial information"
  },

  // Tax code / mã số thuế (Vietnamese 10 or 13 digit business/personal tax ID)
  {
    name: "tax_code",
    regex: /\b(mã\s*số\s*thuế|ma\s*so\s*thue|mst|tax\s*code|tax\s*id)\s*[:=]?\s*\d{10}(-\d{3})?\b/gi,
    risk: "MEDIUM",
    description: "Vietnamese tax code (mã số thuế) — 10 or 13 digits"
  },

  // --- LOW RISK (informational only) ---

  // Username / account name
  {
    name: "username",
    regex: /\b(username|user\s*name|tài\s*khoản|tk|account)\s*[:=]?\s*\w{3,}/gi,
    risk: "LOW",
    description: "Username or account identifier"
  },

  // IP address (internal)
  {
    name: "ip_address",
    regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
    risk: "LOW",
    description: "IP address (could be internal/ external)"
  },
];
```

---

## Usage in Process 4 (match-visuals)

```javascript
function detectSensitiveContent(textContent) {
  const text = textContent.join(' ');
  const hits = PRIVACY_PATTERNS.filter(p => p.regex.test(text));
  return {
    privacyRisk: hits.length === 0 ? 'LOW'
                : hits.length <= 1 ? 'MEDIUM'
                : 'HIGH',
    detectedPatterns: hits.map(h => h.name)
  };
}
```

---

## Usage in Process 6 (download-assets)

When `privacySetting == "AUTO_BLUR"`:
```javascript
const analysis = look_at({
  file_path: `.opencode/visual-assets/${parentKey}/raw/${img.filename}`,
  goal: "Detect sensitive: phone, email, ID numbers, names, tokens. Return text content."
});
const sensitive = detectSensitivePatterns(analysis);
if (sensitive.detected) {
  // Attempt blur or generate placeholder
}
```

---

## Privacy Risk Thresholds

| Risk Level | Hit Count        | Action in Gate 4                          |
| ----------- | ---------------- | ----------------------------------------- |
| LOW         | 0 hits           | No blur needed                            |
| MEDIUM      | 1-2 hits         | Offer AUTO_BLUR or PLACEHOLDER options   |
| HIGH        | 3+ hits          | Recommend AUTO_BLUR, show warning         |

---

## Cross-References

- `processes/4-match-visuals.md` S5 — privacy detection during image matching
- `processes/6-download-assets.md` S5 — blur decision and processing
- `config.md` S6 — `visual.matchHighConfidence` threshold
