import {
  CurrentBlockData,
  getCurrentVotingPower,
  ProposalData,
} from "../pages/Organization";
import { initWeb3 } from "../pages/CreateOrgDao";
import { ethers } from "ethers";
import { useState } from "react";
import { BaseButton, PrimaryButton } from "./Buttons";
import TokenBasedGovernanceABI from "infra-dao/artifacts/contracts/governance/TokenBasedGovernance.sol/TokenBasedGovernance.json";
import WeightedGovernanceABI from "infra-dao/artifacts/contracts/governance/WeightedGovernance.sol/WeightedGovernance.json";
import QuadraticGovernanceABI from "infra-dao/artifacts/contracts/governance/QuadraticGovernance.sol/QuadraticGovernance.json";
import MultiSigGovernanceABI from "infra-dao/artifacts/contracts/governance/MultiSigGovernance.sol/MultiSigGovernance.json";
import {
  MultiSigGovernance,
  QuadraticGovernance,
  TokenBasedGovernance,
  WeightedGovernance,
} from "../../../infra-dao/typechain-types";
import { SubDAOContracts } from "../pages/CreateProjectDao";
import { INPUT_CLASSES } from "../actions";

export function getGovernance(
  signer: ethers.providers.JsonRpcSigner,
  subDAOContracts: SubDAOContracts
) {
  let governance: ethers.Contract;
  const { projectGovernance, projectGovernanceType } = subDAOContracts;

  switch (projectGovernanceType) {
    case "tokenBased":
      governance = new ethers.Contract(
        projectGovernance!,
        TokenBasedGovernanceABI.abi,
        signer
      ) as TokenBasedGovernance;
      break;
    case "weighted":
    case "quadratic":
      const governanceABI =
        projectGovernanceType === "weighted"
          ? WeightedGovernanceABI.abi
          : QuadraticGovernanceABI.abi;
      governance = new ethers.Contract(
        projectGovernance!,
        governanceABI,
        signer
      ) as WeightedGovernance | QuadraticGovernance;
      break;
    case "multiSig":
      governance = new ethers.Contract(
        projectGovernance!,
        MultiSigGovernanceABI.abi,
        signer
      ) as MultiSigGovernance;
      break;
    default:
      throw new Error("Invalid project governance type.");
  }
  return governance;
}

const voteForProposal = async (
  signer: ethers.providers.JsonRpcSigner,
  subDAOContracts: SubDAOContracts,
  proposalId: string,
  voteType: number,
  votingPower?: number
) => {
  let governance = getGovernance(signer, subDAOContracts);
  let tx;

  switch (subDAOContracts.projectGovernanceType) {
    case "tokenBased":
    case "multiSig":
      tx = await governance["castVote(uint256,uint8)"](proposalId, voteType);
      break;
    case "weighted":
    case "quadratic":
      tx = await governance["castVote(uint256,uint8,uint256,string)"](
        proposalId,
        voteType,
        votingPower,
        ""
      );
      break;
    default:
      throw new Error("Invalid project governance type.");
  }

  await tx.wait();
  console.log(tx);
  return tx.confirmations;
};

export const ProposalCardSubDAO = ({
  proposal,
  subDAOContracts,
  signer,
  account,
  onVoteActionChange,
}: {
  proposal: ProposalData;
  subDAOContracts: SubDAOContracts;
  signer: ethers.providers.JsonRpcSigner;
  account: string;
  onVoteActionChange: () => void;
}) => {
  const [blockNumber, setBlockNumber] = useState(0);
  const [currentBlockData, setCurrentBlockData] = useState<CurrentBlockData>({
    blockNumber: 0,
    votingPower: 0,
  });
  const [voteValue, setVoteValue] = useState(0);
  const [governanceType, setGovernanceType] = useState(
    subDAOContracts.projectGovernanceType
  );
  const castVote = async (proposalId: string, voteType: number, vp: number) => {
    if (signer && subDAOContracts) {
      const { network, signer, provider } = await initWeb3(account);
      const votingPower = await getCurrentVotingPower(
        signer,
        subDAOContracts,
        account
      );
      if (votingPower < vp) {
        setErrorMessage("You don't have enough voting power to vote");
        return;
      }
      const res = await voteForProposal(
        signer,
        subDAOContracts,
        proposalId.toString(),
        voteType,
        vp
      );

      const blockNumber = await provider.getBlock("latest");
      setBlockNumber(blockNumber.number);
      setCurrentBlockData({ blockNumber: blockNumber.number, votingPower });
      console.log("VOTE RES>>>", res);
      onVoteActionChange();
    }
  };

  async function executeProposal(
    signer: ethers.providers.JsonRpcSigner,
    subDAOContracts: SubDAOContracts,
    proposalId: string
  ) {
    const governance = getGovernance(signer, subDAOContracts);

    const proposal = await governance.proposals(proposalId);
    // In a database, store the proposal transaction data coming from the ProposalCreated Event
    // const { targets, values, calldatas, descriptionHash } = decodeProposalId(proposalId);
    // console.log("Queuing")
    // const queueTx = await governance.queue(
    //   targets,
    //   values,
    //   calldatas,
    //   descriptionHash
    // );
    // console.log("Queued")
    // // if (signer.provider === ) {
    // //   await moveTime(MIN_DELAY + 1);
    // //   await moveBlocks(1);
    // // }
    // await queueTx.wait(1);
    // console.log("Executing");
    // const executeTx = await governance.execute(
    //   targets,
    //   values,
    //   calldatas,
    //   descriptionHash
    // );
    // await executeTx.wait(1);
  }

  const handleExecute = async () => {
    if (account && subDAOContracts) {
      const { signer } = await initWeb3(account);
      await executeProposal(signer, subDAOContracts, proposal.id.toString());
    }
  };

  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className="w-full flex flex-col gap-6 text-gray-900 dark:text-gray-50">
      <div className="flex flex-col gap-3 text-body-md">
        <div className="[word-break:break-word]">ID: {proposal.id}</div>
        <div className="[word-break:break-word]">Target: {proposal.target}</div>
        <div className="[word-break:break-word]">
          Proposer: {proposal.proposerAddress}
        </div>
        <div className="[word-break:break-word]">
          Deadline: {proposal.deadline}
        </div>
        {/*<div className="[word-break:break-word]"}>CurrentBlock: {proposal.currentBlockNumber}</div>*/}
        <div className="[word-break:break-word]">State: {proposal.state}</div>
      </div>

      <div className="mx-auto md:max-w-md w-full flex flex-col gap-3 items-center">
        <span className="w-full rounded-2xl flex items-center justify-evenly gap-6 border border-gray-900 dark:border-gray-50 p-6 text-gray-900 dark:text-gray-50 text-body-lg font-medium">
          <span>Votes: {proposal.voters}</span>
          <span>|</span>
          <span>For: {proposal.votesFor == null ? 0 : proposal.votesFor}</span>
          <span>|</span>
          <span>
            Against: {proposal.votesAgainst == null ? 0 : proposal.votesAgainst}
          </span>
        </span>

        {proposal.state === "Succeeded" ? (
          <PrimaryButton
            type="button"
            variant="PRIMARY"
            onClick={handleExecute}
          >
            Execute
          </PrimaryButton>
        ) : (
          <div>
            {governanceType === "weighted" || governanceType === "quadratic" ? (
              <div className="w-full flex flex-col md:flex-row items-center gap-2">
                {/* Form field for entering the vote value */}
                <input
                  type="number"
                  value={voteValue}
                  onChange={(e) => setVoteValue(e.target.valueAsNumber)}
                  placeholder="e.g. 1 (for 1 vote)"
                  className={INPUT_CLASSES}
                  defaultValue={1} // 2 minutes
                  min={1}
                />
                <div className="text-red-500 font-medium text-body-sm">
                  {/*{errors.requiredSignatures && (*/}
                  {/*  <span>*/}
                  {/*      Entering the number of required signatures is required*/}
                  {/*    </span>*/}
                  {/*)}*/}
                </div>
              </div>
            ) : (
              () => {}
            )}
            <div className="w-full flex flex-col md:flex-row items-center gap-2">
              <BaseButton
                type="button"
                variant="GREEN"
                className="w-full flex justify-center"
                onClick={() => {
                  castVote(proposal.id, 1, voteValue)
                    .then((r) => console.log(r))
                    .catch((e) => {
                      console.log(e);
                      if (e.message.includes("voting power")) {
                        setErrorMessage("You do not have enough voting power");
                      } else if (e.message.includes("once")) {
                        setErrorMessage("You already voted on this proposal.");
                      } else if (e.message.includes("closed")) {
                        setErrorMessage("Voting is closed.");
                      }
                    });
                }}
              >
                FOR
              </BaseButton>
              <BaseButton
                type="button"
                variant="RED"
                className="w-full flex justify-center"
                onClick={() => {
                  castVote(proposal.id, 0, voteValue)
                    .then((r) => console.log(r))
                    .catch((e) => {
                      console.log(e.message);
                      if (e.message.includes("voting power")) {
                        setErrorMessage(
                          "You did not have enough voting power at the moment of proposal creation."
                        );
                      } else if (e.message.includes("once")) {
                        setErrorMessage("You already voted on this proposal.");
                      } else if (e.message.includes("closed")) {
                        setErrorMessage("Voting is closed.");
                      }
                    });
                }}
              >
                AGAINST
              </BaseButton>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="text-red-500 font-medium text-body-sm">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};
