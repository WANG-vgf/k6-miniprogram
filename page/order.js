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

import { check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { CHECK_FAILURE_RATE } from '../constants.js';
import { getHttpConfig, getRandom } from '../utils.js';

const failureRate = new Rate(CHECK_FAILURE_RATE);

const httpConfig = getHttpConfig();

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

function postQuery(queryName, query, variables = {}) {
  const res = http.post(
    httpConfig.host,
    JSON.stringify({
      query: query,
      operationName: queryName,
      variables: variables,
    }),
    {
      headers: httpConfig.headers,
    }
  );
  const checkRes = check(res, {
    [`${queryName} status is 200`]: (r) => r.status === 200,
  });
  failureRate.add(!checkRes);
  return res;
}

const orders = () => {
  const query = `
    query orders($options: OrderListOptions) {\n  orders(options: $options) {\n    items {\n      ...Order\n    }\n    totalItems\n  }\n}\n\nfragment Order on Order {\n  id\n  createdAt\n  updatedAt\n  orderPlacedAt\n  code\n  state\n  subTotal\n  total\n  subTotalPrice\n  totalPrice\n  totalQuantity\n  isPaymentRewardActivity\n  customFields {\n    subscriptionPlan {\n      ...SubscriptionPlan\n    }\n    subscription {\n      id\n      expireNumberOfPeriod\n    }\n    periods\n    deliveryInterval\n    firstShippingDate\n    logistics {\n      ...Logistics\n    }\n    isAvailableAfterSale\n    timeoutPeriodToBePaid\n    timeoutPeriodToBeReceived\n    remark\n    orderPromotionResult {\n      promResult {\n        orderTotalPrice\n      }\n    }\n  }\n  fulfillments {\n    id\n    createdAt\n    method\n  }\n  lines {\n    ...OrderLine\n  }\n  surcharges {\n    id\n    price\n  }\n  shipping\n  shippingAddress {\n    fullName\n    company\n    streetLine1\n    streetLine2\n    city\n    province\n    postalCode\n    country\n    countryCode\n    phoneNumber\n    customFields {\n      district\n    }\n  }\n}\n\nfragment OrderLine on OrderLine {\n  id\n  quantity\n  totalQuantity\n  unitPrice\n  discountedUnitPrice\n  discountedLinePrice\n  proratedLinePrice\n  proratedUnitPrice\n  featuredAsset {\n    preview\n  }\n  merchantVoluntaryRefund\n  productVariant {\n    id\n    sku\n    price\n    name\n    options {\n      code\n      name\n    }\n    featuredAsset {\n      id\n      preview\n      source\n    }\n    isThereAnyStock\n    customFields {\n      virtualTargetType\n    }\n    product {\n      id\n      name\n      slug\n      description\n      enabled\n      customFields {\n        isVipProduct\n        unit\n        particulars\n      }\n      memberPriceActivityAmount {\n        minDiscount\n        maxDiscount\n        minMemberPriceAmount\n        maxMemberPriceAmount\n        memberPriceProductVariant {\n          memberPriceAmount\n          productVariantId\n          memberDiscount\n          discountType\n        }\n      }\n      featuredAsset {\n        id\n        width\n        height\n        name\n        preview\n        source\n        type\n      }\n      customFields {\n        price\n        markingPrice\n        unit\n        particulars\n        limitType\n        limitCount\n        putOnSaleType\n        putOnSaleTime\n      }\n      participatingActivities {\n        id\n        createdAt\n        updatedAt\n        startsAt\n        endsAt\n        couponCode\n        perCustomerUsageLimit\n        enabled\n        customFields {\n          type\n          activityName\n        }\n      }\n    }\n  }\n  customFields {\n    purchasePattern\n    isAvailableAfterSale\n    afterSaleLine {\n      id\n      createdAt\n      updatedAt\n      quantity\n      price\n    }\n    afterSale {\n      id\n      cause\n      state\n      mode\n    }\n  }\n}\n\nfragment SubscriptionPlan on SubscriptionPlan {\n  id\n  createdAt\n  updatedAt\n  name\n  channelId\n  payUpFront\n  fixedStartDate\n  autoRenew\n  cutOffDays\n  subscriptionInterval {\n    unit\n    frequency\n  }\n  periodAndDiscount {\n    expireNumberOfPeriod\n    discountType\n    discountAmount\n    recommend\n  }\n}\n\nfragment Logistics on Logistics {\n  id\n  logisticCode\n  company\n  state\n  logisticInfo {\n    logisticCode\n    shipperCode\n    traces {\n      acceptStation\n      acceptTime\n    }\n    state\n  }\n  order {\n    id\n  }\n  fulfillment {\n    id\n    method\n  }\n}
  `;

  const res = postQuery('orders', query, {
    options: {
      take: 10,
      skip: 0,
      filter: {
        state: {
          notIn: ['AddingItems', 'DelayDeliver'],
          contains: '',
        },
      },
      sort: {
        timeToPlaceOrder: 'DESC',
      },
    },
  });

  const body = JSON.parse(res.body);
  if (body.data) {
    const itemList = body.data.orders.items || [];
    const item = body.data.orders.items[getRandom(0, itemList.length - 1)];
    if (item) {
      const orderId = item.id;
      order(orderId);
      afterSaleByOrderId(orderId);
      orderPromotionResult(orderId);
      afterSaleByOrderId(orderId);
      freeGiftByOrder(orderId);
      orderPaymentRewardCoupons(orderId);
    } else {
      console.log(`orderId is not found`);
    }
  }
};

const order = (orderId) => {
  const query = `
      query order($id: ID!) {\n  order(id: $id) {\n    ...Order\n  }\n}\n\nfragment Order on Order {\n  id\n  createdAt\n  updatedAt\n  orderPlacedAt\n  code\n  state\n  subTotal\n  total\n  subTotalPrice\n  totalPrice\n  totalQuantity\n  isPaymentRewardActivity\n  customFields {\n    subscriptionPlan {\n      ...SubscriptionPlan\n    }\n    subscription {\n      id\n      expireNumberOfPeriod\n    }\n    periods\n    deliveryInterval\n    firstShippingDate\n    logistics {\n      ...Logistics\n    }\n    isAvailableAfterSale\n    timeoutPeriodToBePaid\n    timeoutPeriodToBeReceived\n    remark\n    orderPromotionResult {\n      promResult {\n        orderTotalPrice\n      }\n    }\n  }\n  fulfillments {\n    id\n    createdAt\n    method\n  }\n  lines {\n    ...OrderLine\n  }\n  surcharges {\n    id\n    price\n  }\n  shipping\n  shippingAddress {\n    fullName\n    company\n    streetLine1\n    streetLine2\n    city\n    province\n    postalCode\n    country\n    countryCode\n    phoneNumber\n    customFields {\n      district\n    }\n  }\n}\n\nfragment OrderLine on OrderLine {\n  id\n  quantity\n  totalQuantity\n  unitPrice\n  discountedUnitPrice\n  discountedLinePrice\n  proratedLinePrice\n  proratedUnitPrice\n  featuredAsset {\n    preview\n  }\n  merchantVoluntaryRefund\n  productVariant {\n    id\n    sku\n    price\n    name\n    options {\n      code\n      name\n    }\n    featuredAsset {\n      id\n      preview\n      source\n    }\n    isThereAnyStock\n    customFields {\n      virtualTargetType\n    }\n    product {\n      id\n      name\n      slug\n      description\n      enabled\n      customFields {\n        isVipProduct\n        unit\n        particulars\n      }\n      memberPriceActivityAmount {\n        minDiscount\n        maxDiscount\n        minMemberPriceAmount\n        maxMemberPriceAmount\n        memberPriceProductVariant {\n          memberPriceAmount\n          productVariantId\n          memberDiscount\n          discountType\n        }\n      }\n      featuredAsset {\n        id\n        width\n        height\n        name\n        preview\n        source\n        type\n      }\n      customFields {\n        price\n        markingPrice\n        unit\n        particulars\n        limitType\n        limitCount\n        putOnSaleType\n        putOnSaleTime\n      }\n      participatingActivities {\n        id\n        createdAt\n        updatedAt\n        startsAt\n        endsAt\n        couponCode\n        perCustomerUsageLimit\n        enabled\n        customFields {\n          type\n          activityName\n        }\n      }\n    }\n  }\n  customFields {\n    purchasePattern\n    isAvailableAfterSale\n    afterSaleLine {\n      id\n      createdAt\n      updatedAt\n      quantity\n      price\n    }\n    afterSale {\n      id\n      cause\n      state\n      mode\n    }\n  }\n}\n\nfragment SubscriptionPlan on SubscriptionPlan {\n  id\n  createdAt\n  updatedAt\n  name\n  channelId\n  payUpFront\n  fixedStartDate\n  autoRenew\n  cutOffDays\n  subscriptionInterval {\n    unit\n    frequency\n  }\n  periodAndDiscount {\n    expireNumberOfPeriod\n    discountType\n    discountAmount\n    recommend\n  }\n}\n\nfragment Logistics on Logistics {\n  id\n  logisticCode\n  company\n  state\n  logisticInfo {\n    logisticCode\n    shipperCode\n    traces {\n      acceptStation\n      acceptTime\n    }\n    state\n  }\n  order {\n    id\n  }\n  fulfillment {\n    id\n    method\n  }\n}
  `;

  postQuery('order', query, {
    id: orderId,
  });
};

const afterSaleByOrderId = (orderId) => {
  const query = `
    query afterSaleByOrderId($orderId: ID!, $options: AfterSaleListOptions = null) {\n  afterSaleByOrderId(orderId: $orderId, options: $options) {\n    items {\n      ...AfterSale\n    }\n    totalItems\n  }\n}\n\nfragment AfterSale on AfterSale {\n  id\n  createdAt\n  updatedAt\n  type\n  mode\n  cause\n  description\n  img\n  price\n  code\n  auditTimeout\n  logisticsTimeout\n  merchantConfirmReceiptTimeout\n  userConfirmReceiptTimeout\n  userHandleTimeout\n  applyAt\n  auditAt\n  deliverAt\n  cancelAt\n  merchantDeliveryTime\n  confirmReceiptAt\n  state\n  groundsRefusal\n  afterSaleLines {\n    id\n    createdAt\n    updatedAt\n    quantity\n    price\n    orderLine {\n      ...OrderLine\n    }\n  }\n  logisticses {\n    id\n    createdAt\n    updatedAt\n    logisticCode\n    company\n    type\n    state\n    logisticInfo {\n      logisticCode\n      shipperCode\n      traces {\n        acceptStation\n        acceptTime\n      }\n      state\n    }\n  }\n  afterSaleHistories {\n    id\n    createdAt\n    updatedAt\n    type\n    operatorType\n    message\n    data {\n      type\n      mode\n      cause\n      description\n      img\n      price\n      code\n      applyAt\n      auditAt\n      deliverAt\n      cancelAt\n      state\n      groundsRefusal\n    }\n  }\n  order {\n    id\n    customFields {\n      isAvailableAfterSale\n    }\n    state\n    orderPlacedAt\n  }\n  channelAddress {\n    fullName\n    company\n    streetLine1\n    streetLine2\n    city\n    province\n    postalCode\n    phoneNumber\n    district\n  }\n}\n\nfragment OrderLine on OrderLine {\n  id\n  quantity\n  totalQuantity\n  unitPrice\n  discountedUnitPrice\n  discountedLinePrice\n  proratedLinePrice\n  proratedUnitPrice\n  featuredAsset {\n    preview\n  }\n  merchantVoluntaryRefund\n  productVariant {\n    id\n    sku\n    price\n    name\n    options {\n      code\n      name\n    }\n    featuredAsset {\n      id\n      preview\n      source\n    }\n    isThereAnyStock\n    customFields {\n      virtualTargetType\n    }\n    product {\n      id\n      name\n      slug\n      description\n      enabled\n      customFields {\n        isVipProduct\n        unit\n        particulars\n      }\n      memberPriceActivityAmount {\n        minDiscount\n        maxDiscount\n        minMemberPriceAmount\n        maxMemberPriceAmount\n        memberPriceProductVariant {\n          memberPriceAmount\n          productVariantId\n          memberDiscount\n          discountType\n        }\n      }\n      featuredAsset {\n        id\n        width\n        height\n        name\n        preview\n        source\n        type\n      }\n      customFields {\n        price\n        markingPrice\n        unit\n        particulars\n        limitType\n        limitCount\n        putOnSaleType\n        putOnSaleTime\n      }\n      participatingActivities {\n        id\n        createdAt\n        updatedAt\n        startsAt\n        endsAt\n        couponCode\n        perCustomerUsageLimit\n        enabled\n        customFields {\n          type\n          activityName\n        }\n      }\n    }\n  }\n  customFields {\n    purchasePattern\n    isAvailableAfterSale\n    afterSaleLine {\n      id\n      createdAt\n      updatedAt\n      quantity\n      price\n    }\n    afterSale {\n      id\n      cause\n      state\n      mode\n    }\n  }\n}
  `;

  postQuery('afterSaleByOrderId', query, {
    orderId,
    options: {
      filter: {
        state: {
          notEq: 'cancel',
        },
      },
    },
  });
};

const orderPromotionResult = (orderIds) => {
  const query = `
    query orderPromotionResult($orderIds: [ID!]!) {\n  orderPromotionResult(orderIds: $orderIds) {\n    id\n    createdAt\n    updatedAt\n    promResult {\n      orderId\n      discountAmount\n      promLineResults {\n        promInstanceId\n        tags\n        orderLines {\n          orderLineId\n          discountCount\n          discountAmount\n          skuId\n          discount\n          displayInThisGroup\n        }\n        priority\n        type\n        shouldGroup\n        description\n        promTime\n        promContent\n        promOverview\n        discountType\n        discountAmount\n        discountCount\n        meetCondition\n        superimposeType\n        superimposeTypes\n        gifts {\n          promInstanceId\n          giftType\n          items {\n            giftId\n            productId\n            skuId\n            count\n            name\n            giftPrice\n            price\n            selected\n          }\n        }\n        coupons {\n          couponId\n          selected\n          price\n          autoSelected\n        }\n      }\n      orderLinePromResults {\n        orderLineId\n        skuId\n        count\n        price\n        discountAmount\n        discountDetails {\n          promInstanceId\n          type\n          superimposeType\n          superimposeTypes\n          discountCount\n          discountAmount\n        }\n      }\n      leftOrderLines {\n        skuId\n        lineId\n        count\n        price\n        discountAmount\n      }\n      discountByTypes {\n        type\n        discountAmount\n      }\n      gifts {\n        promInstanceId\n        giftType\n        items {\n          giftId\n          productId\n          skuId\n          count\n          name\n          giftPrice\n          price\n          selected\n        }\n      }\n      coupons {\n        couponId\n        selected\n        price\n      }\n      disableMember\n    }\n  }\n}
  `;

  postQuery('orderPromotionResult', query, {
    orderIds,
  });
};

const freeGiftByOrder = (orderId) => {
  const query = `
    query freeGiftByOrder($orderId: ID!) {\n  freeGiftByOrder(orderId: $orderId) {\n    id\n    name\n    status\n    product {\n      id\n      name\n      slug\n      description\n      enabled\n      customFields {\n        isVipProduct\n        unit\n        particulars\n      }\n      optionGroups {\n        id\n        code\n        name\n        customFields {\n          priority\n        }\n        options {\n          id\n          code\n          name\n          customFields {\n            priority\n          }\n        }\n      }\n      variants {\n        id\n        name\n        options {\n          code\n          name\n          id\n          group {\n            id\n            code\n            name\n          }\n        }\n        featuredAsset {\n          id\n          preview\n          source\n        }\n        isThereAnyStock\n        price\n        priceWithTax\n        sku\n      }\n      featuredAsset {\n        id\n        width\n        height\n        name\n        preview\n        source\n        type\n      }\n      customFields {\n        price\n        markingPrice\n        unit\n        particulars\n        limitType\n        limitCount\n        putOnSaleType\n        putOnSaleTime\n      }\n    }\n  }\n}
  `;

  postQuery('freeGiftByOrder', query, {
    orderId,
  });
};

const orderPaymentRewardCoupons = (orderId) => {
  const query = `
    query orderPaymentRewardCoupons($orderId: ID!, $options: OrderPaymentRewardCouponListOptions) {\n  orderPaymentRewardCoupons(orderId: $orderId, options: $options) {\n    items {\n      id\n      createdAt\n      updatedAt\n      orderId\n      userCouponId\n      couponId\n      paymentRewardActivityId\n      coupon {\n        ...Coupon\n      }\n      isClaimed\n      isUsed\n    }\n    totalItems\n  }\n}\n\nfragment Coupon on Coupon {\n  __typename\n  id\n  createdAt\n  state\n  enable\n  updatedAt\n  name\n  remarks\n  type\n  preferentialContent {\n    preferentialType\n    minimum\n    discount\n    maximumOffer\n    includingDiscountProducts\n  }\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  totalQuantity\n  applicableProduct {\n    applicableType\n    productIds\n  }\n  claimRestriction\n  whetherRestrictUsers\n  memberPlanIds\n  introduce\n  promotion {\n    id\n  }\n  activityContent\n  activityTime\n}
  `;

  postQuery('orderPaymentRewardCoupons', query, {
    orderId,
  });
};

export default function () {
  orders();
  // afterSaleByOrderId();
  // orderPromotionResult();
  // freeGiftByOrder();
  // orderPaymentRewardCoupons();
}
