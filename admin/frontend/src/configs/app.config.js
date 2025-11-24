const appConfig = {
    apiPrefix: '/api',
    authenticatedEntryPath: '/dashboard',
    unAuthenticatedEntryPath: '/lazy-login',
    tourPath: '/',
    locale: 'en',
    enableMock: false,
    liveApiUrl: `${appLocalizer?.apiUrl}/lazytasks/api/v1`,
    liveSiteUrl: `${appLocalizer?.homeUrl}`,
}

export default appConfig
