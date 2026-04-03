export const validateEnv = (): void => {
  const requiredVariables = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SENDGRID_API_KEY',
    'AWS_S3_BUCKET',
    'APP_URL',
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
