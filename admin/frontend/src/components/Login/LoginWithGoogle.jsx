import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'
import { showNotification } from "@mantine/notifications";
import { setUser } from "../../store/auth/userSlice";
import { googleSignIn } from "../../services/AuthService";
import { onSignInSuccess, onSignOutSuccess, setLoggedInUser, setToken } from "../../store/auth/sessionSlice";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import appConfig from "../../configs/app.config";
import Cookies from 'js-cookie';
import { Box } from '@mantine/core';

const LoginWithGoogle = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse) => {
        const { credential } = credentialResponse;

        const result = await googleSignIn({ token: credential });

        if (!result || result.status !== 200 || result.code !== 'is_valid' || !result.token) {
            const errorMsg = result?.message || result?.error || 'Something went wrong';
            showNotification({
                title: 'Login Failed',
                message: errorMsg,
                color: 'red',
            });
            return;
        } else {
            const { token } = result;
            if (token) {
                dispatch(onSignInSuccess(token))
                dispatch(setToken(token))
                const decode_token = jwtDecode(token)
                if (decode_token.iss === appConfig.liveSiteUrl) {
                    const userData = decode_token.data;

                    const user = {
                        "authority": userData.roles,
                        "loggedUserId": userData.user_id,
                        "name": userData.name,
                        "email": userData.email,
                        "roles": userData.roles,
                        "llc_roles": userData.llc_roles,
                        "llc_permissions": userData.llc_permissions,
                        "avatar": userData.avatar
                    }
                    dispatch(setLoggedInUser(user || {}))
                    Cookies.set('user_id', userData.user_id);
                    dispatch(
                        setUser(
                            user || {
                                avatar: '',
                                loggedUserId: '',
                                name: '',
                                authority: [],
                                email: '',
                                roles: [],
                                llc_roles: [],
                                llc_permissions: [],
                            }
                        )
                    )
                    navigate(appConfig.authenticatedEntryPath)
                    return result
                }
            }
        }



    };

    const handleError = (error) => {
        console.error('Login failed:', error);
        showNotification({
            title: 'Login Failed',
            message: 'An error occurred during login. Please try again.',
            color: 'red',
            autoClose: 2000
        });
    };

    return (
        <>
            <Box
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%'
                }}
            >
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    text="continue_with"
                    className="custom-google-login"
                />
            </Box>
        </>
    );
};

export default LoginWithGoogle;
