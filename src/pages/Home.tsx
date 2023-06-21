import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { PrimaryButton } from "../components/Buttons";
import { DAOContracts, initWeb3 } from "./CreateOrgDao";
import { WalletConnectContext } from "../context";
import addresses from "infra-dao/deployments.json";
import { ethers } from "ethers";
import DAOFactoryABI from "infra-dao/artifacts/contracts/DAOFactory.sol/DAOFactory.json";
import OrganizationGovernanceABI from "infra-dao/artifacts/contracts/governance/OrganizationGovernance.sol/OrganizationGovernance.json";
import MembershipNFTABI from "infra-dao/artifacts/contracts/MembershipNFT.sol/MembershipNFT.json";
import {
  DAOFactory,
  MembershipNFT,
  OrganizationGovernance,
} from "infra-dao/typechain-types";
import { DAOData } from "./Organization";
import web3 from "web3";
import { DAOCard } from "../components/Cards";

interface DAO {
  daoContracts: DAOContracts;
  data: DAOData;
}

const getDAOs = async (
  account: any,
  signer: ethers.providers.JsonRpcSigner,
  provider: ethers.providers.Web3Provider
) => {
  const daoFactoryContract = new ethers.Contract(
    addresses.daoFactory,
    DAOFactoryABI.abi,
    signer
  ) as DAOFactory;
  console.log(addresses.daoFactory);

  const daoCount = await daoFactoryContract.getDAOCount();
  console.log(daoCount.toNumber());
  const daoAllData: DAO[] = [];
  for (let i = 0; i < daoCount.toNumber(); i++) {
    const deployedDAO = await daoFactoryContract.getDAO(i);
    let dao: DAO = {} as DAO;
    dao.daoContracts = {
      daoFactory: addresses.daoFactory,
      governanceToken: deployedDAO.governanceToken,
      membershipNFT: deployedDAO.membershipNFT,
      timeLock: deployedDAO.timeLock,
      organizationGovernance: deployedDAO.organizationGovernance,
      box: deployedDAO.box,
      id: i,
    };

    const organizationGovernanceContract = new ethers.Contract(
      deployedDAO.organizationGovernance,
      OrganizationGovernanceABI.abi,
      signer
    ) as OrganizationGovernance;

    const membershipNFT = new ethers.Contract(
      deployedDAO.membershipNFT,
      MembershipNFTABI.abi,
      signer
    ) as MembershipNFT;

    dao.data = {
      name: ethers.utils.parseBytes32String(deployedDAO.name),
      description: web3.utils.hexToUtf8(deployedDAO.description),
      votingPeriod: (
        await organizationGovernanceContract.votingPeriod()
      ).toNumber(),
      quorumPercentage: (
        await organizationGovernanceContract["quorumNumerator()"]()
      ).toNumber(),
      proposalThreshold: (
        await organizationGovernanceContract.proposalThreshold()
      ).toNumber(),
      membershipNFTURI: await membershipNFT.getURI(),
      mints: (await membershipNFT.totalSupply()).toString(),
      subDAOs: [],
      proposals: [],
    };
    daoAllData.push(dao);
  }
  return daoAllData;
};

function Home() {
  const { account } = useContext(WalletConnectContext);
  const [daoAllData, setDaoAllData] = React.useState<DAO[] | null>([]);
  const fetchDaoData = async () => {
    if (account) {
      const { network, signer, provider } = await initWeb3(account);
      console.log({ network });
      const daos = await getDAOs(account, signer, provider);
      console.log(daos);
      if (daos!.length > 0) {
        setDaoAllData(daos);
      }
    }
  };

  useEffect(() => {
    if (account) {
      fetchDaoData().then((r) => console.log(r));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  return (
    <div>
      <div className="bg-black">
        <div className="bg-rectangles-dark bg-top bg-no-repeat h-full">
          <div className="bg-spotlight-smoke bg-center bg-no-repeat h-full pt-28 md:pt-48 pb-16 md:pb-48">
            <div className="container flex flex-col items-center text-center gap-16 xl:gap-32 w-full">
              <h1 className="text-display-lg md:text-display-2xl font-semibold text-gray-50">
                Welcome to InfraDAO
              </h1>
              <span className="w-fit">
                <PrimaryButton type="button" variant="PRIMARY" size="lg">
                  <Link to={"/create"}>
                    <span className="text-body-lg">
                      Create a DAO for your organization now
                    </span>
                  </Link>
                </PrimaryButton>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-12 lg:py-16 flex flex-col items-center gap-10 text-center">
        <h1 className="text-display-lg md:text-display-xl font-semibold text-gray-900 dark:text-gray-50">
          Active DAOs
        </h1>
        <div className="w-full grid gap-4 md:gap-8 h-fit grid-cols-[repeat(auto-fill,_minmax(340px,_1fr))] md:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] lg:grid-cols-[repeat(auto-fill,_minmax(384px,_1fr))]">
          {!daoAllData || daoAllData === [] ? (
            <div className="flex flex-col gap-8 items-center text-center">
              <div className="text-body-lg text-gray-900 dark:text-gray-50">
                There are no DAOs created on this platform yet. Create one now!
              </div>

              <PrimaryButton type="button" variant="PRIMARY" size="lg">
                <Link to={"/create"}>
                  <span className="text-body-lg">Create a DAO</span>
                </Link>
              </PrimaryButton>
            </div>
          ) : (
            daoAllData?.map((dao, index) => (
              <DAOCard daoData={dao.data} daoContracts={dao.daoContracts} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
