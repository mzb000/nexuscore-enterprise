import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm-up ramp
    { duration: '1m', target: 500 },   // Normal enterprise load
    { duration: '30s', target: 2000 },  // Black Friday extreme surge
    { duration: '1m', target: 2000 },  // Sustained peak load
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'], // 95% of requests under 300ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
  },
};

export default function () {
  const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8000';

  // 1. Fuzzy catalog search
  const searchRes = http.get(`${BASE_URL}/api/v1/products/search?q=laptop`);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search duration < 250ms': (r) => r.timings.duration < 250,
  });

  sleep(1);
}
