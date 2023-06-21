import { useForm } from "react-hook-form";
import { PrimaryButton } from "../components/Buttons";
import { useNavigate } from "react-router-dom";
import { INPUT_CLASSES } from "../actions";
import orgCardImage from "../assets/images/org-card-bg.png";
import { useContext, useEffect, useState } from "react";
import DAOFactoryABI from "infra-dao/artifacts/contracts/DAOFactory.sol/DAOFactory.json";
import BoxABI from "infra-dao/artifacts/contracts/Box.sol/Box.json";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { Box, DAOFactory } from "../../../infra-dao/typechain-types";
import addresses from "infra-dao/deployments.json";
import { WalletConnectContext } from "../context";
import web3 from "web3";
import { QuestionMarkTooltip } from "../components/QuestionMarkTooltip";

interface FormFields {
  orgName: string;
  orgDescription: string;
  governanceType: string;
  membershipNFTuri: string;
  votingPeriod: number;
  membershipNFTSupply: number;
  quorumPercentage: number;
  proposalThreshold: number;
}

export interface DAOContracts {
  daoFactory: string;
  governanceToken: string;
  membershipNFT: string;
  timeLock: string;
  organizationGovernance: string;
  box: string;
  id: number;
}

export const initWeb3 = async (account: string | null) => {
  const web3Modal = new Web3Modal({
    network: "http://localhost:8545", // Set your desired network
    cacheProvider: true,
    providerOptions: {},
  });

  const web3Provider = await web3Modal.connect();
  const ethersProvider = new ethers.providers.Web3Provider(web3Provider);
  const signer = ethersProvider.getSigner(account!.toString());
  console.log({ signer });
  const network = await ethersProvider!.getNetwork();
  return { network, signer, provider: ethersProvider };
};

const useDeployOrgDAO = (account: string | null) => {
  // Call the deployDAO function with the provided parameters
  const deployOrgDAO = async ({
    signer,
    data,
  }: {
    signer: ethers.providers.JsonRpcSigner;
    data: FormFields;
  }) => {
    console.log("Deploying DAO...");
    console.log("Account>>>", account);
    const daoFactoryContract = new ethers.Contract(
      addresses.daoFactory,
      DAOFactoryABI.abi,
      signer
    ) as DAOFactory;
    console.log(addresses.daoFactory);
    try {
      console.log("Signer: ", signer);
      const tx = await daoFactoryContract
        .connect(signer)
        .deployDAO(
          ethers.utils.formatBytes32String(data.orgName),
          data.orgDescription,
          data.membershipNFTuri,
          data.membershipNFTSupply,
          data.votingPeriod,
          data.quorumPercentage
        );

      const receipt = await tx.wait();
      const res = receipt.events!;
      let contracts: any = {};
      contracts["daoFactory"] = addresses.daoFactory;
      for (let i = 0; i < res.length - 1; i++) {
        if (res[i].event !== "ClonedContractDeployed") continue;
        const contractType = web3.utils.hexToAscii(res[i].args!.contractType);
        // eslint-disable-next-line no-control-regex
        const type = contractType.replace(/\u0000+$/, "");
        console.log(
          `New OrgDao ${type} deployed to:`,
          res[i]!.args!.deployedAddress
        );
        contracts[type] = res[i]!.args!.deployedAddress;
      }
      console.log("Contracts: ", contracts);
      const daoContracts = contracts as DAOContracts;
      const count = await daoFactoryContract.getDAOCount();
      contracts["id"] = count.toNumber() - 1;
      console.log("DAO Count: ", count.toNumber());
      console.log("DAO Contracts >>>", daoContracts);
      console.log("DAO deployed successfully!");
      return daoContracts;
    } catch (error) {
      console.error("Error deploying DAO:", error);
    }
  };

  const registerAllGovernanceTypes = async ({
    signer,
    daoContracts,
  }: {
    signer: ethers.providers.JsonRpcSigner;
    daoContracts: DAOContracts;
  }) => {
    const box = new ethers.Contract(
      daoContracts.box,
      BoxABI.abi,
      signer
    ) as Box;

    const registerTx = await box
      .connect(signer)
      .registerSubDAOImplementations(
        addresses.tokenBased,
        addresses.weighted,
        addresses.quadratic,
        addresses.multiSig
      );
    const registerReceipt = await registerTx.wait();
    console.log("Register Receipt: ", registerReceipt);
  };

  return { deployOrgDAO, registerAllGovernanceTypes };
};

export const CreateOrgDaoPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormFields>();
  const { account } = useContext(WalletConnectContext);
  const { deployOrgDAO, registerAllGovernanceTypes } = useDeployOrgDAO(account);
  // Database navigation
  // const navigate = useNavigate();
  // const db = getFirestore();
  const navigate = useNavigate();
  const [popupVisible, setPopupVisible] = useState(false);
  const [daoContracts, setDaoContracts] = useState<DAOContracts>(
    {} as DAOContracts
  );
  const [registerGovernance, setRegisterGovernance] = useState(false);
  const handleRegister = async () => {
    if (account && daoContracts) {
      const { signer } = await initWeb3(account);
      await registerAllGovernanceTypes({ signer, daoContracts });
      // Additional logic after registering DAOs
      setRegisterGovernance(true);
    }
  };

  const onSubmit = async (data: any) => {
    console.log(data);
    console.log(formValues); // watch input value by passing the name of it

    /* TODO: 1. Add organization details to blockchain (contract)
     * - If deployment fails, don't add the organization to firebase
     * - If deployment succeeds, add the organization to firebase using the contract address as the document id
     */

    /* TODO: 2. Add organization details to firebase */
    // try {
    //   const docRef = await addDoc(collection(db, "organizations"), data);
    //   console.log("Document written with ID: ", docRef.id);
    // } catch (e) {
    //   console.error("Error adding document: ", e);
    // }

    if (account) {
      // const { signer, network, provider } = await initWeb3(account);
      const { signer } = await initWeb3(account);
      // Execute deployDAO when the component mounts
      const daoContractsReceipt = await deployOrgDAO({ signer, data });
      if (daoContractsReceipt) {
        setDaoContracts(daoContractsReceipt);
        setPopupVisible(true);
        console.log("DAO Contracts >>>", daoContracts);
        console.log("POPUP VISIBLE >>>", popupVisible);
        // await registerAllGovernanceTypes({ signer, daoContracts });
      }
    }
  };

  useEffect(() => {
    if (registerGovernance) {
      const jsonDeployed = JSON.stringify(daoContracts);
      navigate(`/organization/${encodeURIComponent(jsonDeployed)}`);
    }
  }, [registerGovernance]);

  const formValues = watch(); // watch input value by passing the name of it

  return (
    <>
      <div className="container grid grid-cols-6 lg:grid-cols-12 gap-8 py-12 lg:py-16 ">
        {/* LEFT SIDE - FORM */}
        <div className="col-span-6 lg:col-span-7 flex flex-col gap-16 xl:gap-32 w-full">
          <h1 className="text-display-sm md:text-display-lg font-semibold text-gray-900 dark:text-gray-50">
            Create Organization DAO
          </h1>
          {/* /* "handleSubmit" will validate your inputs before invoking "onSubmit" */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-6 md:gap-8">
              {/* register your input into the hook by invoking the "register" function */}
              <span className="flex flex-col gap-2">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50">
                  <QuestionMarkTooltip text="Name of the main organization">
                    Organization Name *
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("orgName", { required: true })}
                  placeholder="e.g. MY DAO"
                  className={INPUT_CLASSES}
                  defaultValue={"eWater"}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {/* errors will return when field validation fails  */}
                  {errors.orgName && <span>The org. name is required</span>}
                </div>
              </span>

              {/* include validation with required or other standard HTML validation rules */}
              <span className="flex flex-col gap-2">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50">
                  <QuestionMarkTooltip text="Provide a good description of the mission of your organization">
                    Organisation Description *
                  </QuestionMarkTooltip>
                </span>
                <textarea
                  {...register("orgDescription", { required: true })}
                  placeholder="e.g. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  className={INPUT_CLASSES}
                  defaultValue={
                    "eWater is a private water operator that aims to solve the water crisis in sub-Saharan Africa. The company proposes a sustainable solution for making water accessible and reliable."
                  }
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.orgDescription && (
                    <span>The org. description is required</span>
                  )}
                </div>
              </span>

              <span className="flex flex-col gap-2">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50">
                  <QuestionMarkTooltip text="Provide the URI of the NFT metadata your users will need to access the DAO">
                    Membership NFT URI *
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("membershipNFTuri", { required: true })}
                  placeholder="e.g. https://<CID>.ipfs.nftstorage.link/"
                  className={INPUT_CLASSES}
                  defaultValue={
                    "https://bafkreigguxuphkzs7qis7y2oxn3wzwq7w3ipfoojryy52he4rq2xhy6bk4.ipfs.nftstorage.link/"
                  }
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.membershipNFTuri && <span>The URI is required</span>}
                </div>
              </span>

              <span className="flex flex-col gap-2">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50">
                  <QuestionMarkTooltip text="We'll batch mint some NFTs for the the first members of the DAO">
                    Membership NFT Initial Supply *
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("membershipNFTSupply", { required: true })}
                  placeholder="e.g. 100 (members)"
                  type="number"
                  className={INPUT_CLASSES}
                  defaultValue={"1"}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.membershipNFTSupply && (
                    <span>The Membership NFT (Initial Supply) is required</span>
                  )}
                </div>
              </span>

              <span className="flex flex-col gap-2">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50">
                  <QuestionMarkTooltip
                    text="Voting period is measured in blocks. Give the number
                  of blocks you want a proposal to live for."
                  >
                    Voting Period (1 block = 12 seconds) *
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("votingPeriod", { required: true })}
                  placeholder="e.g. 7200 (1 day)"
                  type="number"
                  className={INPUT_CLASSES}
                  defaultValue={"3"} // 2 minutes
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.votingPeriod && (
                    <span>The voting period is required</span>
                  )}
                </div>
              </span>

              <span className="flex flex-col gap-2">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50">
                  <QuestionMarkTooltip text="Quorum gives the proportion of participants over members needed for a proposal outcome to be considered.">
                    Quorum Percentage *
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("quorumPercentage", { required: true })}
                  placeholder="e.g. 25 (0.25)"
                  type="number"
                  className={INPUT_CLASSES}
                  defaultValue={"4"}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.quorumPercentage && (
                    <span>The quorum percentage is required</span>
                  )}
                </div>
              </span>

              <span className="flex flex-col gap-2">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50">
                  <QuestionMarkTooltip text="A user needs <threshold> casted votes to be able to propose. Starts at 0.">
                    Proposal Threshold
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("proposalThreshold", { required: false })}
                  type="number"
                  className={INPUT_CLASSES}
                  disabled={true}
                  defaultValue={0}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.proposalThreshold && (
                    <span>The proposal threshold is required</span>
                  )}
                </div>
              </span>
            </div>
            <div className="flex items-center gap-2 justify-between mt-10">
              <PrimaryButton
                type="button"
                variant="SECONDARY"
                onClick={() => window.history.go(-1)}
              >
                Back
              </PrimaryButton>
              <PrimaryButton type="submit">Submit</PrimaryButton>
            </div>
          </form>
        </div>

        {/* RIGHT SIDE - CARD */}
        <div className="col-span-6 lg:col-start-9 lg:col-span-4">
          <div className="relative rounded-3xl overflow-hidden [transform:translateZ(0px)]">
            <div className="relative flex">
              <div className="aspect-[3/4] w-full overflow-hidden transition ease-out group-hover/series:scale-105 group-hover/series:origin-center">
                <img
                  src={orgCardImage}
                  alt="Organization card"
                  className="rounded-2xl"
                />
              </div>

              <div className="absolute inset-0 bg-black/60"></div>

              <div className="absolute bottom-8 left-4 right-4">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-display-xs md:text-display-sm text-white truncate">
                    {watch("orgName")}
                  </span>
                  <span className="font-semibold text-body-md md:text-body-lg text-white truncate">
                    {watch("orgDescription")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {popupVisible && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-8 border border-gray-500 rounded-2xl shadow-md">
            <div className="text-body-lg font-medium text-gray-900 dark:text-gray-50 text-center">
              DAO Contracts Deployed!
              <br />
              Now the sub-governance modules need to be deployed.
              <br />
              <p className="mt-4 font-light">
                We'll add the following governance implementations to your DAO:
                Token Based, Weighted, Quadratic, Multi-Signature
              </p>
            </div>

            <div className="flex items-center gap-2 justify-center mt-10">
              <PrimaryButton
                type="button"
                variant="PRIMARY"
                onClick={handleRegister}
              >
                Register sub-governance modules
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
