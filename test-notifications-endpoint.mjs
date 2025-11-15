import { execSync } from 'child_process';

async function testNotificationsEndpoint() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('Testing notifications endpoint...\n');
  
  try {
    // First, create a test user and login
    console.log('1. Creating test user...');
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test_notifications_${Date.now()}@example.com`,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '555-1234567',
        role: 'driver'
      })
    });
    
    const registerData = await registerRes.json();
    
    if (!registerRes.ok) {
      console.log('Registration failed:', registerData);
      return;
    }
    
    const userId = registerData.user.id;
    console.log('✓ User created:', userId);
    
    // Login to get session
    console.log('\n2. Logging in...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: registerData.user.email,
        password: 'TestPass123!'
      })
    });
    
    const loginData = await loginRes.json();
    const setCookie = loginRes.headers.get('set-cookie');
    
    if (!loginRes.ok) {
      console.log('Login failed:', loginData);
      return;
    }
    
    console.log('✓ Logged in successfully');
    
    // Create a test notification directly in the database
    console.log('\n3. Creating test notification...');
    const notificationQuery = `
      INSERT INTO notifications (user_id, type, title, message, priority, expires_at, created_at)
      VALUES ('${userId}', 'system', 'Test Notification', 'This is a test notification', 'medium', NOW() + INTERVAL '7 days', NOW())
      RETURNING id;
    `;
    
    execSync(`psql "$DATABASE_URL" -c "${notificationQuery}" 2>&1`);
    console.log('✓ Test notification created');
    
    // Test the notifications endpoint
    console.log('\n4. Testing GET /api/notifications...');
    const notificationsRes = await fetch(`${baseUrl}/api/notifications`, {
      method: 'GET',
      headers: {
        'Cookie': setCookie || ''
      }
    });
    
    console.log('Response Status:', notificationsRes.status);
    console.log('Response Status Text:', notificationsRes.statusText);
    
    if (notificationsRes.ok) {
      const data = await notificationsRes.json();
      console.log('✓ Success! Notifications retrieved:');
      console.log('  Total notifications:', data.total);
      console.log('  Notifications array length:', data.notifications.length);
      
      if (data.notifications.length > 0) {
        const firstNotification = data.notifications[0];
        console.log('\n  First notification:');
        console.log('    - ID:', firstNotification.id);
        console.log('    - Title:', firstNotification.title);
        console.log('    - Message:', firstNotification.message);
        console.log('    - Type:', firstNotification.type);
        console.log('    - Priority:', firstNotification.priority);
        console.log('    - Is Read:', firstNotification.isRead);
        console.log('    - Created At:', firstNotification.createdAt);
        console.log('    - Expires At:', firstNotification.expiresAt || 'Not set');
      }
      
      console.log('\n✅ Notifications endpoint is working correctly!');
      console.log('✅ The expires_at column issue has been fixed!');
    } else {
      const errorText = await notificationsRes.text();
      console.log('❌ Error:', errorText);
    }
    
    // Test notification count endpoint
    console.log('\n5. Testing GET /api/notifications/count...');
    const countRes = await fetch(`${baseUrl}/api/notifications/count`, {
      method: 'GET',
      headers: {
        'Cookie': setCookie || ''
      }
    });
    
    if (countRes.ok) {
      const countData = await countRes.json();
      console.log('✓ Notification count:', countData.count);
    } else {
      console.log('❌ Count endpoint failed:', await countRes.text());
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testNotificationsEndpoint().catch(console.error);