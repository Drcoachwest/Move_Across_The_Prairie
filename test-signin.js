const fetch = require('node-fetch');

async function testSignin() {
  console.log('Testing signin flow for Coach Davis...');

  try {
    // Step 1: Sign in
    console.log('\n1. Signing in with coach.davis@gpisd.org...');
    const signinResponse = await fetch('http://localhost:3000/api/auth/teacher-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'coach.davis@gpisd.org',
        password: 'password2',
      }),
    });

    const signinData = await signinResponse.json();
    console.log('Signin response status:', signinResponse.status);
    console.log('Signin response:', JSON.stringify(signinData, null, 2));

    if (signinResponse.ok) {
      console.log('✅ Sign in successful');
      console.log('   - needsSetup:', signinData.needsSetup);
      console.log('   - teacher.schoolLevel:', signinData.teacher?.schoolLevel);

      // Get cookies from response
      const setCookieHeader = signinResponse.headers.get('set-cookie');
      console.log('\nSet-Cookie headers:');
      if (setCookieHeader) {
        console.log('   ' + setCookieHeader);
      } else {
        console.log('   (no set-cookie headers found)');
      }

      // Note: In a browser, cookies would be automatically stored
      // But we need to manually extract them here
      const cookieHeader = signinResponse.headers.get('set-cookie') || '';
      console.log('\nCookies set:', cookieHeader);
    } else {
      console.log('❌ Sign in failed');
      return;
    }
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testSignin();
