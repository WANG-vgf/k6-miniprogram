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
import { postQuery } from '../utils.js';

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

const getMatomoSiteId = () => {
  const query = `
    query getMatomoSiteId {\n  getMatomoSiteId\n}
  `;
  postQuery('getMatomoSiteId', query, {}, { failureRate });
};

const maxDiscountMembershipPlan = () => {
  const query = `
    query maxDiscountMembershipPlan {\n  maxDiscountMembershipPlan {\n    ...MembershipPlan\n  }\n}\n\nfragment MembershipPlan on MembershipPlan {\n  id\n  createdAt\n  updatedAt\n  name\n  bannerImg\n  backgroundImage\n  protocolUsage\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  price\n  introduce\n  customerServiceNumber\n  state\n  rightsDiscount {\n    enable\n    discountRate\n    restrictedUse\n  }\n  rightsPoints {\n    enable\n    pointsMultiple\n  }\n  rightsCoupon {\n    enable\n    presentedCoupon {\n      couponId\n      presentedCount\n    }\n  }\n  membershipPlanCoupon {\n    coupon {\n      ...Coupon\n    }\n    quantity\n  }\n}\n\nfragment Coupon on Coupon {\n  __typename\n  id\n  createdAt\n  state\n  enable\n  updatedAt\n  name\n  remarks\n  type\n  preferentialContent {\n    preferentialType\n    minimum\n    discount\n    maximumOffer\n    includingDiscountProducts\n  }\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  totalQuantity\n  applicableProduct {\n    applicableType\n    productIds\n  }\n  claimRestriction\n  whetherRestrictUsers\n  memberPlanIds\n  introduce\n  promotion {\n    id\n  }\n  activityContent\n  activityTime\n}
  `;

  postQuery('maxDiscountMembershipPlan', query, {}, { failureRate });
};

const reportedDistributorRecord = () => {
  const query = `
    mutation reportedDistributorRecord($md5Str: String, $sourceCode: String, $distributionId: String) {\n  reportedDistributorRecord(\n    md5Str: $md5Str\n    sourceCode: $sourceCode\n    distributionId: $distributionId\n  )\n}
  `;

  postQuery(
    'reportedDistributorRecord',
    query,
    {
      md5Str: '',
      sourceCode: '1001',
      distributionId: '',
    },
    { failureRate }
  );
};

const activeCustomer = () => {
  const query = `
    query activeCustomer {\n  activeCustomer {\n    ...Customer\n  }\n}\n\nfragment Customer on Customer {\n  id\n  createdAt\n  updatedAt\n  title\n  firstName\n  lastName\n  phoneNumber\n  emailAddress\n  addresses {\n    ...Address\n  }\n  user {\n    id\n    createdAt\n    updatedAt\n    identifier\n    verified\n    lastLogin\n    customFields\n  }\n  customFields {\n    distributor {\n      id\n      name\n      phone\n    }\n    headPortrait\n    gender\n    dateBirth\n    wechatCode\n    isModified\n    points\n  }\n}\n\nfragment Address on Address {\n  id\n  createdAt\n  updatedAt\n  fullName\n  company\n  streetLine1\n  streetLine2\n  city\n  province\n  postalCode\n  country {\n    id\n    code\n    name\n  }\n  phoneNumber\n  defaultShippingAddress\n  defaultBillingAddress\n  customFields {\n    district\n  }\n}
  `;

  postQuery('activeCustomer', query, {}, { failureRate });
};

const getDistributor = () => {
  const query = `
    query getDistributor {\n  getDistributor {\n    id\n    createdAt\n    updatedAt\n    name\n    phone\n    customer {\n      ...Customer\n    }\n    orderTotal\n    customerCount\n    effectiveCustomerNum\n  }\n}\n\nfragment Customer on Customer {\n  id\n  createdAt\n  updatedAt\n  title\n  firstName\n  lastName\n  phoneNumber\n  emailAddress\n  addresses {\n    ...Address\n  }\n  user {\n    id\n    createdAt\n    updatedAt\n    identifier\n    verified\n    lastLogin\n    customFields\n  }\n  customFields {\n    distributor {\n      id\n      name\n      phone\n    }\n    headPortrait\n    gender\n    dateBirth\n    wechatCode\n    isModified\n    points\n  }\n}\n\nfragment Address on Address {\n  id\n  createdAt\n  updatedAt\n  fullName\n  company\n  streetLine1\n  streetLine2\n  city\n  province\n  postalCode\n  country {\n    id\n    code\n    name\n  }\n  phoneNumber\n  defaultShippingAddress\n  defaultBillingAddress\n  customFields {\n    district\n  }\n}
  `;

  postQuery('getDistributor', query, {}, { failureRate });
};

const getUserMember = () => {
  const query = `
    query getUserMember {\n  getUserMember {\n    ...Member\n  }\n}\n\nfragment Member on Member {\n  id\n  createdAt\n  updatedAt\n  code\n  claimAt\n  activationAt\n  maturityAt\n  maturityType\n  membershipPlan {\n    ...MembershipPlan\n  }\n  state\n}\n\nfragment MembershipPlan on MembershipPlan {\n  id\n  createdAt\n  updatedAt\n  name\n  bannerImg\n  backgroundImage\n  protocolUsage\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  price\n  introduce\n  customerServiceNumber\n  state\n  rightsDiscount {\n    enable\n    discountRate\n    restrictedUse\n  }\n  rightsPoints {\n    enable\n    pointsMultiple\n  }\n  rightsCoupon {\n    enable\n    presentedCoupon {\n      couponId\n      presentedCount\n    }\n  }\n  membershipPlanCoupon {\n    coupon {\n      ...Coupon\n    }\n    quantity\n  }\n}\n\nfragment Coupon on Coupon {\n  __typename\n  id\n  createdAt\n  state\n  enable\n  updatedAt\n  name\n  remarks\n  type\n  preferentialContent {\n    preferentialType\n    minimum\n    discount\n    maximumOffer\n    includingDiscountProducts\n  }\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  totalQuantity\n  applicableProduct {\n    applicableType\n    productIds\n  }\n  claimRestriction\n  whetherRestrictUsers\n  memberPlanIds\n  introduce\n  promotion {\n    id\n  }\n  activityContent\n  activityTime\n}
  `;

  postQuery('getUserMember', query, {}, { failureRate });
};

const settings = () => {
  const query = `
    query settings($keyNames: [SettingKey]) {\n  settings(keyNames: $keyNames) {\n    id\n    createdAt\n    updatedAt\n    key\n    value\n  }\n}
  `;

  postQuery(
    'settings',
    query,
    {
      keyNames: [
        'memberCardProductGroup',
        'personalCenterProductGroup',
        'searchResultProductGroup',
        'shoppingCartProductGroup',
        'couponPageProductGroup',
        'productDetailProductGroup',
        'canBackProductDetailPage',
      ],
    },
    { failureRate }
  );
};

const activeChannel = () => {
  const query = `
    query activeChannel {\n  activeChannel {\n    id\n    customFields {\n      shopName\n      shopLogo\n      updateShippingAddressLimitTime\n      amount\n      points\n    }\n  }\n}
  `;

  postQuery('activeChannel', query, {}, { failureRate });
};

const getActiveOrderByType = () => {
  const query = `
    query getActiveOrderByType($type: OrderPurchaseType!, $isRemoveMarkUp: Boolean) {\n  getActiveOrderByType(type: $type, isRemoveMarkUp: $isRemoveMarkUp) {\n    ...Cart\n  }\n}\n\nfragment Cart on Order {\n  id\n  code\n  state\n  active\n  updatedAt\n  orderPlacedAt\n  lines {\n    ...OrderLine\n  }\n  totalQuantity\n  subTotal\n  subTotalWithTax\n  total\n  shipping\n  shippingLines {\n    shippingMethod {\n      id\n      code\n      name\n      description\n    }\n  }\n  customFields {\n    orderPromotionResult {\n      promResult {\n        orderTotalPrice\n      }\n    }\n  }\n}\n\nfragment OrderLine on OrderLine {\n  id\n  quantity\n  totalQuantity\n  unitPrice\n  discountedUnitPrice\n  discountedLinePrice\n  proratedLinePrice\n  proratedUnitPrice\n  featuredAsset {\n    preview\n  }\n  merchantVoluntaryRefund\n  productVariant {\n    id\n    sku\n    price\n    name\n    options {\n      code\n      name\n    }\n    featuredAsset {\n      id\n      preview\n      source\n    }\n    isThereAnyStock\n    customFields {\n      virtualTargetType\n    }\n    product {\n      id\n      name\n      slug\n      description\n      enabled\n      customFields {\n        isVipProduct\n        unit\n        particulars\n      }\n      memberPriceActivityAmount {\n        minDiscount\n        maxDiscount\n        minMemberPriceAmount\n        maxMemberPriceAmount\n        memberPriceProductVariant {\n          memberPriceAmount\n          productVariantId\n          memberDiscount\n          discountType\n        }\n      }\n      featuredAsset {\n        id\n        width\n        height\n        name\n        preview\n        source\n        type\n      }\n      customFields {\n        price\n        markingPrice\n        unit\n        particulars\n        limitType\n        limitCount\n        putOnSaleType\n        putOnSaleTime\n      }\n      participatingActivities {\n        id\n        createdAt\n        updatedAt\n        startsAt\n        endsAt\n        couponCode\n        perCustomerUsageLimit\n        enabled\n        customFields {\n          type\n          activityName\n        }\n      }\n    }\n  }\n  customFields {\n    purchasePattern\n    isAvailableAfterSale\n    afterSaleLine {\n      id\n      createdAt\n      updatedAt\n      quantity\n      price\n    }\n    afterSale {\n      id\n      cause\n      state\n      mode\n    }\n  }\n}
  `;

  postQuery(
    'getActiveOrderByType',
    query,
    { type: 'shoppingTrolley', isRemoveMarkUp: false },
    { failureRate }
  );
};

const getSubscribeMessageTemplateId = () => {
  const query = `
    query getSubscribeMessageTemplateId {\n  getSubscribeMessageTemplateId {\n    couponGrants\n  }\n}
  `;

  postQuery('getSubscribeMessageTemplateId', query, {}, { failureRate });
};

const userClick = () => {
  const query = `
    mutation userClick {\n  userClick\n}
  `;

  postQuery('userClick', query, {}, { failureRate });
};

export default function () {
  getMatomoSiteId();
  maxDiscountMembershipPlan();
  reportedDistributorRecord();
  activeCustomer();
  getDistributor();
  getUserMember();
  settings();
  activeChannel();
  getActiveOrderByType();
  getSubscribeMessageTemplateId();
  userClick();
}
