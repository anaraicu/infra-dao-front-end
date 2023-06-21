import { FirebaseDatabaseProvider } from "@react-firebase/database";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CreateOrgDaoPage } from "./pages/CreateOrgDao";
import { LOCAL_STORAGE_KEY_THEME, LocalStorageValueTheme } from "./constants";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { firebaseConfig } from "./config";
import Organization from "./pages/Organization";
import Header from "./components/Header";
import React from "react";
import { DAppProvider } from "@usedapp/core";
import WalletAuthProvider from "./providers/wallet-connect-provider";
import { CreateSubDAOPage } from "./pages/CreateProjectDao";
import { CreateProposalOrgDao } from "./pages/CreateProposal";
import { LoadMembershipNFT } from "./pages/LoadMembershipNFT";
import { ProjectDAO } from "./pages/ProjectDAO";

const dappConfig = {
  notifications: {
    checkInterval: 500,
    expirationPeriod: 5000,
  },
  autoConnect: false,
  multicallAddresses: {
    31337: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
};

function App() {
  const setTheme = (themeName: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_THEME, themeName);
    document.documentElement.className = themeName;
  };

  (function () {
    if (
      localStorage.getItem(LOCAL_STORAGE_KEY_THEME) ===
      LocalStorageValueTheme.DARK
    ) {
      setTheme(LocalStorageValueTheme.DARK);
    } else {
      setTheme(LocalStorageValueTheme.LIGHT);
    }
  })();

  return (
    <FirebaseDatabaseProvider firebase={firebaseConfig}>
      <Layout>
        <DAppProvider config={dappConfig}>
          <WalletAuthProvider>
            <BrowserRouter>
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="create/" element={<CreateOrgDaoPage />} />
                <Route
                  path="organization/:deployed"
                  element={<Organization />}
                />
                <Route
                  path="organization/createProject/:deployed"
                  element={<CreateSubDAOPage />}
                />
                <Route
                  path="organization/propose/:deployed"
                  element={<CreateProposalOrgDao />}
                />
                <Route
                  path="organization/membershipNFT/:deployed"
                  element={<LoadMembershipNFT />}
                />
                <Route
                  path="organization/project/:deployed"
                  element={<ProjectDAO />}
                ></Route>
              </Routes>
            </BrowserRouter>
          </WalletAuthProvider>
        </DAppProvider>
      </Layout>
    </FirebaseDatabaseProvider>
  );
}

export default App;
