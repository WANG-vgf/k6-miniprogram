import { collections } from '../collections.js';
import { postQuery } from '../utils.js';

export const customPage = (failureRate) => {
  const query = `
    query customPage($customPageId: ID, $options: CustomPageListOptions) {\n  customPage(customPageId: $customPageId, options: $options) {\n    id\n    createdAt\n    updatedAt\n    type\n    title\n    showNotice\n    showSearch\n    shareImg\n    shareTitle\n    enable\n    components {\n      id\n      createdAt\n      updatedAt\n      type\n      data {\n        layoutType\n        pictures {\n          imgHeight\n          imgWidth\n          imgUrl\n          alt\n          jump {\n            startAxisX\n            startAxisY\n            endPointAxisX\n            endPointAxisY\n            jumpType\n            jumpValue\n          }\n        }\n        productGroup {\n          menuCollection {\n            menuName\n            collectionId\n          }\n          groupType\n        }\n        productItems {\n          showType\n          ids\n        }\n      }\n      sort\n      remark\n      enable\n    }\n  }\n}
  `;

  postQuery(
    'customPage',
    query,
    {
      customPageId: '',
      options: {
        filter: { type: { eq: 'commodityGroupPage' }, enable: { eq: true } },
      },
    },
    { failureRate }
  );
};

export const hotWords = (failureRate) => {
  const query = `
    query hotWords($options: HotWordListOptions) {\n  hotWords(options: $options) {\n    items {\n      id\n      name\n      createdAt\n      updatedAt\n      type\n      imgUrl\n      jumpType\n      jumpValue\n    }\n    totalItems\n  }\n}
  `;

  postQuery(
    'hotWords',
    query,
    {
      options: { take: 99, sort: { createdAt: 'DESC' } },
    },
    { failureRate }
  );
};

export const seriesProducts = (failureRatecollectionId) => {
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

export const getAnnouncement = (failureRate) => {
  const query = `
    query getAnnouncement {\n  getAnnouncement {\n    id\n    createdAt\n    updatedAt\n    value\n  }\n}
  `;

  postQuery('getAnnouncement', query, {}, { failureRate });
};

export const getDistributor = (failureRate) => {
  const query = `
    query getDistributor {\n  getDistributor {\n    id\n    createdAt\n    updatedAt\n    name\n    phone\n    customer {\n      ...Customer\n    }\n    orderTotal\n    customerCount\n    effectiveCustomerNum\n  }\n}\n\nfragment Customer on Customer {\n  id\n  createdAt\n  updatedAt\n  title\n  firstName\n  lastName\n  phoneNumber\n  emailAddress\n  addresses {\n    ...Address\n  }\n  user {\n    id\n    createdAt\n    updatedAt\n    identifier\n    verified\n    lastLogin\n    customFields\n  }\n  customFields {\n    distributor {\n      id\n      name\n      phone\n    }\n    headPortrait\n    gender\n    dateBirth\n    wechatCode\n    isModified\n    points\n  }\n}\n\nfragment Address on Address {\n  id\n  createdAt\n  updatedAt\n  fullName\n  company\n  streetLine1\n  streetLine2\n  city\n  province\n  postalCode\n  country {\n    id\n    code\n    name\n  }\n  phoneNumber\n  defaultShippingAddress\n  defaultBillingAddress\n  customFields {\n    district\n  }\n}
  `;

  postQuery('getDistributor', query, {}, { failureRate });
};
