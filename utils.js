import { check } from 'k6';
import { REQ_HOST } from './constants.js';
import { tokens } from './tokens.js';
import http from 'k6/http';

export const getRandom = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  // 生成min到max之间的随机整数（包括min和max）
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getHttpConfig = () => {
  const token = tokens[getRandom(0, tokens.length - 1)].token;
  return {
    host: REQ_HOST,
    headers: {
      'Content-Type': 'application/json',
      'vendure-token': 'snrq0k7ry49cni771gzr',
      Authorization: `bearer ${token}`,
    },
  };
};

export const postQuery = (queryName, query, variables = {}, options) => {
  const httpConfig = getHttpConfig();

  const res = http.post(
    httpConfig.host,
    JSON.stringify({
      query: query,
      // operationName: queryName,
      variables: variables,
    }),
    {
      headers: httpConfig.headers,
    }
  );

  const checkRes = check(res, {
    [`${queryName} status is 200`]: (r) => r.status === 200,
  });

  options.failureRate.add(!checkRes);

  const body = JSON.parse(res.body);
  if (!body.data) {
    console.log(body);
    return null;
  }
  return body.data;
};
