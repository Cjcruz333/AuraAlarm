import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { biometricService } from '../services/biometricService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    setIsBiometricSupported(biometricService.isAvailable());
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (api.token) {
        const res = await api.getMe();
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Session restoration failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setUser(res.user);
    return res;
  };

  const register = async (data) => {
    const res = await api.register(data);
    setUser(res.user);
    return res;
  };

  const loginBiometric = async () => {
    const cred = await biometricService.authenticateBiometric();
    const res = await api.biometricLogin(cred.credentialId);
    setUser(res.user);
    return res;
  };

  const enrollBiometrics = async () => {
    const res = await biometricService.registerBiometric(user?.username, user?.email);
    const serverRes = await api.enrollBiometric(res.credentialId, res.authenticatorName);
    setUser(serverRes.user);
    return serverRes;
  };

  const updateLovedOne = async (lovedOneData) => {
    const res = await api.updateLovedOne(lovedOneData);
    setUser(prev => ({ ...prev, lovedOne: res.lovedOne }));
    return res;
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isBiometricSupported,
        login,
        register,
        loginBiometric,
        enrollBiometrics,
        updateLovedOne,
        logout,
        refreshUser: loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
