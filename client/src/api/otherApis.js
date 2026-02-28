import { baseApi } from './baseApi.js';

export const categoryApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getCategories: build.query({
            query: () => '/categories',
            providesTags: ['Category'],
        }),
        createCategory: build.mutation({
            query: (body) => ({ url: '/categories', method: 'POST', body }),
            invalidatesTags: ['Category'],
        }),
        updateCategory: build.mutation({
            query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PUT', body }),
            invalidatesTags: ['Category'],
        }),
        deleteCategory: build.mutation({
            query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Category'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetCategoriesQuery, useCreateCategoryMutation,
    useUpdateCategoryMutation, useDeleteCategoryMutation,
} = categoryApi;

export const budgetApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getBudgets: build.query({
            query: (params = {}) => ({ url: '/budgets', params }),
            providesTags: ['Budget'],
        }),
        createBudget: build.mutation({
            query: (body) => ({ url: '/budgets', method: 'POST', body }),
            invalidatesTags: ['Budget'],
        }),
        updateBudget: build.mutation({
            query: ({ id, ...body }) => ({ url: `/budgets/${id}`, method: 'PUT', body }),
            invalidatesTags: ['Budget'],
        }),
        deleteBudget: build.mutation({
            query: (id) => ({ url: `/budgets/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Budget'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetBudgetsQuery, useCreateBudgetMutation,
    useUpdateBudgetMutation, useDeleteBudgetMutation,
} = budgetApi;

export const profileApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getProfile: build.query({
            query: () => '/profile',
            providesTags: ['Profile'],
        }),
        updateProfile: build.mutation({
            query: (formData) => ({
                url: '/profile',
                method: 'PUT',
                body: formData,
                prepareHeaders: (h) => { h.delete('Content-Type'); return h; },
            }),
            invalidatesTags: ['Profile'],
        }),
        changePassword: build.mutation({
            query: (body) => ({ url: '/profile/change-password', method: 'POST', body }),
        }),
        requestChangeEmail: build.mutation({
            query: (body) => ({ url: '/profile/request-change-email', method: 'POST', body }),
        }),
        changeEmail: build.mutation({
            query: (body) => ({ url: '/profile/change-email', method: 'POST', body }),
            invalidatesTags: ['Profile'],
        }),
        requestChangePhone: build.mutation({
            query: (body) => ({ url: '/profile/request-change-phone', method: 'POST', body }),
        }),
        changePhone: build.mutation({
            query: (body) => ({ url: '/profile/change-phone', method: 'POST', body }),
            invalidatesTags: ['Profile'],
        }),
        getDevices: build.query({
            query: () => '/profile/devices',
            providesTags: ['Profile'],
        }),
        removeDevice: build.mutation({
            query: (deviceId) => ({ url: `/profile/devices/${deviceId}`, method: 'DELETE' }),
            invalidatesTags: ['Profile'],
        }),
        deleteAccount: build.mutation({
            query: () => ({ url: '/profile', method: 'DELETE' }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation,
    useRequestChangeEmailMutation, useChangeEmailMutation,
    useRequestChangePhoneMutation, useChangePhoneMutation,
    useGetDevicesQuery, useRemoveDeviceMutation, useDeleteAccountMutation,
} = profileApi;
