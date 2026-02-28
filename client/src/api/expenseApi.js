import { baseApi } from './baseApi.js';

export const expenseApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getExpenses: build.query({
            query: (params = {}) => ({ url: '/expenses', params }),
            providesTags: ['Expense'],
        }),
        createExpense: build.mutation({
            query: (body) => ({ url: '/expenses', method: 'POST', body }),
            invalidatesTags: ['Expense', 'Summary', 'Trend'],
        }),
        updateExpense: build.mutation({
            query: ({ id, ...body }) => ({ url: `/expenses/${id}`, method: 'PUT', body }),
            invalidatesTags: ['Expense', 'Summary', 'Trend'],
        }),
        deleteExpense: build.mutation({
            query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Expense', 'Summary', 'Trend'],
        }),
        restoreExpense: build.mutation({
            query: (id) => ({ url: `/expenses/restore/${id}`, method: 'POST' }),
            invalidatesTags: ['Expense', 'Summary', 'Trend'],
        }),
        bulkDeleteExpenses: build.mutation({
            query: (ids) => ({ url: '/expenses/bulk-delete', method: 'DELETE', body: { ids } }),
            invalidatesTags: ['Expense', 'Summary', 'Trend'],
        }),
        uploadReceipt: build.mutation({
            query: (formData) => ({
                url: '/expenses/upload-receipt',
                method: 'POST',
                body: formData,
                prepareHeaders: (headers) => { headers.delete('Content-Type'); return headers; },
            }),
        }),
        getSummary: build.query({
            query: (params = {}) => ({ url: '/expenses/summary', params }),
            providesTags: ['Summary'],
        }),
        getTrend: build.query({
            query: (params = {}) => ({ url: '/expenses/trend', params }),
            providesTags: ['Trend'],
        }),
        getByCategory: build.query({
            query: (params = {}) => ({ url: '/expenses/by-category', params }),
            providesTags: ['Trend'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation,
    useDeleteExpenseMutation, useRestoreExpenseMutation, useBulkDeleteExpensesMutation,
    useUploadReceiptMutation, useGetSummaryQuery, useGetTrendQuery, useGetByCategoryQuery,
} = expenseApi;
