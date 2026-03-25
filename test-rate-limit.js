#!/usr/bin/env node
/**
 * Test script to verify rate limiting is working
 * Run with: node test-rate-limit.js
 */

const BASE_URL = 'http://localhost:3000';

async function testRateLimit() {
  console.log('🧪 Testing Rate Limiting...\n');

  // You'll need to replace these with actual values from your system
  const attemptId = 'YOUR_ATTEMPT_ID'; // Replace with a real attempt ID
  const authToken = 'YOUR_AUTH_TOKEN'; // Replace with a valid JWT token

  console.log('⚠️  Make sure to:');
  console.log('1. Update attemptId with a real attempt ID');
  console.log('2. Update authToken with a valid auth token');
  console.log('3. Start your dev server: npm run dev\n');

  if (attemptId === 'YOUR_ATTEMPT_ID' || authToken === 'YOUR_AUTH_TOKEN') {
    console.log('❌ Please update the attemptId and authToken in this script first!');
    return;
  }

  const endpoint = `${BASE_URL}/api/attempts/${attemptId}/writing/ai-score`;

  console.log(`📡 Sending 12 requests to: ${endpoint}\n`);

  for (let i = 1; i <= 12; i++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${authToken}`,
        },
        body: JSON.stringify({ force: false }),
      });

      const data = await response.json();
      
      if (response.status === 429) {
        console.log(`❌ Request ${i}: RATE LIMITED (429)`);
        console.log(`   Remaining: ${response.headers.get('X-RateLimit-Remaining')}`);
        console.log(`   Reset in: ${data.resetIn} seconds`);
        console.log(`   Message: ${data.error}\n`);
      } else if (response.ok) {
        console.log(`✅ Request ${i}: SUCCESS (${response.status})`);
        console.log(`   Remaining: ${response.headers.get('X-RateLimit-Remaining')}\n`);
      } else {
        console.log(`⚠️  Request ${i}: ERROR (${response.status})`);
        console.log(`   Message: ${data.error}\n`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`❌ Request ${i}: FAILED - ${error.message}\n`);
    }
  }

  console.log('✅ Rate limit test complete!');
  console.log('Expected: First 10 requests should succeed, 11th and 12th should be rate limited (429)');
}

// Run the test
testRateLimit().catch(console.error);
