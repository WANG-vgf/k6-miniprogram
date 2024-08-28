import { productIds } from '../productIds.js';
import { collections } from '../collections.js';
import { getRandom, postQuery } from '../utils.js';

export const product = (failureRate) => {
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

export const seriesProducts = (failureRate, collectionId) => {
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

export const userClickProduct = (failureRate) => {
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

export const getPurchaseQuantity = (
  failureRate,
  productId,
  type,
  isIncludeCurrentOrder
) => {
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
