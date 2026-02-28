import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    isAuthenticated: false,
    otpPending: false,
    otpTarget: null,
    otpType: null,
    otpPurpose: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser(state, action) {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        setOtpPending(state, action) {
            state.otpPending = true;
            state.otpTarget = action.payload.identifier;
            state.otpType = action.payload.type;
            state.otpPurpose = action.payload.purpose || 'login';
        },
        clearOtpPending(state) {
            state.otpPending = false;
            state.otpTarget = null;
            state.otpType = null;
            state.otpPurpose = null;
        },
        logout(state) {
            state.user = null;
            state.isAuthenticated = false;
            state.otpPending = false;
            state.otpTarget = null;
        },
    },
});

export const { setUser, setOtpPending, clearOtpPending, logout } = authSlice.actions;
export default authSlice.reducer;
