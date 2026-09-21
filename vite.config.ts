import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'sms-api-server',
        configureServer(server) {
          server.middlewares.use('/api/send-sms', async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { phone, message, type, otp } = JSON.parse(body || '{}');
                  const cleanPhone = (phone || '').replace(/[^\d]/g, '').slice(-10);

                  const fast2smsKey = env.VITE_FAST2SMS_API_KEY || process.env.VITE_FAST2SMS_API_KEY || '';
                  const msg91Key = env.VITE_MSG91_API_KEY || process.env.VITE_MSG91_API_KEY || '';
                  const twoFactorKey = env.VITE_2FACTOR_API_KEY || process.env.VITE_2FACTOR_API_KEY || '';

                  let liveDeliveryStatus = 'simulated';
                  let apiResponse = null;

                  // 1. Fast2SMS Integration (Instant Indian SMS Delivery)
                  if (fast2smsKey && fast2smsKey !== 'demo_fast2sms_key') {
                    try {
                      const fResp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                        method: 'POST',
                        headers: {
                          'authorization': fast2smsKey,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          route: 'q',
                          message: message,
                          language: 'english',
                          flash: 0,
                          numbers: cleanPhone,
                        }),
                      });
                      apiResponse = await fResp.json();
                      if (apiResponse && apiResponse.return) {
                        liveDeliveryStatus = 'fast2sms_delivered';
                        console.log(`[REAL SMS SENT TO ${cleanPhone} via Fast2SMS]:`, apiResponse);
                      }
                    } catch (err) {
                      console.error('[Fast2SMS Server Error]', err);
                    }
                  }

                  // 2. 2Factor.in Integration (Indian Telecom OTP Gateway)
                  if (liveDeliveryStatus === 'simulated' && twoFactorKey && twoFactorKey !== 'demo_2factor_key') {
                    try {
                      const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${cleanPhone}/${otp || '123456'}/OTP1`;
                      const tfResp = await fetch(url);
                      apiResponse = await tfResp.json();
                      if (apiResponse && apiResponse.Status === 'Success') {
                        liveDeliveryStatus = '2factor_delivered';
                        console.log(`[REAL SMS SENT TO ${cleanPhone} via 2Factor]:`, apiResponse);
                      }
                    } catch (err) {
                      console.error('[2Factor Server Error]', err);
                    }
                  }

                  // 3. MSG91 Integration
                  if (liveDeliveryStatus === 'simulated' && msg91Key && msg91Key !== 'demo_msg91_key') {
                    try {
                      const msgResp = await fetch('https://api.msg91.com/api/v5/flow/', {
                        method: 'POST',
                        headers: {
                          'authkey': msg91Key,
                          'content-type': 'application/json',
                        },
                        body: JSON.stringify({
                          mobiles: `91${cleanPhone}`,
                          message: message,
                          sender: env.VITE_SMS_SENDER_ID || 'KRIFLO',
                        }),
                      });
                      apiResponse = await msgResp.json();
                      liveDeliveryStatus = 'msg91_delivered';
                      console.log(`[REAL SMS SENT TO ${cleanPhone} via MSG91]:`, apiResponse);
                    } catch (err) {
                      console.error('[MSG91 Server Error]', err);
                    }
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    provider: liveDeliveryStatus,
                    phone: cleanPhone,
                    apiResponse,
                    message: liveDeliveryStatus !== 'simulated'
                      ? `Real SMS dispatched to +91 ${cleanPhone}`
                      : `SMS simulation dispatched to +91 ${cleanPhone}`,
                  }));
                } catch (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              });
            } else {
              res.statusCode = 405;
              res.end();
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
