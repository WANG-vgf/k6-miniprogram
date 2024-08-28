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
import { productIds } from '../productIds.js';
import { collections } from '../collections.js';
import { getRandom, postQuery } from '../utils.js';

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

const product = () => {
  const query = `
    query product($id: ID) {\n  product(id: $id) {\n    id\n    name\n    slug\n    description\n    enabled\n    productPurchasePermission {\n      id\n      productId\n      isMembershipPlanPurchase\n      membershipPlans {\n        id\n      }\n      guideMembershipPlanId\n    }\n    reviews {\n      items {\n        id\n        createdAt\n        order {\n          lines {\n            id\n            quantity\n            productVariant {\n              id\n              sku\n              price\n              name\n              options {\n                code\n                name\n                group {\n                  code\n                  name\n                }\n              }\n              featuredAsset {\n                id\n                preview\n                source\n              }\n            }\n          }\n        }\n        description\n        stars\n        reviewImgs\n        customerName\n        customerNameIsPublic\n        customer {\n          lastName\n          customFields {\n            headPortrait\n          }\n        }\n      }\n      totalItems\n    }\n    customFields {\n      isVipProduct\n      unit\n      particulars\n    }\n    memberPriceActivityAmount {\n      minDiscount\n      maxDiscount\n      minMemberPriceAmount\n      maxMemberPriceAmount\n      memberPriceProductVariant {\n        memberPriceAmount\n        productVariantId\n        memberDiscount\n        discountType\n      }\n    }\n    optionGroups {\n      id\n      code\n      name\n      customFields {\n        priority\n      }\n      options {\n        id\n        code\n        name\n        customFields {\n          priority\n        }\n      }\n    }\n    variants {\n      id\n      name\n      virtualTarget {\n        ... on Coupon {\n          id\n          cname: name\n          cstate: state\n          enable\n        }\n        ... on MembershipPlan {\n          id\n          name\n          state\n        }\n      }\n      options {\n        code\n        name\n        id\n        group {\n          id\n          code\n          name\n        }\n      }\n      featuredAsset {\n        id\n        preview\n        source\n      }\n      isThereAnyStock\n      price\n      sku\n    }\n    featuredAsset {\n      id\n      width\n      height\n      name\n      preview\n      source\n      type\n    }\n    assets {\n      id\n      width\n      height\n      name\n      preview\n      source\n      type\n    }\n    customFields {\n      price\n      markingPrice\n      unit\n      particulars\n      limitType\n      limitCount\n      productType\n      virtualTargetType\n      subscriptionPlan {\n        id\n        periodAndDiscount {\n          expireNumberOfPeriod\n          discountType\n          discountAmount\n          recommend\n        }\n        subscriptionInterval {\n          unit\n          frequency\n        }\n      }\n      putOnSaleType\n      putOnSaleTime\n    }\n    participatingActivities {\n      id\n      createdAt\n      updatedAt\n      startsAt\n      endsAt\n      couponCode\n      perCustomerUsageLimit\n      enabled\n      customFields {\n        activityName\n        type\n      }\n    }\n  }\n}
  `;

  postQuery(
    'product',
    query,
    {
      id: String(productIds[getRandom(0, productIds.length - 1)].id),
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

const seriesProducts = (collectionId) => {
  const query = `
     query seriesProducts($collectionId: ID!, $options: ProductListOptions) {\n  seriesProducts(collectionId: $collectionId, options: $options) {\n    items {\n      id\n      name\n      updatedAt\n      description\n      enabled\n      productPurchasePermission {\n        id\n        productId\n        isMembershipPlanPurchase\n        membershipPlans {\n          id\n        }\n        guideMembershipPlanId\n      }\n      optionGroups {\n        id\n        code\n        name\n        customFields {\n          priority\n        }\n        options {\n          id\n          code\n          name\n          customFields {\n            priority\n          }\n        }\n      }\n      variants {\n        id\n        name\n        options {\n          id\n          code\n          name\n          group {\n            id\n            code\n            name\n          }\n        }\n        featuredAsset {\n          id\n          preview\n          source\n        }\n        isThereAnyStock\n        price\n      }\n      featuredAsset {\n        id\n        preview\n        source\n      }\n      memberPriceActivityAmount {\n        minDiscount\n        maxDiscount\n        minMemberPriceAmount\n        maxMemberPriceAmount\n        memberPriceProductVariant {\n          memberPriceAmount\n          productVariantId\n          memberDiscount\n          discountType\n        }\n      }\n      participatingActivities {\n        id\n        createdAt\n        updatedAt\n        startsAt\n        endsAt\n        couponCode\n        perCustomerUsageLimit\n        enabled\n        customFields {\n          type\n          activityName\n        }\n      }\n      customFields {\n        price\n        markingPrice\n        unit\n        limitType\n        limitCount\n        isVipProduct\n        particulars\n        putOnSaleTime\n        putOnSaleType\n      }\n    }\n    totalItems\n  }\n}
    `;

  if (!collectionId) {
    collectionId = String(collections[getRandom(0, collections.length - 1)].id);
  }

  postQuery(
    'seriesProducts',
    query,
    {
      collectionId,
      options: {
        filter: {
          hidden: {
            eq: false,
          },
          freeGift: {
            eq: false,
          },
        },
        sort: {
          id: 'ASC',
          createdAt: 'DESC',
        },
      },
    },
    { failureRate }
  );
};

const userClickProduct = () => {
  const query = `
    mutation userClickProduct($productId: ID) {\n  userClickProduct(productId: $productId)\n}
  `;

  postQuery(
    'userClickProduct',
    query,
    {
      productId: '4581',
    },
    { failureRate }
  );
};

const getPurchaseQuantity = (productId, type, isIncludeCurrentOrder) => {
  const query = `
    query getPurchaseQuantity($productId: ID!, $type: OrderPurchaseType, $isIncludeCurrentOrder: Boolean) {\n  getPurchaseQuantity(\n    productId: $productId\n    type: $type\n    isIncludeCurrentOrder: $isIncludeCurrentOrder\n  )\n}
  `;

  postQuery(
    'getPurchaseQuantity',
    query,
    {
      productId: '4608',
      type: 'regularOrder',
      isIncludeCurrentOrder: false,
    },
    { failureRate }
  );
};

export default function () {
  product();
  activeCustomer();
  getDistributor();
  seriesProducts();
  userClickProduct();
  getPurchaseQuantity('4581', 'regularOrder', false);
  getPurchaseQuantity('4581', 'shoppingTrolley', true);
}
