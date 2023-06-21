import { useForm } from "react-hook-form";
import { PrimaryButton } from "../components/Buttons";
import { useNavigate, useParams } from "react-router-dom";
import { INPUT_CLASSES } from "../actions";
import { ethers } from "ethers";
import { WalletConnectContext } from "../context";
import { QuestionMarkTooltip } from "../components/QuestionMarkTooltip";
import { SetStateAction, useContext, useState } from "react";
import BoxABI from "infra-dao/artifacts/contracts/Box.sol/Box.json";
import { initWeb3 } from "./CreateOrgDao";
import { Box } from "../../../infra-dao/typechain-types";

interface SubDAOFormFields {
  projectName: string;
  projectDescription: string;
  governanceType: string;
  votingPeriod: number;
  quorumPercentage: number;
  proposalThreshold: number;
  signers?: string[];
  requiredSignatures?: number;
}

export interface SubDAOContracts {
  daoFactory: string;
  governanceToken: string;
  membershipNFT: string;
  timeLock: string;
  organizationGovernance: string;
  box: string;
  id: number;
  projectId?: number;
  projectGovernance?: string;
  projectGovernanceType?: string;
  creator?: string;
}

const deployProjectDAO = async ({
  signer,
  data,
  contracts,
}: {
  signer: ethers.providers.JsonRpcSigner;
  data: SubDAOFormFields;
  contracts: SubDAOContracts;
}) => {
  console.log("Deploying new project DAO...");

  const box = new ethers.Contract(contracts.box, BoxABI.abi, signer) as Box;
  console.log(data);

  const deployTx = await box.deploySubDAO(
    ethers.utils.formatBytes32String(data.governanceType),
    ethers.utils.formatBytes32String(data.projectName),
    data.projectDescription,
    contracts.governanceToken,
    contracts.membershipNFT,
    data.votingPeriod,
    data.quorumPercentage
  );
  const receipt = await deployTx.wait();
  const res = receipt.events?.find(
    (event) => event.event === "SubDAOAdded"
  )?.args;
  contracts.projectGovernance = res?.subDAOAddress;
  contracts.projectGovernanceType = ethers.utils.parseBytes32String(
    res?.subDAOId
  );
  contracts.creator = signer._address;
  const count = await box.getSubDAOCount();
  contracts.projectId = count.toNumber() - 1;
  console.log(contracts);
  return contracts;
};

export const CreateSubDAOPage = () => {
  const params = useParams();
  const addresses = JSON.parse(decodeURIComponent(params!.deployed!));
  const [subDAOContracts, setSubDAOContracts] =
    useState<SubDAOContracts>(addresses);
  const [selectedGovernanceType, setSelectedGovernanceType] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SubDAOFormFields>();
  const { account } = useContext(WalletConnectContext);
  const navigate = useNavigate();

  const handleGovernanceTypeChange = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setSelectedGovernanceType(event.target.value);
  };

  const onSubmit = async (data: any) => {
    console.log(data);
    console.log(formValues); // watch input value by passing the name of it
    if (account) {
      const { signer, network, provider } = await initWeb3(account);
      const projectDaoContracts = await deployProjectDAO({
        signer,
        data,
        contracts: subDAOContracts,
      });
      setSubDAOContracts(projectDaoContracts);
      if (subDAOContracts) {
        const jsonDeployed = JSON.stringify(subDAOContracts);
        navigate(`/organization/project/${encodeURIComponent(jsonDeployed)}`);
      }

      // Execute deployDAO when the component mounts
      // // const daoContracts = await deployOrgDAO({ signer, data });
      // if (daoContracts) {
      //   const jsonDeployed = JSON.stringify(daoContracts);
      //   navigate(`/organization/${encodeURIComponent(jsonDeployed)}`);
      //   const setMembershipNFT = async () => {};
      //   await setMembershipNFT();
      // }
    }
  };

  const formValues = watch();

  return (
    <>
      <div className="m-20">
        <div className="flex gap-4 border-b-2 pb-6">
          <h1 className="text-body-lg md:text-display-sm font-bold text-gray-900 dark:text-gray-50">
            Create Project DAO
          </h1>

          {/* <div className='bg-red-200 rounded-lg p-2'>
            You need to vote on at least 3 proposals to be able to propose.
            [proposal threshold]
          </div> */}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
          <div className="flex gap-4">
            <label
              htmlFor="projectName"
              className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
            >
              Name your subDAO project
            </label>
            <input
              type="text"
              id="projectName"
              placeholder="Name your project (must be between 5-20 characters long)"
              className={INPUT_CLASSES}
              {...register("projectName", {
                required: true,
                maxLength: 20,
                minLength: 5,
              })}
              defaultValue={"eWater pipes"}
            />
            {errors.projectName && (
              <span className="text-body-sm text-red-500">
                This field is required. Must be between 8-20 characters long.
              </span>
            )}
          </div>
          <div className="flex gap-4 mt-8">
            <label
              htmlFor="projectName"
              className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
            >
              Describe your subDAO project
            </label>
            <input
              type="text"
              id="projectName"
              placeholder="Describe the aim of the project (must be between 5-255 characters long)"
              className={INPUT_CLASSES}
              {...register("projectDescription", {
                required: true,
                maxLength: 255,
                minLength: 5,
              })}
              defaultValue={"Pipe funding in South East Ghana"}
            />
            {errors.projectDescription && (
              <span className="text-body-sm text-red-500">
                This field is required. Must be between 8-20 characters long.
              </span>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <label
              htmlFor="governanceType"
              className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
            >
              Governance type
            </label>
            <select
              className={INPUT_CLASSES}
              {...register("governanceType", {
                required: true,
              })}
              name="governanceType"
              defaultValue={selectedGovernanceType}
              onChange={handleGovernanceTypeChange}
            >
              <option value="tokenBased">
                Token Based Governance (Vote Weight = Voting power)
              </option>
              <option value="weighted">
                Weighted Governance (Vote Weight = nGOV * fee)
              </option>
              <option value="quadratic">
                Quadratic Governance (Vote Weight = Squared nGOV * fee)
              </option>
              <option value="multiSig">
                MultiSig Governance (Vote Weight: 1 Address = 1 VP, signers
                required)
              </option>
            </select>
            {errors.governanceType && (
              <span className="text-body-sm text-red-500">
                This field is required.
              </span>
            )}
          </div>
          {selectedGovernanceType === "multiSig" && (
            <div>
              <div className="flex gap-4 mt-4">
                <label
                  htmlFor="multiSigField"
                  className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
                >
                  <QuestionMarkTooltip
                    text={
                      "Number of signatures required for a proposal to pass"
                    }
                  >
                    Required signatures*
                  </QuestionMarkTooltip>
                </label>
                <input
                  {...register("requiredSignatures", { required: true })}
                  placeholder="e.g. 7200 (1 day)"
                  type="number"
                  className={INPUT_CLASSES}
                  defaultValue={"5"} // 2 minutes
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.requiredSignatures && (
                    <span>
                      Entering the number of required signatures is required
                    </span>
                  )}
                </div>
                {/* Render the additional field component here */}
              </div>
              <div className="flex gap-4 mt-4">
                <label
                  htmlFor="multiSigField"
                  className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
                >
                  <QuestionMarkTooltip
                    text={"Addresses of signers: a.k.a. members of proposal"}
                  >
                    Add signers addresses*
                  </QuestionMarkTooltip>
                </label>
                <input
                  {...register("signers", { required: true })}
                  placeholder="0xcf5***66"
                  className={INPUT_CLASSES}
                  defaultValue={"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"} // 2 minutes
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.signers && (
                    <span>
                      Entering the number of required signatures is required
                    </span>
                  )}
                </div>
                {/* Render the additional field component here */}
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80">
              <QuestionMarkTooltip
                text="Voting period is measured in blocks. Give the number
                  of blocks you want a proposal to live for."
              >
                Voting period (1 block = 12 seconds) *
              </QuestionMarkTooltip>
            </span>
            <input
              {...register("votingPeriod", { required: true })}
              placeholder="e.g. 7200 (1 day)"
              type="number"
              className={INPUT_CLASSES}
              defaultValue={"10"} // 2 minutes
            />
            <div className="text-red-500 font-medium text-body-sm">
              {errors.votingPeriod && (
                <span>The voting period is required</span>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80">
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
    </>
  );
};
