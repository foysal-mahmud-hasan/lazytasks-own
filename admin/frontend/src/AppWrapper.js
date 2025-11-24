import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useSelector } from 'react-redux';

const AppWrapper = () => {
  const { socialLoginConfiguration } = useSelector((state) => state.settings.setting);
  const clientId = socialLoginConfiguration && socialLoginConfiguration.social_login_enabled && socialLoginConfiguration.google && socialLoginConfiguration.google.client_id || null;
  return (
    <>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </>
  );
};

export default AppWrapper;
