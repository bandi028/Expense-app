import { baseApi } from './baseApi.js';

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        register: build.mutation({
            query: (body) => ({ url: '/auth/register', method: 'POST', body }),
        }),
        sendOtp: build.mutation({
            query: (body) => ({ url: '/auth/send-otp', method: 'POST', body }),
        }),
        verifyOtp: build.mutation({
            query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
        }),
        login: build.mutation({
            query: (body) => ({ url: '/auth/login', method: 'POST', body }),
        }),
        logout: build.mutation({
            query: () => ({ url: '/auth/logout', method: 'POST' }),
        }),
        forgotPassword: build.mutation({
            query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
        }),
        resetPassword: build.mutation({
            query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
        }),
        getMe: build.query({
            query: () => '/auth/me',
            providesTags: ['Profile'],
        }),
        refreshToken: build.mutation({
            query: () => ({ url: '/auth/refresh', method: 'POST' }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useRegisterMutation, useSendOtpMutation, useVerifyOtpMutation,
    useLoginMutation, useLogoutMutation, useForgotPasswordMutation,
    useResetPasswordMutation, useGetMeQuery, useRefreshTokenMutation,
} = authApi;
