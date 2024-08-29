import { postQuery } from '../utils.js';

export const getMatomoSiteId = (failureRate) => {
  const query = `
    query getMatomoSiteId {\n  getMatomoSiteId\n}
  `;
  postQuery('getMatomoSiteId', query, {}, { failureRate });
};

export const maxDiscountMembershipPlan = (failureRate) => {
  const query = `
    query maxDiscountMembershipPlan {\n  maxDiscountMembershipPlan {\n    ...MembershipPlan\n  }\n}\n\nfragment MembershipPlan on MembershipPlan {\n  id\n  createdAt\n  updatedAt\n  name\n  bannerImg\n  backgroundImage\n  protocolUsage\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  price\n  introduce\n  customerServiceNumber\n  state\n  rightsDiscount {\n    enable\n    discountRate\n    restrictedUse\n  }\n  rightsPoints {\n    enable\n    pointsMultiple\n  }\n  rightsCoupon {\n    enable\n    presentedCoupon {\n      couponId\n      presentedCount\n    }\n  }\n  membershipPlanCoupon {\n    coupon {\n      ...Coupon\n    }\n    quantity\n  }\n}\n\nfragment Coupon on Coupon {\n  __typename\n  id\n  createdAt\n  state\n  enable\n  updatedAt\n  name\n  remarks\n  type\n  preferentialContent {\n    preferentialType\n    minimum\n    discount\n    maximumOffer\n    includingDiscountProducts\n  }\n  validityPeriod {\n    type\n    startTime\n    endTime\n    numberOfDays\n  }\n  totalQuantity\n  applicableProduct {\n    applicableType\n    productIds\n  }\n  claimRestriction\n  whetherRestrictUsers\n  memberPlanIds\n  introduce\n  promotion {\n    id\n  }\n  activityContent\n  activityTime\n}
  `;

  postQuery('maxDiscountMembershipPlan', query, {}, { failureRate });
};

export const reportedDistributorRecord = (failureRate) => {
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

export const activeCustomer = (failureRate) => {
  const query = `
    query activeCustomer {\n  activeCustomer {\n    ...Customer\n  }\n}\n\nfragment Customer on Customer {\n  id\n  createdAt\n  updatedAt\n  title\n  firstName\n  lastName\n  phoneNumber\n  emailAddress\n  addresses {\n    ...Address\n  }\n  user {\n    id\n    createdAt\n    updatedAt\n    identifier\n    verified\n    lastLogin\n    customFields\n  }\n  customFields {\n    distributor {\n      id\n      name\n      phone\n    }\n    headPortrait\n    gender\n    dateBirth\n    wechatCode\n    isModified\n    points\n  }\n}\n\nfragment Address on Address {\n  id\n  createdAt\n  updatedAt\n  fullName\n  company\n  streetLine1\n  streetLine2\n  city\n  province\n  postalCode\n  country {\n    id\n    code\n    name\n  }\n  phoneNumber\n  defaultShippingAddress\n  defaultBillingAddress\n  customFields {\n    district\n  }\n}
  `;

  postQuery('activeCustomer', query, {}, { failureRate });
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

export const settings = (failureRate) => {
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

export const activeChannel = (failureRate) => {
  const query = `
    query activeChannel {\n  activeChannel {\n    id\n    customFields {\n      shopName\n      shopLogo\n      updateShippingAddressLimitTime\n      amount\n      points\n    }\n  }\n}
  `;

  postQuery('activeChannel', query, {}, { failureRate });
};

export const getActiveOrderByType = (failureRate) => {
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

export const getSubscribeMessageTemplateId = (failureRate) => {
  const query = `
    query getSubscribeMessageTemplateId {\n  getSubscribeMessageTemplateId {\n    couponGrants\n  }\n}
  `;

  postQuery('getSubscribeMessageTemplateId', query, {}, { failureRate });
};

export const userClick = (failureRate) => {
  const query = `
    mutation userClick {\n  userClick\n}
  `;

  postQuery('userClick', query, {}, { failureRate });
};
