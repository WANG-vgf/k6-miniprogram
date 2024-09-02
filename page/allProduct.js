import { Rate } from 'k6/metrics';

import {
  customPage,
  getAnnouncement,
  getDistributor,
  hotWords,
  seriesProducts,
} from '../http/allProduct.js';

const failureRate = new Rate('check_failure_rate');

export const options = {
  stages: [
    // Linearly ramp up from 1 to 50 VUs during first minute
    { target: 100, duration: '5s' },
    // Hold at 50 VUs for the next 3 minutes and 30 seconds
    { target: 100, duration: '10s' },
    // Linearly ramp down from 50 to 0 50 VUs over the last 30 seconds
    // { target: 0, duration: "30s" }
    // Total execution time will be ~5 minutes
  ],
  thresholds: {
    // We want the 95th percentile of all HTTP request durations to be less than 500ms
    http_req_duration: ['p(95)<500'],
    // Requests with the staticAsset tag should finish even faster
    'http_req_duration{staticAsset:yes}': ['p(99)<250'],
    // Thresholds based on the custom metric we defined and use to track application failures
    check_failure_rate: [
      // Global failure rate should be less than 1%
      'rate<0.01',
      // Abort the test early if it climbs over 5%
      { threshold: 'rate<=0.05', abortOnFail: true },
    ],
  },
};

export default function () {
  customPage(failureRate);
  getAnnouncement(failureRate);
  hotWords(failureRate);
  seriesProducts(failureRate);
  getDistributor(failureRate);
}
