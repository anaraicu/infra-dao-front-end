import { useForm } from "react-hook-form";
import { PrimaryButton } from "../components/Buttons";
import { useNavigate, useParams } from "react-router-dom";
import { INPUT_CLASSES } from "../actions";
import { ethers } from "ethers";
import { WalletConnectContext } from "../context";
import { SetStateAction, useContext, useEffect, useState } from "react";
import { QuestionMarkTooltip } from "../components/QuestionMarkTooltip";
import OrganizationGovernanceABI from "infra-dao/artifacts/contracts/governance/OrganizationGovernance.sol/OrganizationGovernance.json";
import BoxABI from "infra-dao/artifacts/contracts/Box.sol/Box.json";
import {
  Box,
  OrganizationGovernance,
} from "../../../infra-dao/typechain-types";
import { initWeb3 } from "./CreateOrgDao";
import { SubDAOContracts } from "./CreateProjectDao";
import { getGovernance } from "../components/ProposalCardSubDAO";

interface DAOContracts {
  daoFactory: string;
  governanceToken: string;
  membershipNFT: string;
  timeLock: string;
  organizationGovernance: string;
  box: string;
  id: number;
  govType: string;
  proposerAddress: string; // Comes from the account of the user
}

interface FormFields {
  proposalDescription: string;
  target?: string;
  governanceType?: string;
  projectName?: string;
  projectDescription?: string;
  votingPeriod?: number;
  quorumPercentage?: number;
  proposalThreshold?: number;
  storeValue?: number;
  amount?: number;
  account?: string;
}

function getProposingGovernance(
  signer: ethers.providers.JsonRpcSigner,
  daoContracts: DAOContracts | SubDAOContracts
) {
  let governance: ethers.Contract;
  console.log("Getting proposing governance for: ", daoContracts);

  if (!("projectGovernance" in daoContracts)) {
    const { organizationGovernance } = daoContracts;
    governance = new ethers.Contract(
      organizationGovernance!,
      OrganizationGovernanceABI.abi,
      signer
    ) as OrganizationGovernance;
  } else {
    governance = getGovernance(signer, daoContracts as SubDAOContracts);
  }
  return governance;
}

const submitProposal = async ({
  daoContracts,
  signer,
  data,
  network,
}: {
  daoContracts: DAOContracts | SubDAOContracts;
  data: FormFields;
  signer: ethers.providers.JsonRpcSigner;
  network: ethers.providers.Network;
}) => {
  const governance = getProposingGovernance(signer, daoContracts);

  const box = new ethers.Contract(daoContracts.box, BoxABI.abi, signer) as Box;

  let encodedFunctionToCall: any;
  let proposeTx: any;
  let proposeReceipt: any;

  if (data.target === "store") {
    const encodeFunctionCall = box.interface.encodeFunctionData(data.target, [
      data.storeValue!,
    ]);
    proposeTx = await governance.proposeWithTarget(
      [box.address],
      [0],
      [encodeFunctionCall],
      data.proposalDescription,
      ethers.utils.formatBytes32String(data.target!)
    );
    proposeReceipt = await proposeTx.wait();
  } else if (data.target === "withdraw") {
    const amountBigNumber = ethers.BigNumber.from(data.amount!);

    const encodeFunctionCall = governance.interface.encodeFunctionData(
      data.target,
      [amountBigNumber, data.account!] // Amount and account
    );
    proposeTx = await governance.proposeWithTarget(
      [governance.address],
      [0],
      [encodeFunctionCall],
      data.proposalDescription,
      ethers.utils.formatBytes32String(data.target!)
    );
    proposeReceipt = await proposeTx.wait();
  } else if (data.target === "deploySubDAO") {
    encodedFunctionToCall = box.interface.encodeFunctionData(data.target, [
      ethers.utils.formatBytes32String(data.governanceType!),
      ethers.utils.formatBytes32String(data.projectName!),
      data.proposalDescription!,
      daoContracts.governanceToken,
      daoContracts.membershipNFT,
      data.votingPeriod!,
      data.quorumPercentage!,
    ]);
    proposeTx = await governance.proposeWithTarget(
      [box.address],
      [0],
      [encodedFunctionToCall],
      data.proposalDescription,
      ethers.utils.formatBytes32String(data.target!)
    );
    proposeReceipt = await proposeTx.wait();
  } else if (data.target === "closeDAO") {
    const encodeFunctionCall = governance.interface.encodeFunctionData(
      data.target
    );
    proposeTx = await governance.proposeWithTarget(
      [governance.address],
      [0],
      [encodeFunctionCall],
      data.proposalDescription,
      ethers.utils.formatBytes32String(data.target!)
    );
    proposeReceipt = await proposeTx.wait();
  } else if (data.target === "closeDAO") {
    const encodeFunctionCall = governance.interface.encodeFunctionData(
      data.target
    );
    proposeTx = await governance.proposeWithTarget(
      [governance.address],
      [0],
      [encodeFunctionCall],
      data.proposalDescription,
      ethers.utils.formatBytes32String(data.target!)
    );
    proposeReceipt = await proposeTx.wait();
  } else if (data.target === "setVotingPeriod") {
    const encodeFunctionCall = governance.interface.encodeFunctionData(
      data.target,
      [data.votingPeriod!]
    );
    proposeTx = await governance.proposeWithTarget(
      [governance.address],
      [0],
      [encodeFunctionCall],
      data.proposalDescription,
      ethers.utils.formatBytes32String(data.target!)
    );
    proposeReceipt = await proposeTx.wait();
  } else if (data.target === "setProposalThreshold") {
    const encodeFunctionCall = governance.interface.encodeFunctionData(
      data.target,
      [data.proposalThreshold!]
    );
    proposeTx = await governance.proposeWithTarget(
      [governance.address],
      [0],
      [encodeFunctionCall],
      data.proposalDescription,
      ethers.utils.formatBytes32String(data.target!)
    );
    proposeReceipt = await proposeTx.wait();
  } else if (data.target === "setQuorumFraction") {
    const encodeFunctionCall = governance.interface.encodeFunctionData(
      data.target,
      [data.quorumPercentage!]
    );
    proposeTx = await governance.proposeWithTarget(
      [governance.address],
      [0],
      [encodeFunctionCall],
      data.proposalDescription,
      ethers.utils.formatBytes32String(data.target!)
    );
    proposeReceipt = await proposeTx.wait();
  }

  console.log("PROPOSE RECEIPT STATUS>>>", proposeReceipt.status);
  console.log(
    "PROPOSAL ID>>>",
    proposeReceipt.events![0].args.proposalId.toString()
  );
  console.log("PROPOSER>>>", proposeReceipt.events![0].args.proposer);

  // if (network.chainId === 31337) {
  //   await moveBlocks(2) // Move 2 blocks to mine the proposal
  // }
  console.log("PROPOSER RECEIPT>>>", proposeReceipt);

  return proposeReceipt;
};

const getProposalThreshold = async (
  signer: ethers.providers.JsonRpcSigner,
  daoContracts: DAOContracts | SubDAOContracts
) => {
  const governance = new ethers.Contract(
    daoContracts.organizationGovernance,
    OrganizationGovernanceABI.abi,
    signer
  ) as OrganizationGovernance;
  return (await governance.proposalThreshold()).toNumber();
};

export const CreateProposalOrgDao = () => {
  const params = useParams();
  const addresses = JSON.parse(decodeURIComponent(params!.deployed!));
  const [daoContracts, setDaoContracts] = useState<
    DAOContracts | SubDAOContracts
  >(addresses);
  const [isSubDao, setIsSubDao] = useState<boolean>(false);
  const [proposalThreshold, setProposalThreshold] = useState<number>(0);
  const [network, setNetwork] = useState<ethers.providers.Network>();
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormFields>();
  const [error, setError] = useState<string>("");
  const { account } = useContext(WalletConnectContext);
  const navigate = useNavigate();

  const fetchDaoData = async () => {
    if (account) {
      const { network, signer } = await initWeb3(account);
      setNetwork(network);
      setSigner(signer);
      console.log({ network });
      if ("projectGovernance" in daoContracts) {
        setIsSubDao(true);
      }
      const proposalThreshold = await getProposalThreshold(
        signer,
        daoContracts
      );
      console.log("PROPOSAL THRESHOLD>>>", proposalThreshold);
    }
  };

  useEffect(() => {
    if (account) {
      fetchDaoData().then((r) => console.log(r));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const onSubmit = async (data: any) => {
    console.log(data);
    console.log(formValues); // watch input value by passing the name of it
    try {
      if (signer && network && daoContracts) {
        setError("");
        // const { signer, network, provider } = await initWeb3(account);
        // Execute deployDAO when the component mounts
        const proposeStatus = await submitProposal({
          daoContracts,
          data,
          signer,
          network,
        });
        if (proposeStatus) {
          const jsonDeployed = JSON.stringify(daoContracts);
          if ("projectGovernance" in daoContracts) {
            navigate(
              `/organization/project/${encodeURIComponent(jsonDeployed)}`
            );
          } else {
            navigate(`/organization/${encodeURIComponent(jsonDeployed)}`);
          }
        }
      }
    } catch (error) {
      const e = error as Error;
      console.log(e);
      if (e.message.includes("properties")) {
        setError(
          "Please fill out all the fields in the form before submitting."
        );
      } else {
        console.log("An error occurred:", error);
        setError("An error occurred. Please try again."); // Set the error message in state
      }
    }
  };

  const formValues = watch();

  const handleTargetChange = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setSelectedTarget(event.target.value);
  };

  return (
    <>
      <div className="m-20">
        <div className="flex gap-4 border-b-2 pb-6">
          <h1 className="text-body-lg md:text-display-sm font-bold text-gray-900 dark:text-gray-50">
            Propose:
          </h1>

          <div className="bg-red-200 rounded-lg p-2  ml-20">
            You need to vote on at least {proposalThreshold} proposals to be
            able to propose. [proposal threshold]
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
          <div className="flex gap-4">
            <label
              htmlFor="proposalName"
              className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
            >
              Proposal Description:
            </label>
            <input
              type="text"
              id="proposalName"
              placeholder="Give your proposal a meaningful story"
              className={INPUT_CLASSES}
              {...register("proposalDescription", {
                required: true,
                maxLength: 255,
                minLength: 8,
              })}
            />
            {errors.proposalDescription && (
              <div className="text-red-500 font-medium text-body-sm">
                <span className="text-body-sm text-red-500">
                  This field is required. Must be between 8-255 characters long.
                </span>
              </div>
            )}
          </div>
          <p className="text-body-lg font-medium mt-10 text-gray-900 dark:text-gray-50 w-80">
            <QuestionMarkTooltip
              text={
                "Choose a change on a DAO functionality: such as, deploy new governance DAO, change proposalThreshold etc."
              }
            >
              Function calls on execute:
            </QuestionMarkTooltip>
          </p>
          <div className="flex gap-4 mt-8">
            <label
              htmlFor="targets"
              className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
            >
              Targets
            </label>
            <select
              className={INPUT_CLASSES}
              {...register("target", {
                required: false,
              })}
              name="target"
              onChange={handleTargetChange}
            >
              <option value="" disabled selected>
                Select an option
              </option>
              <option value="store">Store Value</option>
              {!isSubDao && <option value="deploySubDAO">Deploy SubDAO</option>}
              {!isSubDao && (
                <option value="setVotingPeriod">Change Voting Period</option>
              )}
              {!isSubDao && (
                <option value="setProposalThreshold">
                  Change Proposal Threshold
                </option>
              )}
              {!isSubDao && (
                <option value="setQuorumFraction">
                  Change Quorum Fraction
                </option>
              )}
              <option value="withdraw">Withdraw Balance</option>
              {isSubDao && (
                <option value="closeDAO">
                  Close this sub-governance project
                </option>
              )}
            </select>
            {errors.target && (
              <span className="text-body-sm text-red-500">
                This field is required.
              </span>
            )}
          </div>
          {selectedTarget === "deploySubDAO" && (
            <div>
              <div className="flex gap-4 mt-8">
                <label
                  htmlFor="projectName"
                  className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
                >
                  Name your subDAO project
                </label>
                <input
                  type="text"
                  id="projectName"
                  placeholder="Name your project (must be between 8-30 characters long)"
                  className={INPUT_CLASSES}
                  {...register("projectName", {
                    required: true,
                    maxLength: 30,
                    minLength: 8,
                  })}
                />
                {errors.projectName && (
                  <span className="text-body-sm text-red-500">
                    This field is required. Must be between 8-30 characters
                    long.
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
            </div>
          )}

          {selectedTarget === "withdraw" && (
            <div>
              <div className="flex gap-4 mt-8">
                <label
                  htmlFor="multiSigField"
                  className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80"
                >
                  <QuestionMarkTooltip text={"Addresses of receiver account"}>
                    Add destination address*
                  </QuestionMarkTooltip>
                </label>
                <input
                  {...register("account", { required: true })}
                  placeholder="0xcf5***66"
                  className={INPUT_CLASSES}
                  defaultValue={"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"} // 2 minutes
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.account && (
                    <span>Entering the destination account address</span>
                  )}
                </div>
                {/* Render the additional field component here */}
              </div>
              <div className="flex gap-4 mt-8">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80">
                  <QuestionMarkTooltip text="The amount required to withdraw. See contract current balance.">
                    Amount
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("amount", { required: true })}
                  placeholder="e.g. 1 (0.000000000000000001 ether)"
                  type="number"
                  className={INPUT_CLASSES}
                  defaultValue={"1"}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.amount && <span>Withdrawing amount is required</span>}
                </div>
              </div>
            </div>
          )}

          {selectedTarget === "store" && (
            <div>
              <div className="flex gap-4 mt-8">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80">
                  <QuestionMarkTooltip text="Standard proposal will trivially store a value in the box coctract. For testing purposes.">
                    Store Value *
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("storeValue", { required: true })}
                  placeholder="e.g. 25 (0.25)"
                  type="number"
                  className={INPUT_CLASSES}
                  defaultValue={"95"}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.storeValue && (
                    <span>The store value is required</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTarget === "setVotingPeriod" && (
            <div>
              <div className="flex gap-4 mt-8">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80">
                  <QuestionMarkTooltip
                    text="Voting period is measured in blocks. Give the number
                  of blocks you want a proposal to live for."
                  >
                    Voting Period *
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("votingPeriod", { required: true })}
                  placeholder="e.g. 7200 (1 day)"
                  type="number"
                  className={INPUT_CLASSES}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.votingPeriod && (
                    <span>The voting period parameter is required.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTarget === "setProposalThreshold" && (
            <div>
              <div className="flex gap-4 mt-8">
                <span className="text-body-lg font-medium text-gray-900 dark:text-gray-50 w-80">
                  <QuestionMarkTooltip text="Amount of votes one need to have cast to be able to propose.">
                    Proposal Threshold *
                  </QuestionMarkTooltip>
                </span>
                <input
                  {...register("proposalThreshold", { required: true })}
                  placeholder="e.g. 2 (votes cast required)"
                  type="number"
                  className={INPUT_CLASSES}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.proposalThreshold && (
                    <span>The proposal threshold parameter is required.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTarget === "setQuorumFraction" && (
            <div>
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
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {errors.quorumPercentage && (
                    <span>The store value is required</span>
                  )}
                </div>
              </div>
            </div>
          )}

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
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </>
  );
};
