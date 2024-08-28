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
import { collections } from '../collections.js';
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

const getShoppingCart = () => {
  const product = `
    id
    name
    updatedAt
    slug
    description
    enabled
    customFields {
      isVipProduct
      unit
      particulars
      putOnSaleType
      putOnSaleTime
    }
    productPurchasePermission {
      id
      productId
      isMembershipPlanPurchase
      membershipPlans {
        id
      }
      guideMembershipPlanId
    }
    memberPriceActivityAmount {
      minDiscount
      maxDiscount
      minMemberPriceAmount
      maxMemberPriceAmount
      memberPriceProductVariant {
        memberPriceAmount
        productVariantId
        memberDiscount
        discountType
      }
    }
    optionGroups {
      id
      code
      name
      customFields {
        priority
      }
      options {
        id
        code
        name
        customFields {
          priority
        }
      }
    }
    variants {
      id
      name
      options {
        id
        code
        name
        group {
          id
          code
          name
        }
      }
      featuredAsset {
        id
        preview
        source
      }
      isThereAnyStock
      price
      sku
    }
    featuredAsset {
      id
      width
      height
      name
      preview
      source
      type
    }
    customFields {
      price
      markingPrice
      unit
      particulars
      limitType
      limitCount
    }
    participatingActivities {
      id
      createdAt
      updatedAt
      startsAt
      endsAt
      couponCode
      perCustomerUsageLimit
      enabled
      customFields {
        type
        activityName
      }
    }
  `;

  const productVariant = `
    id
    sku
    price
    name
    options {
      code
      name
    }
    featuredAsset {
      id
      preview
      source
    }
    isThereAnyStock
    product {
      ${product}
    }
  `;

  const orderLine = `
    id
    quantity
    totalQuantity
    unitPrice
    featuredAsset {
      preview
    }
    merchantVoluntaryRefund
    productVariant {
      ${productVariant}
    }
    customFields {
      purchasePattern
      isAvailableAfterSale
      afterSaleLine {
        id
        createdAt
        updatedAt
        quantity
        price
      }
      afterSale {
        id
        cause
        state
        mode
      }
    }
  `;

  const order = `
    id
    createdAt
    updatedAt
    orderPlacedAt
    code
    state
    total
    subTotal
    subTotalPrice
    totalPrice
    totalQuantity
    customFields {
      isAvailableAfterSale
      timeoutPeriodToBePaid
      timeoutPeriodToBeReceived
      remark
      orderPromotionResult {
        promResult {
          orderTotalPrice
        }
      }
    }
    fulfillments {
      id
      createdAt
      method
    }
    lines {
      ${orderLine}
    }
    surcharges {
      id
      price
    }
    shipping
    shippingAddress {
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      country
      countryCode
      phoneNumber
      customFields {
        district
      }
    }
  `;

  const query = `
    query getShoppingCart($isRemoveMarkUp: Boolean, $isUseMember: Boolean) {
      getShoppingCart(isRemoveMarkUp: $isRemoveMarkUp, isUseMember: $isUseMember) {
        shoppingTrolley {
          ${order}
        }
        outrightPurchase {
          ${order}
        }
      }
    }
  `;

  const res = postQuery(
    'getShoppingCart',
    query,
    {
      isRemoveMarkUp: true,
      isUseMember: true,
    },
    { failureRate }
  );

  if (res) {
    orderPromotionResult([
      res.getShoppingCart.outrightPurchase.id,
      res.getShoppingCart.shoppingTrolley.id,
    ]);
  }
};

const orderPromotionResult = (orderIds) => {
  const query = `
    query orderPromotionResult($orderIds: [ID!]!) {\n  orderPromotionResult(orderIds: $orderIds) {\n    id\n    createdAt\n    updatedAt\n    promResult {\n      orderId\n      discountAmount\n      promLineResults {\n        promInstanceId\n        tags\n        orderLines {\n          orderLineId\n          discountCount\n          discountAmount\n          skuId\n          discount\n          displayInThisGroup\n        }\n        priority\n        type\n        shouldGroup\n        description\n        promTime\n        promContent\n        promOverview\n        discountType\n        discountAmount\n        discountCount\n        meetCondition\n        superimposeType\n        superimposeTypes\n        gifts {\n          promInstanceId\n          giftType\n          items {\n            giftId\n            productId\n            skuId\n            count\n            name\n            giftPrice\n            price\n            selected\n          }\n        }\n        coupons {\n          couponId\n          selected\n          price\n          autoSelected\n        }\n      }\n      orderLinePromResults {\n        orderLineId\n        skuId\n        count\n        price\n        discountAmount\n        discountDetails {\n          promInstanceId\n          type\n          superimposeType\n          superimposeTypes\n          discountCount\n          discountAmount\n        }\n      }\n      leftOrderLines {\n        skuId\n        lineId\n        count\n        price\n        discountAmount\n      }\n      discountByTypes {\n        type\n        discountAmount\n      }\n      gifts {\n        promInstanceId\n        giftType\n        items {\n          giftId\n          productId\n          skuId\n          count\n          name\n          giftPrice\n          price\n          selected\n        }\n      }\n      coupons {\n        couponId\n        selected\n        price\n      }\n      disableMember\n    }\n  }\n}
  `;

  postQuery(
    'orderPromotionResult',
    query,
    {
      orderIds,
    },
    { failureRate }
  );
};

const getUserMember = () => {
  const query = `
    query getUserMember {\n  getUserMember {\n    ...Member\n  }\n}\n\nfragment Member on Member {\n  id\n  createdAt\n  updatedAt\n  code\n  claimAt\n  activationAt\n  maturityAt\n  maturityType\n  membershipPlan {\n    ...MembershipPlan\n  }\n  state\n}\n\nfragment MembershipPlan on MembershipPlan {\n  id\n  createdAt\n  updatedAt\n  name\n  bannerImg\n  backgroundImage\n  protocolUsage\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  price\n  introduce\n  customerServiceNumber\n  state\n  rightsDiscount {\n    enable\n    discountRate\n    restrictedUse\n  }\n  rightsPoints {\n    enable\n    pointsMultiple\n  }\n  rightsCoupon {\n    enable\n    presentedCoupon {\n      couponId\n      presentedCount\n    }\n  }\n  membershipPlanCoupon {\n    coupon {\n      ...Coupon\n    }\n    quantity\n  }\n}\n\nfragment Coupon on Coupon {\n  __typename\n  id\n  createdAt\n  state\n  enable\n  updatedAt\n  name\n  remarks\n  type\n  preferentialContent {\n    preferentialType\n    minimum\n    discount\n    maximumOffer\n    includingDiscountProducts\n  }\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  totalQuantity\n  applicableProduct {\n    applicableType\n    productIds\n  }\n  claimRestriction\n  whetherRestrictUsers\n  memberPlanIds\n  introduce\n  promotion {\n    id\n  }\n  activityContent\n  activityTime\n}
  `;

  postQuery('getUserMember', query, {}, { failureRate });
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

export default function () {
  getShoppingCart();
  getUserMember();
  seriesProducts();
}
