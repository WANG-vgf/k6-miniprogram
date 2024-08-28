/**
  scenarios：简述测试脚本运行的情况；说明有多少个测试案例、最大的虚拟用户数，最大的运行持续时间。
  data_received：接收到的数据量大小
  data_sent：发送的数据量大小
  http_req_blocked：在发起请求之前被阻塞的时间
  http_req_connecting：建立到远程主机的 TCP 连接所花费的时间
  http_req_duration：请求的总时间。它等于 http_req_sending + http_req_waiting + http_req_receiving重要指标
  http_req_failed：失败请求率
  http_req_receiving：从远程主机接收响应数据所花费的时间，而没有初始DNS查找/连接时间
  http_req_sending：将数据发送到远程主机所花费的时间
  http_req_tls_handshaking：与远程主机握手建立TLS会话所花费的时间
  http_req_waiting：等待远程主机响应所花费的时间
  http_reqs：总请求数量TPS
  iteration_duration：完成默认/主函数的一次完整迭代所花费的时间
  iterations：脚本中的函数被执行的次数
  vus：当前活动的虚拟用户数
  vus_max：虚拟用户的最大数量
  checks：checks 项的成功率
 */

import { Rate } from 'k6/metrics';
import { CHECK_FAILURE_RATE } from '../constants.js';
import {
  activeCustomer,
  getDistributor,
  getPurchaseQuantity,
  product,
  seriesProducts,
  userClickProduct,
} from '../http/productDetails.js';

const failureRate = new Rate(CHECK_FAILURE_RATE);

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
  product(failureRate);
  activeCustomer(failureRate);
  getDistributor(failureRate);
  seriesProducts(failureRate);
  userClickProduct(failureRate);
  getPurchaseQuantity(failureRate, '4581', 'regularOrder', false);
  getPurchaseQuantity(failureRate, '4581', 'shoppingTrolley', true);
}
