# Environment Setup

## Local Apps

- Web app: `http://localhost:3000`
- API worker: `http://localhost:8787`

## Required Services

- Cloudflare account for Pages, Workers, D1, and R2
- Google OAuth credentials
- Midtrans sandbox credentials
- Resend API key

## Local Development Notes

- Keep secrets in `.env` or `.dev.vars`.
- Do not commit production credentials.
- Use Midtrans sandbox while the escrow behavior is still being validated.
- Use manual KYC review for the MVP unless a third-party verification provider is selected later.
