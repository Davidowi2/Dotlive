/**
 * Environment Variable Validation
 * Run on server startup to verify required env vars are set
 */

type EnvVarStatus = 'set' | 'missing' | 'optional';

interface EnvVarDef {
  key: string;
  required: boolean;
  description: string;
}

const envVars: EnvVarDef[] = [
  // Supabase (server-side)
  { key: 'SUPABASE_URL', required: true, description: 'Supabase project URL' },
  { key: 'SUPABASE_PUBLISHABLE_KEY', required: true, description: 'Supabase publishable key (for JWT verification)' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', required: true, description: 'Supabase service role key (admin access)' },

  // Google OAuth
  { key: 'GOOGLE_CLIENT_ID', required: true, description: 'Google OAuth client ID' },
  { key: 'GOOGLE_CLIENT_SECRET', required: true, description: 'Google OAuth client secret' },
  { key: 'GOOGLE_REDIRECT_URI', required: false, description: 'Google OAuth callback URL (optional, has default)' },

  // Paystack
  { key: 'PAYSTACK_SECRET_KEY', required: false, description: 'Paystack secret key for payments' },
  { key: 'PAYSTACK_PUBLIC_KEY', required: false, description: 'Paystack public key for frontend' },

  // Feature flags
  { key: 'WITHDRAWALS_ENABLED', required: false, description: 'Enable withdrawal functionality (default: false)' },

  // URLs
  { key: 'PUBLIC_SITE_URL', required: false, description: 'Public frontend URL for callbacks' },
  { key: 'FRONTEND_URL', required: false, description: 'Frontend URL (for redirects, defaults to https://dotlive.cv)' },

  // Optional integrations
  { key: 'WHOP_API_KEY', required: false, description: 'Whop API key for course management' },
  { key: 'WHOP_WEBHOOK_SECRET', required: false, description: 'Whop webhook secret' },
  { key: 'CLOUDINARY_CLOUD_NAME', required: false, description: 'Cloudinary cloud name for media uploads' },
  { key: 'CLOUDINARY_API_KEY', required: false, description: 'Cloudinary API key' },
  { key: 'RESEND_API_KEY', required: false, description: 'Resend API key for transactional emails' },

  // Database
  { key: 'TEST_DATABASE_URL', required: false, description: 'Test database connection string' },

  // Server config
  { key: 'NODE_ENV', required: false, description: 'Node environment (development/production)' },
  { key: 'PORT', required: false, description: 'Server port (default: 3001)' },
];

/**
 * Check all environment variables and return their status
 */
export function checkEnv(): void {
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│              Environment Variable Check                    │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  let hasErrors = false;

  for (const def of envVars) {
    const value = process.env[def.key];
    const isSet = value !== undefined && value !== '';

    if (def.required && !isSet) {
      console.log(`❌ ${def.key} [REQUIRED] - ${def.description}`);
      hasErrors = true;
    } else if (isSet) {
      // Show value for non-secret vars, masked for secrets
      const isSecret = def.key.includes('SECRET') || def.key.includes('KEY') || def.key.includes('PASSWORD');
      const displayValue = isSecret ? '********' : value;
      console.log(`✅ ${def.key}: ${displayValue}`);
    } else {
      console.log(`⚪ ${def.key} [OPTIONAL] - ${def.description}`);
    }
  }

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  if (hasErrors) {
    console.log('│  ❌ FAILED: Missing required environment variables         │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    throw new Error('Missing required environment variables. Check the output above.');
  } else {
    console.log('│  ✅ All required environment variables are set             │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
  }
}

// Auto-run check when imported (can be disabled via SKIP_ENV_CHECK)
if (process.env.SKIP_ENV_CHECK !== 'true') {
  checkEnv();
}