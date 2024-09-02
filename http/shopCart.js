import { collections } from '../collections.js';
import { getRandom } from '../utils.js';

export const getShoppingCart = (failureRate) => {
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
    orderPromotionResult(
      [
        res.getShoppingCart.outrightPurchase.id,
        res.getShoppingCart.shoppingTrolley.id,
      ],
      failureRate
    );
  }
};

export const orderPromotionResult = (orderIds, failureRate) => {
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

export const getUserMember = (failureRate) => {
  const query = `
    query getUserMember {\n  getUserMember {\n    ...Member\n  }\n}\n\nfragment Member on Member {\n  id\n  createdAt\n  updatedAt\n  code\n  claimAt\n  activationAt\n  maturityAt\n  maturityType\n  membershipPlan {\n    ...MembershipPlan\n  }\n  state\n}\n\nfragment MembershipPlan on MembershipPlan {\n  id\n  createdAt\n  updatedAt\n  name\n  bannerImg\n  backgroundImage\n  protocolUsage\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  price\n  introduce\n  customerServiceNumber\n  state\n  rightsDiscount {\n    enable\n    discountRate\n    restrictedUse\n  }\n  rightsPoints {\n    enable\n    pointsMultiple\n  }\n  rightsCoupon {\n    enable\n    presentedCoupon {\n      couponId\n      presentedCount\n    }\n  }\n  membershipPlanCoupon {\n    coupon {\n      ...Coupon\n    }\n    quantity\n  }\n}\n\nfragment Coupon on Coupon {\n  __typename\n  id\n  createdAt\n  state\n  enable\n  updatedAt\n  name\n  remarks\n  type\n  preferentialContent {\n    preferentialType\n    minimum\n    discount\n    maximumOffer\n    includingDiscountProducts\n  }\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  totalQuantity\n  applicableProduct {\n    applicableType\n    productIds\n  }\n  claimRestriction\n  whetherRestrictUsers\n  memberPlanIds\n  introduce\n  promotion {\n    id\n  }\n  activityContent\n  activityTime\n}
  `;

  postQuery('getUserMember', query, {}, { failureRate });
};

export const seriesProducts = (collectionId, failureRate) => {
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
