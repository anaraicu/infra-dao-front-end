import React, { Fragment, useContext, useEffect, useMemo } from "react";
import BeatLoader from "./beat-loader";
import { getButtonClassNames, PrimaryButton } from "./Buttons";
import { WalletConnectContext } from "../context";
import { Menu, Transition } from "@headlessui/react";
import ObscureAddress from "./ObscureAddress";

const LoginWallet = () => {
  const {
    account,
    active,
    activateProvider,
    activateBrowserWallet,
    error,
    loading,
    deactivate,
  } = useContext(WalletConnectContext);

  useEffect(() => {
    if (!active && !error) {
      activateProvider();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contents = useMemo(() => {
    if (account) {
      return (
        <div className="flex flex-col items-center justify-center">
          <Menu as="span" className="-ml-px relative block">
            {({ open }) => (
              <>
                <Menu.Button className={getButtonClassNames()} ref={null}>
                  Options
                </Menu.Button>
                <Transition
                  show={open}
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items
                    static
                    className="origin-top-right shadow-2xl p-8 rounded-3xl w-[358px] flex flex-col gap-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-transparent absolute right-0 z-[9999]"
                  >
                    <Menu.Item>
                      <ObscureAddress text={account} />
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <PrimaryButton onClick={deactivate}>
                          Disconnect Wallet
                        </PrimaryButton>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </>
            )}
          </Menu>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-4 flex-wrap w-fit absolute -translate-y-1/2 left-1/2 top-1/2">
          <p className="text-xl font-bold text-purple-700 my-4 text-center">
            Please open metamask to connect your wallet
          </p>
          <BeatLoader />
        </div>
      );
    }

    const activate = async () => {
      await activateBrowserWallet();
    };

    return (
      <div className="flex flex-col items-center justify-center">
        <PrimaryButton onClick={activate}>Sign in</PrimaryButton>
        {/*<p>*/}
        {/*  NOTE: If you want to experience a first time user experience, open*/}
        {/*  metamask and disconnect your wallet(s) from localhost:3000*/}
        {/*</p>*/}
      </div>
    );
  }, [account, loading, deactivate, activateBrowserWallet]);

  return (
    // <div className='min-h-screen flex items-center justify-start w-full'>
    <div>{contents}</div>
    // </div>
  );
};

export default LoginWallet;
