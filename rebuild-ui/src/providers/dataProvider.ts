import type { DataProvider } from '@refinedev/core';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const url = `${API_URL}/${resource}`;

    const current = pagination?.currentPage ?? 1;
    const pageSize = pagination?.pageSize ?? 10;

    const query: Record<string, unknown> = {
      _start: (current - 1) * pageSize,
      _end: current * pageSize,
    };

    // Sorting
    if (sorters && sorters.length > 0) {
      query._sort = sorters.map((s) => s.field).join(',');
      query._order = sorters.map((s) => s.order).join(',');
    }

    // Filtering
    if (filters) {
      filters.forEach((filter) => {
        if ('field' in filter) {
          const { field, operator, value } = filter;
          if (operator === 'contains') {
            query[`${field}_like`] = value;
          } else if (operator === 'eq') {
            query[field] = value;
          } else {
            query[`${field}_${operator}`] = value;
          }
        }
      });
    }

    const { data, headers } = await axiosInstance.get(url, { params: query });
    const total = Number(headers['x-total-count'] || data.length);

    return {
      data,
      total,
    };
  },

  getOne: async ({ resource, id }) => {
    const url = `${API_URL}/${resource}/${id}`;
    const { data } = await axiosInstance.get(url);

    return { data };
  },

  create: async ({ resource, variables }) => {
    const url = `${API_URL}/${resource}`;
    const { data } = await axiosInstance.post(url, variables);

    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const url = `${API_URL}/${resource}/${id}`;
    const { data } = await axiosInstance.patch(url, variables);

    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const url = `${API_URL}/${resource}/${id}`;
    const { data } = await axiosInstance.delete(url);

    return { data };
  },

  getMany: async ({ resource, ids }) => {
    const { data } = await axiosInstance.get(`${API_URL}/${resource}`, {
      params: { id: ids },
    });

    return { data };
  },

  getApiUrl: () => API_URL,

  custom: async ({ url, method, payload, query, headers }) => {
    let requestUrl = `${API_URL}${url}`;

    if (query) {
      const queryString = new URLSearchParams(query as Record<string, string>).toString();
      requestUrl = `${requestUrl}?${queryString}`;
    }

    const { data } = await axiosInstance({
      url: requestUrl,
      method,
      data: payload,
      headers,
    });

    return { data };
  },
};

export { axiosInstance };
