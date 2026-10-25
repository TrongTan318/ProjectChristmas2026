// Load test: mô phỏng người xem triển lãm + kết quả.
//   k6 run -e BASE_URL=https://ten-mien tests/load/browse.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 1000 },
        { duration: '3m', target: 5000 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const home = http.get(`${BASE}/`);
  check(home, { 'home 200': (r) => r.status === 200 });
  sleep(2 + Math.random() * 3);

  const exhibit = http.get(`${BASE}/trien-lam`);
  check(exhibit, { 'exhibition 200': (r) => r.status === 200 });
  const slugs = [...exhibit.body.matchAll(/href="\/trien-lam\/([a-z0-9-]+)"/g)].map((m) => m[1]);
  if (slugs.length) {
    const slug = slugs[Math.floor(Math.random() * slugs.length)];
    check(http.get(`${BASE}/trien-lam/${slug}`), { 'product 200': (r) => r.status === 200 });
  }
  sleep(3 + Math.random() * 5);

  http.get(`${BASE}/api/results`);
  sleep(5);
}
