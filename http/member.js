import { collections } from '../collections.js';
import { getRandom, postQuery } from '../utils.js';

export const membershipPlans = (failureRate) => {
  const query = `
    query membershipPlans($options: MembershipPlanListOptions) {\n  membershipPlans(options: $options) {\n    items {\n      ...MembershipPlan\n    }\n    totalItems\n  }\n}\n\nfragment MembershipPlan on MembershipPlan {\n  id\n  createdAt\n  updatedAt\n  name\n  bannerImg\n  backgroundImage\n  protocolUsage\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  price\n  introduce\n  customerServiceNumber\n  state\n  rightsDiscount {\n    enable\n    discountRate\n    restrictedUse\n  }\n  rightsPoints {\n    enable\n    pointsMultiple\n  }\n  rightsCoupon {\n    enable\n    presentedCoupon {\n      couponId\n      presentedCount\n    }\n  }\n  membershipPlanCoupon {\n    coupon {\n      ...Coupon\n    }\n    quantity\n  }\n}\n\nfragment Coupon on Coupon {\n  __typename\n  id\n  createdAt\n  state\n  enable\n  updatedAt\n  name\n  remarks\n  type\n  preferentialContent {\n    preferentialType\n    minimum\n    discount\n    maximumOffer\n    includingDiscountProducts\n  }\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  totalQuantity\n  applicableProduct {\n    applicableType\n    productIds\n  }\n  claimRestriction\n  whetherRestrictUsers\n  memberPlanIds\n  introduce\n  promotion {\n    id\n  }\n  activityContent\n  activityTime\n}
  `;

  postQuery(
    'membershipPlans',
    query,
    {
      options: { filter: { state: { eq: 'shelf' }, isShow: { eq: true } } },
    },
    { failureRate }
  );
};

export const getDistributor = (failureRate) => {
  const query = `
    query getDistributor {\n  getDistributor {\n    id\n    createdAt\n    updatedAt\n    name\n    phone\n    customer {\n      ...Customer\n    }\n    orderTotal\n    customerCount\n    effectiveCustomerNum\n  }\n}\n\nfragment Customer on Customer {\n  id\n  createdAt\n  updatedAt\n  title\n  firstName\n  lastName\n  phoneNumber\n  emailAddress\n  addresses {\n    ...Address\n  }\n  user {\n    id\n    createdAt\n    updatedAt\n    identifier\n    verified\n    lastLogin\n    customFields\n  }\n  customFields {\n    distributor {\n      id\n      name\n      phone\n    }\n    headPortrait\n    gender\n    dateBirth\n    wechatCode\n    isModified\n    points\n  }\n}\n\nfragment Address on Address {\n  id\n  createdAt\n  updatedAt\n  fullName\n  company\n  streetLine1\n  streetLine2\n  city\n  province\n  postalCode\n  country {\n    id\n    code\n    name\n  }\n  phoneNumber\n  defaultShippingAddress\n  defaultBillingAddress\n  customFields {\n    district\n  }\n}
  `;

  postQuery('getDistributor', query, {}, { failureRate });
};

export const getUserMember = (failureRate) => {
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
