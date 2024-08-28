import { check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

const failureRate = new Rate('check_failure_rate');

const config = {
  host: 'https://api.scmally.startcatcher.cn/shop-api',
  headers: {
    'Content-Type': 'application/json',
    'vendure-token': 'snrq0k7ry49cni771gzr',
  },
};

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
  const res = http.post(config.host, JSON.stringify({
    query: query,
    operationName: queryName,
    variables: variables
  }), {
    headers: config.headers,
  });
  const checkRes = check(res, {
    [`${queryName} status is 200`]: r => r.status === 200,
  });
  failureRate.add(!checkRes);
  return res;
}

function customPage() {
  const query = `
        query customPage($customPageId: ID, $options: CustomPageListOptions) {
    customPage(customPageId: $customPageId, options: $options) {
      id
      createdAt
      updatedAt
      type
      title
      showNotice
      showSearch
      shareImg
      shareTitle
      enable
      components {
        id
        createdAt
        updatedAt
        type
        data {
          pictures {
            imgHeight
            imgWidth
            imgUrl
            alt
            jump {
              startAxisX
              startAxisY
              endPointAxisX
              endPointAxisY
              jumpType
              jumpValue
            }
          }
          productGroup {
            menuCollection {
              menuName
              collectionId
            }
            groupType
          }
        }
        sort
        remark
        enable
      }
    }
  }
    `;
  const res = postQuery('customPage', query,
    { customPageId: "", options: { filter: { type: { eq: "homePage" }, enable: { eq: true } } } }
  );
  const data = JSON.parse(res.body);
  // 根据返回的数据，再次请求商品数据
  if (data.data.customPage) {
    againCustomPage(data.data.customPage);
  }
}

function getAnnouncement() {
  const query = `
        query getAnnouncement {
    getAnnouncement {
      id
      createdAt
      updatedAt
      value
    }
  }
    `
  postQuery('getAnnouncement', query);
}

function hotWords() {
  const query = `
    query hotWords($options: HotWordListOptions) {
    hotWords(options: $options) {
      items {
        id
        name
        createdAt
        updatedAt
        type
        imgUrl
        jumpType
        jumpValue
      }
      totalItems
    }
  }
    `
  postQuery('hotWords', query, { options: { take: 99, sort: { createdAt: "DESC" } } });
}

function seriesProducts(collectionId = '') {
  const query = `
        query seriesProducts($collectionId: ID!, $options: ProductListOptions) {
    seriesProducts(collectionId: $collectionId, options: $options) {
      items {
        id
        name
        slug
        description
        enabled
        customFields {
          isVipProduct
          unit
          particulars
        }
        optionGroups {
          id
          code
          name
          options {
            code
            name
          }
        }
        variants {
          id
          name
          options {
            code
            name
            group {
              code
              name
            }
          }
          isThereAnyStock
          price
          priceWithTax
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
          name
          enabled
          customFields {
            type
          }
        }
      }
      totalItems
    }
  }
    `
  if (!collectionId) {

    // 随机取一个collectionId
    collectionId = String(collection[Math.floor(Math.random() * collection.length)].id);
  }
  postQuery('seriesProducts', query, {
    collectionId: collectionId,
    options: {
      filter: {
        hidden: {
          eq: false
        },
        freeGift: {
          eq: false
        }
      },
      sort: {
        id: 'ASC',
        createdAt: 'DESC'
      }
    }
  });
}

function againCustomPage(data) {
  const components = data.components;
  if (components) {
    for (const component of components) {
      switch (component.type) {
        case 'banner':
          // banner组件没有需要请求的数据
          break;
        case 'picture':
          // 图片组件没有需要请求的数据
          break;
        case 'product':
        case 'productItems':
          {
            const productItems = component.data && component.data.productItems;
            const productIds = (productItems && productItems.ids) || [];
            if (productIds && productIds.length) {
              products(productIds);
            }
            const productGroup = component.data && component.data.productGroup;
            const menuCollection = (productGroup && productGroup.menuCollection) || [];
            if (menuCollection && menuCollection.length) {
              const collectionId = menuCollection[0].collectionId
              if (collectionId) {
                seriesProducts(collectionId);
              }
            }
          }
          // 商品组件
          break;
      }
    }
  }
}

function products(ids) {
  const query = `
       query products($options: ProductListOptions) {
    products(options: $options) {
      items {
        id
        name
        slug
        description
        enabled
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
            code
            name
            id
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
          priceWithTax
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
          putOnSaleType
          putOnSaleTime
          isVipProduct
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
      }
      totalItems
    }
  }
    `;
  postQuery('products', query, {
    options: {
      filter: {
        id: {
          in: ids
        }
      }
    }
  });
}

export default function () {
  customPage();
  getAnnouncement();
  hotWords();
}

const collection = [
  {
    "id": 1
  },
  {
    "id": 3
  },
  {
    "id": 4
  },
  {
    "id": 5
  },
  {
    "id": 10
  },
  {
    "id": 11
  },
  {
    "id": 12
  },
  {
    "id": 13
  },
  {
    "id": 14
  },
  {
    "id": 16
  },
  {
    "id": 17
  },
  {
    "id": 18
  },
  {
    "id": 19
  },
  {
    "id": 20
  },
  {
    "id": 21
  },
  {
    "id": 22
  },
  {
    "id": 23
  },
  {
    "id": 24
  },
  {
    "id": 38
  },
  {
    "id": 39
  },
  {
    "id": 51
  },
  {
    "id": 52
  },
  {
    "id": 53
  },
  {
    "id": 54
  },
  {
    "id": 56
  },
  {
    "id": 60
  },
  {
    "id": 61
  },
  {
    "id": 62
  },
  {
    "id": 63
  },
  {
    "id": 64
  },
  {
    "id": 65
  },
  {
    "id": 67
  },
  {
    "id": 68
  },
  {
    "id": 69
  },
  {
    "id": 70
  },
  {
    "id": 71
  },
  {
    "id": 72
  },
  {
    "id": 73
  },
  {
    "id": 74
  },
  {
    "id": 75
  },
  {
    "id": 76
  },
  {
    "id": 77
  },
  {
    "id": 78
  },
  {
    "id": 79
  },
  {
    "id": 80
  },
  {
    "id": 81
  },
  {
    "id": 82
  },
  {
    "id": 83
  },
  {
    "id": 84
  },
  {
    "id": 85
  },
  {
    "id": 86
  },
  {
    "id": 87
  },
  {
    "id": 90
  },
  {
    "id": 91
  },
  {
    "id": 92
  },
  {
    "id": 93
  },
  {
    "id": 95
  },
  {
    "id": 96
  },
  {
    "id": 97
  },
  {
    "id": 98
  },
  {
    "id": 99
  },
  {
    "id": 100
  },
  {
    "id": 101
  },
  {
    "id": 102
  },
  {
    "id": 103
  },
  {
    "id": 104
  },
  {
    "id": 105
  },
  {
    "id": 106
  },
  {
    "id": 107
  },
  {
    "id": 109
  },
  {
    "id": 110
  },
  {
    "id": 111
  },
  {
    "id": 112
  },
  {
    "id": 113
  },
  {
    "id": 114
  },
  {
    "id": 115
  },
  {
    "id": 116
  }
]