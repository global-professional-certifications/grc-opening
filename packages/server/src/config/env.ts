export const validateEnv = (): void => {
  const requiredVariables = [
    'DATABASE_URL',
    'JWT_SECRET',
    'APP_URL',
    // Resend — required for OTP email delivery
    'RESEND_API_KEY',
  ];

  const missingVariables = requiredVariables.filter((varName) => !process.env[varName]);

  if (missingVariables.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing required environment variables on startup:');
    missingVariables.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    
    console.error('\nPlease check your .env file and ensure all variables match .env.example.');
    console.error('If you are testing locally, you can use mock dummy strings for 3rd party keys.');
    
    // Fast-crash
    process.exit(1);
  }
};
